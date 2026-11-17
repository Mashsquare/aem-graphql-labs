/** Provided UI for Lab 12. */
import Link from "next/link";
import { Badge, EmptyState, Panel, buttonClass, formatPrice } from "@/components/lab-ui";
import type { AdventureMetadata, AdventureVariation, LocalizedAdventure, TypedMetaData, VariationRow } from "./types";

export interface VariationsApi {
  getAdventureVariation: (slug: string, variation?: string, locale?: string) => Promise<AdventureVariation | null>;
  getAllVariations: (slug: string) => Promise<VariationRow[]>;
  getLocalizedAdventures: (locale: string) => Promise<LocalizedAdventure[]>;
  getAdventureMetadata: (path: string) => Promise<AdventureMetadata | null>;
  metadataValue: (metadata: TypedMetaData, name: string) => string | string[] | null | undefined;
}

const SLUGS = ["bali-surf-camp", "cycling-tuscany", "ski-touring-mont-blanc", "downhill-skiing-wyoming", "beervana-portland"];
const VARIATIONS = ["master", "summer", "winter"];
const LOCALES = ["en", "de"];

function href(params: { slug: string; variation: string; locale: string }) {
  return `?${new URLSearchParams(params).toString()}`;
}

export async function VariationsView({
  api,
  slug = "bali-surf-camp",
  variation = "master",
  locale = "en",
}: {
  api: VariationsApi;
  slug?: string;
  variation?: string;
  locale?: string;
}) {
  const requested = variation === "master" ? undefined : variation;
  const [adventure, rows, localized] = await Promise.all([
    api.getAdventureVariation(slug, requested, locale),
    api.getAllVariations(slug),
    api.getLocalizedAdventures(locale),
  ]);
  const metadata = adventure ? await api.getAdventureMetadata(adventure._path) : null;
  const pill = (active: boolean) => `${buttonClass} ${active ? "border-accent text-accent" : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted">Adventure</span>
          {SLUGS.map((value) => (
            <Link key={value} href={href({ slug: value, variation, locale })} className={pill(value === slug)}>
              {value}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted">variation</span>
          {VARIATIONS.map((value) => (
            <Link key={value} href={href({ slug, variation: value, locale })} className={pill(value === variation)}>
              {value}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted">_locale</span>
          {LOCALES.map((value) => (
            <Link key={value} href={href({ slug, variation, locale: value })} className={pill(value === locale)}>
              {value}
            </Link>
          ))}
        </div>
      </div>

      <Panel
        title={adventure?.title ?? "Not available in this language"}
        description={adventure ? <code className="text-xs">{adventure._path}</code> : `No "${slug}" under /content/dam/wknd-shared/${locale}/`}
        actions={
          adventure ? (
            <>
              <Badge>requested: {variation}</Badge>
              <Badge tone={adventure._variation === variation ? "ok" : "warn"}>got _variation: {adventure._variation}</Badge>
            </>
          ) : null
        }
      >
        {adventure ? (
          <div className="space-y-2 text-sm">
            <p className="text-lg font-medium">
              {formatPrice(adventure.price)} · {adventure.tripLength}
            </p>
            <p>{adventure.description?.plaintext}</p>
            <p className="text-muted">_variations of this fragment: {adventure._variations.length ? adventure._variations.join(", ") : "none (master only)"}</p>
          </div>
        ) : (
          <EmptyState>Only some adventures have German language copies.</EmptyState>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="includeVariations: true" description="Master and every variation as separate items">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row._variation} className="border-t border-line first:border-0">
                  <td className="py-2 font-mono text-xs">{row._variation}</td>
                  <td>{row.title}</td>
                  <td className="text-right">{formatPrice(row.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={`_locale: "${locale}"`} description={`${localized.length} adventures in this language copy`}>
          <ul className="space-y-1 text-sm">
            {localized.map((item) => (
              <li key={item._path}>
                {item.title} <span className="text-muted">· {item.tripLength}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {metadata ? (
        <Panel title="Fragment metadata" description="_model, _tags and _metadata — not fields of the model">
          <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">_model</dt>
            <dd>
              {metadata._model.title} <span className="font-mono text-xs text-muted">{metadata._model._path}</span>
            </dd>
            <dt className="text-muted">_tags</dt>
            <dd className="flex flex-wrap gap-1">
              {metadata._tags?.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </dd>
            {["title", "cq:lastModifiedBy", "cq:lastModified", "cq:lastReplicated", "jcr:created"].map((name) => (
              <div key={name} className="contents">
                <dt className="font-mono text-xs text-muted">{name}</dt>
                <dd>{String(api.metadataValue(metadata._metadata, name) ?? "—")}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      ) : null}
    </div>
  );
}
