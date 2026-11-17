import type { ContentFragment, FragmentData } from "../types";
import { uuidFor } from "./helpers";

export interface FragmentSeed {
  path: string;
  model: string;
  title: string;
  description?: string;
  tags?: string[];
  /** false = draft that only exists on Author. */
  published?: boolean;
  lastModified: string;
  lastModifiedBy?: string;
  master: FragmentData;
  variations?: Record<string, Partial<FragmentData>>;
}

export function fragment(seed: FragmentSeed): ContentFragment {
  const content = { master: seed.master, variations: seed.variations ?? {} };
  const by = seed.lastModifiedBy ?? "admin";
  return {
    path: seed.path,
    id: uuidFor(`fragment:${seed.path}`),
    model: seed.model,
    title: seed.title,
    description: seed.description ?? "",
    tags: seed.tags ?? [],
    created: seed.lastModified,
    lastModified: seed.lastModified,
    lastModifiedBy: by,
    content,
    published:
      seed.published === false
        ? null
        : { content: structuredClone(content), at: seed.lastModified, by },
  };
}
