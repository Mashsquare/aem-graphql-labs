import type { ReactNode } from "react";
import { aemImageUrl } from "./image";
import type { RichTextNode } from "./types";

/**
 * Renders AEM rich text JSON (Multi line text, `json` format) as React — the reusable version of
 * the Lab 10 exercise. References are resolved through `_references` by repository path.
 */
export interface RichTextReference {
  __typename?: string;
  _path?: string;
  _dynamicUrl?: string | null;
  width?: number | null;
  height?: number | null;
  slug?: string | null;
  title?: string | null;
}

export interface AemRichTextProps {
  nodes: RichTextNode[] | null | undefined;
  references?: RichTextReference[];
  /** Turns a referenced fragment into an app URL (return null to render plain text). */
  fragmentHref?: (reference: RichTextReference) => string | null;
}

export function AemRichText({ nodes, references = [], fragmentHref = () => null }: AemRichTextProps) {
  const byPath = new Map(references.filter((reference) => reference._path).map((reference) => [reference._path!, reference]));

  const render = (node: RichTextNode, key: number): ReactNode => {
    const children = () => ("content" in node ? node.content.map(render) : null);
    switch (node.nodeType) {
      case "paragraph":
        return <p key={key}>{children()}</p>;
      case "header": {
        const Tag = node.style;
        return <Tag key={key}>{children()}</Tag>;
      }
      case "text": {
        let element: ReactNode = node.value;
        for (const variant of node.format?.variants ?? []) {
          element = variant === "bold" ? <strong>{element}</strong> : variant === "italic" ? <em>{element}</em> : <u>{element}</u>;
        }
        return <span key={key}>{element}</span>;
      }
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
          const image = byPath.get(node.data.path);
          if (!image?._dynamicUrl) return null;
          // eslint-disable-next-line @next/next/no-img-element
          return <img key={key} src={aemImageUrl(image._dynamicUrl, { width: 1200 })} width={image.width ?? undefined} height={image.height ?? undefined} alt="" />;
        }
        const label = "value" in node ? node.value : "";
        const target = byPath.get(node.data.href);
        const href = target ? fragmentHref(target) : null;
        return href ? (
          <a key={key} href={href}>
            {label}
          </a>
        ) : (
          <span key={key}>{label}</span>
        );
      }
      default: {
        const unknown = node as { content?: RichTextNode[] };
        return unknown.content ? <span key={key}>{unknown.content.map(render)}</span> : null;
      }
    }
  };

  return <>{(nodes ?? []).map(render)}</>;
}
