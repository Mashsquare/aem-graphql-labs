import type { ReactNode } from "react";
import { aemImageUrl } from "@/lib/aem/image";
import type { RichTextNode } from "@/lib/aem/types";
import type { AdventureReference, ArticleReference, ImageReference } from "@/labs/10-aem-references-rich-text/types";

type ReferenceMap = Map<string, ArticleReference & { _path?: string }>;

function wrapText(node: Extract<RichTextNode, { nodeType: "text" }>): ReactNode {
  let element: ReactNode = node.value;
  for (const variant of node.format?.variants ?? []) {
    if (variant === "bold") element = <strong>{element}</strong>;
    else if (variant === "italic") element = <em>{element}</em>;
    else if (variant === "underline") element = <u>{element}</u>;
  }
  return element;
}

function renderNode(node: RichTextNode, references: ReferenceMap, key: number): ReactNode {
  const children = () => ("content" in node ? node.content.map((child, index) => renderNode(child, references, index)) : null);

  switch (node.nodeType) {
    case "paragraph":
      return <p key={key}>{children()}</p>;
    case "header": {
      const Tag = node.style;
      return <Tag key={key}>{children()}</Tag>;
    }
    case "text":
      return <span key={key}>{wrapText(node)}</span>;
    case "link":
      return (
        <a key={key} href={node.data.href} target={node.data.target} rel={node.data.target ? "noreferrer" : undefined}>
          {node.value}
        </a>
      );
    case "unordered-list":
      return <ul key={key}>{children()}</ul>;
    case "ordered-list":
      return <ol key={key}>{children()}</ol>;
    case "list-item":
      return <li key={key}>{children()}</li>;
    case "reference": {
      if ("path" in node.data) {
        // Inline asset: the node only carries the DAM path; the delivery URL is in _references.
        const image = references.get(node.data.path) as ImageReference | undefined;
        if (image?.__typename !== "ImageRef" || !image._dynamicUrl) return null;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={key} src={aemImageUrl(image._dynamicUrl, { width: 1200 })} width={image.width ?? undefined} height={image.height ?? undefined} alt="" />
        );
      }
      // Inline fragment link: resolve the fragment to build an app URL (slug), not a DAM path.
      const adventure = references.get(node.data.href) as AdventureReference | undefined;
      const label = "value" in node ? node.value : "";
      if (adventure?.__typename !== "AdventureModel") return <span key={key}>{label}</span>;
      return (
        <a key={key} href={`/capstone/adventures/${adventure.slug}`}>
          {label}
        </a>
      );
    }
    default: {
      // Unknown node types (new RTE features, plugins…): degrade gracefully instead of crashing.
      const unknown = node as { content?: RichTextNode[] };
      return unknown.content ? <span key={key}>{unknown.content.map((child, index) => renderNode(child, references, index))}</span> : null;
    }
  }
}

export function RichText({ nodes, references }: { nodes: RichTextNode[]; references: ArticleReference[] }): ReactNode {
  const map: ReferenceMap = new Map();
  for (const reference of references) {
    if ("_path" in reference) map.set(reference._path, reference);
  }
  return <>{nodes.map((node, index) => renderNode(node, map, index))}</>;
}
