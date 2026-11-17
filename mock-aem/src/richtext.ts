import type { RichText, RichTextNode } from "./types";

/**
 * AEM exposes every Multi line text field as a `MultiFormatString` with four renderings of the
 * same content: html, plaintext, markdown and json. The mock stores the json tree and derives the
 * other three from it.
 */

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inlineHtml(node: RichTextNode): string {
  switch (node.nodeType) {
    case "text": {
      let html = escapeHtml(node.value);
      for (const variant of node.format?.variants ?? []) {
        const tag = variant === "bold" ? "b" : variant === "italic" ? "i" : "u";
        html = `<${tag}>${html}</${tag}>`;
      }
      return html;
    }
    case "link": {
      const target = node.data.target ? ` target="${escapeHtml(node.data.target)}"` : "";
      return `<a href="${escapeHtml(node.data.href)}"${target}>${escapeHtml(node.value)}</a>`;
    }
    case "reference":
      if ("path" in node.data) return `<img src="${escapeHtml(node.data.path)}" alt="">`;
      return `<a href="${escapeHtml(node.data.href)}">${escapeHtml("value" in node ? node.value : "")}</a>`;
    default:
      return blockHtml(node);
  }
}

function blockHtml(node: RichTextNode): string {
  switch (node.nodeType) {
    case "paragraph":
      return `<p>${node.content.map(inlineHtml).join("")}</p>`;
    case "header":
      return `<${node.style}>${node.content.map(inlineHtml).join("")}</${node.style}>`;
    case "unordered-list":
      return `<ul>${node.content.map(blockHtml).join("")}</ul>`;
    case "ordered-list":
      return `<ol>${node.content.map(blockHtml).join("")}</ol>`;
    case "list-item":
      return `<li>${node.content.map(inlineHtml).join("")}</li>`;
    default:
      return inlineHtml(node);
  }
}

function inlineText(node: RichTextNode): string {
  switch (node.nodeType) {
    case "text":
    case "link":
      return node.value;
    case "reference":
      return "value" in node ? node.value : "";
    default:
      return node.content.map(inlineText).join("");
  }
}

function blockText(node: RichTextNode): string[] {
  switch (node.nodeType) {
    case "unordered-list":
    case "ordered-list":
      return node.content.map(inlineText);
    case "reference":
      return "value" in node ? [node.value] : [];
    default:
      return [inlineText(node)];
  }
}

function inlineMarkdown(node: RichTextNode): string {
  switch (node.nodeType) {
    case "text": {
      let md = node.value;
      const variants = node.format?.variants ?? [];
      if (variants.includes("bold")) md = `**${md}**`;
      if (variants.includes("italic")) md = `_${md}_`;
      return md;
    }
    case "link":
      return `[${node.value}](${node.data.href})`;
    case "reference":
      return "path" in node.data ? `![](${node.data.path})` : `[${"value" in node ? node.value : ""}](${node.data.href})`;
    default:
      return node.content.map(inlineMarkdown).join("");
  }
}

function blockMarkdown(node: RichTextNode): string {
  switch (node.nodeType) {
    case "header":
      return `${"#".repeat(Number(node.style.slice(1)))} ${node.content.map(inlineMarkdown).join("")}`;
    case "unordered-list":
      return node.content.map((item) => `- ${inlineMarkdown(item)}`).join("\n");
    case "ordered-list":
      return node.content.map((item, index) => `${index + 1}. ${inlineMarkdown(item)}`).join("\n");
    default:
      return inlineMarkdown(node);
  }
}

export const isRichText = (value: unknown): value is RichText =>
  typeof value === "object" && value !== null && (value as RichText).__richText === true;

export const richTextFormats = {
  html: (value: RichText) => value.nodes.map(blockHtml).join("\n"),
  plaintext: (value: RichText) => value.nodes.flatMap(blockText).filter(Boolean).join("\n"),
  markdown: (value: RichText) => value.nodes.map(blockMarkdown).join("\n\n"),
  json: (value: RichText) => value.nodes,
};

/** Every inline reference (assets by `data.path`, fragments by `data.href`) in a rich text tree. */
export function collectInlineReferences(value: RichText): { assets: string[]; fragments: string[] } {
  const assets: string[] = [];
  const fragments: string[] = [];
  const visit = (node: RichTextNode) => {
    if (node.nodeType === "reference") {
      if ("path" in node.data) assets.push(node.data.path);
      else fragments.push(node.data.href);
    }
    if ("content" in node) node.content.forEach(visit);
  };
  value.nodes.forEach(visit);
  return { assets, fragments };
}
