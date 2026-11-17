import { todo } from "@/lib/todo";

/**
 * Task 3 — HTL runs rich text through AEM's XSS filter. The JSON export does not: `text` is whatever the
 * author (or the Word document they pasted from) put there. Before you put it in `dangerouslySetInnerHTML`,
 * reduce it to a small allow-list. Return a string of safe, balanced HTML.
 *
 *   allowed tags      p br b strong i em u a ul ol li h2 h3 h4 blockquote       (case-insensitive, emitted lowercase)
 *   allowed attrs     none — except on <a>: href (only if safeHref() accepts it) and target="_blank"
 *                     (emit `target="_blank" rel="noopener noreferrer"` together)
 *                     Attribute values are HTML-encoded and the browser decodes them *before* it checks the scheme:
 *                     href="&#106;avascript:…", href="&#x6A;avascript:…" and href="javascript&colon;…" all run.
 *                     Decode numeric entities and &amp; first; refuse an href that still contains another named entity.
 *   other tags        removed, their TEXT kept:   "<span style=x>hi</span>" -> "hi"
 *   script style iframe object embed template noscript svg math
 *                     removed WITH their content, up to the matching close tag (or the end of the input)
 *   comments          removed
 *   text              "<" and ">" in text become &lt; and &gt; (existing entities such as &amp; stay)
 *   balance           unmatched closing tags are dropped; tags still open at the end are closed
 *
 * Tokenise with a regex such as /<!--[\s\S]*?-->|<\/?[a-zA-Z][^\s/>]*(?:"[^"]*"|'[^']*'|[^'">])*>/g
 * and treat everything between matches as text.
 *
 * Be honest about the limits: this is a teaching allow-list. In production use a maintained library
 * (DOMPurify, sanitize-html) — or render from a structured format instead of HTML.
 */
export function sanitizeRichText(html: string): string {
  void html;
  return todo("implement sanitizeRichText in sanitize.ts");
}
