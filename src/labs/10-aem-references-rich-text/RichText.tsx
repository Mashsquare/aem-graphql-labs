import type { ReactNode } from "react";
import type { RichTextNode } from "@/lib/aem/types";
import { todo } from "@/lib/todo";
import type { ArticleReference } from "./types";

/**
 * Task 3 — render AEM's rich text JSON as React elements (no dangerouslySetInnerHTML).
 *
 *   paragraph                 -> <p>
 *   header (style "h2"…)      -> <h2>…
 *   text                      -> the value, wrapped in <strong>/<em>/<u> for format.variants bold/italic/underline
 *   link                      -> <a href={data.href}> (target + rel="noreferrer" when data.target is set)
 *   unordered-list / ordered-list / list-item -> <ul> / <ol> / <li>
 *   reference with data.path  -> an inline image: look up the ImageRef in `references` by _path,
 *                                render <img src={aemImageUrl(_dynamicUrl, { width: 1200 })} width height alt="">
 *   reference with data.href  -> a fragment link: look up the AdventureModel by _path,
 *                                render <a href={`/capstone/adventures/${slug}`}>{node.value}</a>
 *   anything else             -> render its `content` children if it has any, otherwise nothing.
 *                                Never throw on an unknown nodeType — authors WILL find new ones.
 */
export function RichText({ nodes, references }: { nodes: RichTextNode[]; references: ArticleReference[] }): ReactNode {
  void nodes;
  void references;
  return todo("implement RichText in RichText.tsx");
}
