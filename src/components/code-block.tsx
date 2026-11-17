import { highlight } from "@/lib/highlight";

export async function CodeBlock({ code, language, title }: { code: string; language?: string; title?: string }) {
  const html = await highlight(code.replace(/\n$/, ""), language);
  return (
    <figure className="code-block not-prose my-4 overflow-hidden rounded-lg border border-line">
      {title ? (
        <figcaption className="flex items-center justify-between border-b border-line bg-surface-2 px-3 py-1.5 font-mono text-xs text-muted">
          <span>{title}</span>
          <span className="uppercase tracking-wide">{language}</span>
        </figcaption>
      ) : null}
      <div className="overflow-x-auto text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}
