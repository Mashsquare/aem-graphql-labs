import type { Asset, ContentFragment, FragmentContent, FragmentData, Tier } from "./types";
import type { AssetTransformInput } from "./assets";
import type { MockAemStore } from "./store";

/** Per root-field settings that also apply to nested references (variation, image transforms). */
export interface ResolveScope {
  tier: Tier;
  variation?: string;
  transform?: AssetTransformInput;
}

export interface FragmentView {
  kind: "fragment";
  fragment: ContentFragment;
  /** "master" or the name of the variation that was applied. */
  variation: string;
  values: FragmentData;
  scope: ResolveScope;
}

export interface AssetView {
  kind: "asset";
  asset: Asset;
  scope: ResolveScope;
}

export type ReferenceView = FragmentView | AssetView;

export function viewOf(
  fragment: ContentFragment,
  content: FragmentContent,
  variation: string | undefined,
  scope: ResolveScope,
): FragmentView {
  const overrides = variation ? content.variations[variation] : undefined;
  if (variation && overrides) {
    return {
      kind: "fragment",
      fragment,
      variation,
      values: { ...content.master, ...overrides } as FragmentData,
      scope,
    };
  }
  // Like AEM: a missing variation silently falls back to master.
  return { kind: "fragment", fragment, variation: "master", values: content.master, scope };
}

/** All views of a fragment: master + every named variation (includeVariations: true). */
export function allVariationViews(fragment: ContentFragment, content: FragmentContent, scope: ResolveScope): FragmentView[] {
  return [
    viewOf(fragment, content, undefined, scope),
    ...Object.keys(content.variations).map((name) => viewOf(fragment, content, name, scope)),
  ];
}

export function resolveFragmentPath(store: MockAemStore, path: unknown, scope: ResolveScope): FragmentView | null {
  if (typeof path !== "string") return null;
  const fragment = store.fragments.get(path);
  if (!fragment) return null;
  const content = store.contentFor(fragment, scope.tier);
  // A reference to something that is not published resolves to null on Publish.
  if (!content) return null;
  return viewOf(fragment, content, scope.variation, scope);
}

export function resolveAssetPath(store: MockAemStore, path: unknown, scope: ResolveScope): AssetView | null {
  if (typeof path !== "string") return null;
  const asset = store.assets.get(path);
  return asset ? { kind: "asset", asset, scope } : null;
}
