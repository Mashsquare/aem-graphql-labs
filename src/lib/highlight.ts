import { cacheLife } from "next/cache";
import { createHighlighter, type Highlighter } from "shiki";

const LANGS = ["graphql", "ts", "tsx", "js", "json", "bash", "http", "html", "md", "diff", "yaml"] as const;
const ALIASES: Record<string, string> = {
  gql: "graphql",
  typescript: "ts",
  javascript: "js",
  sh: "bash",
  shell: "bash",
  powershell: "bash",
  jsonc: "json",
};

let highlighter: Promise<Highlighter> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighter({ themes: ["github-light", "github-dark"], langs: [...LANGS] });
  return highlighter;
}

/**
 * Dual-theme HTML; the light/dark switch happens in CSS (see globals.css).
 * Cached: the output only depends on the arguments, and Shiki reads the clock internally, which
 * Cache Components does not allow during prerendering outside a cache scope.
 */
export async function highlight(code: string, language = "text"): Promise<string> {
  "use cache";
  cacheLife("max");
  const instance = await getHighlighter();
  const lang = ALIASES[language] ?? language;
  return instance.codeToHtml(code, {
    lang: instance.getLoadedLanguages().includes(lang) ? lang : "text",
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}

export function languageFromFile(file: string): string {
  const extension = file.split(".").pop() ?? "";
  return { ts: "ts", tsx: "tsx", md: "md", json: "json", graphql: "graphql", mjs: "js", js: "js" }[extension] ?? "text";
}
