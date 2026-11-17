import Link from "next/link";
import path from "node:path";
import { cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { editorLink } from "@/lib/lab-files";

const calloutStyles: Record<string, string> = {
  NOTE: "border-sky-500/40 bg-sky-500/5",
  TIP: "border-emerald-500/40 bg-emerald-500/5",
  IMPORTANT: "border-violet-500/40 bg-violet-500/5",
  WARNING: "border-amber-500/50 bg-amber-500/5",
  CAUTION: "border-red-500/50 bg-red-500/5",
};

/**
 * Renders lab prompts and solution write-ups. Relative links (./api.ts) open the file in your
 * editor; fenced code blocks are highlighted with Shiki on the server.
 */
export function Markdown({ source, baseDir }: { source: string; baseDir?: string }) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-a:text-accent prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const code = String(children);
            const language = /language-(\S+)/.exec(className ?? "")?.[1];
            if (!language && !code.includes("\n")) {
              return <code className="rounded bg-surface-2 px-1 py-0.5 text-[0.85em] font-normal">{children}</code>;
            }
            const [lang, ...titleParts] = (language ?? "text").split(":");
            return <CodeBlock code={code} language={lang} title={titleParts.join(":") || undefined} />;
          },
          a: ({ href = "", children }) => {
            if (/^https?:\/\//.test(href)) {
              return (
                <a href={href} target="_blank" rel="noreferrer">
                  {children}
                </a>
              );
            }
            if (href.startsWith("/") || href.startsWith("#")) return <Link href={href}>{children}</Link>;
            if (baseDir) {
              const absolute = path.resolve(baseDir, href);
              return (
                <a href={editorLink(absolute)} title={`Open ${href} in VS Code`}>
                  {children}
                </a>
              );
            }
            return <a href={href}>{children}</a>;
          },
          blockquote: ({ children }: ComponentProps<"blockquote">) => {
            const text = flattenText(children);
            const kind = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/.exec(text)?.[1];
            if (!kind) return <blockquote>{children}</blockquote>;
            return (
              <div className={`not-prose my-5 rounded-lg border-l-4 px-4 py-3 text-[15px] leading-relaxed [&_a]:text-accent [&_a]:underline [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_p]:my-1.5 ${calloutStyles[kind]}`}>
                <div className="mb-1 text-xs font-semibold tracking-wide uppercase text-muted">{kind.toLowerCase()}</div>
                <div className="callout-body">{stripMarker(children)}</div>
              </div>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}

function flattenText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return flattenText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

/** Removes the "[!NOTE]" marker from the first paragraph of a GitHub-style callout. */
function stripMarker(node: ReactNode): ReactNode {
  let done = false;
  const visit = (child: ReactNode): ReactNode => {
    if (done) return child;
    if (typeof child === "string") {
      if (/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/.test(child)) {
        done = true;
        return child.replace(/\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/, "");
      }
      return child;
    }
    if (Array.isArray(child)) return child.map(visit);
    if (isValidElement(child)) {
      const element = child as ReactElement<{ children?: ReactNode }>;
      return cloneElement(element, undefined, visit(element.props.children));
    }
    return child;
  };
  return visit(node);
}
