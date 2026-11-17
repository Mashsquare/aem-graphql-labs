import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RichTextNode } from "@/lib/aem/types";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseQueries from "./queries";
import * as exerciseRichText from "./RichText";
import * as solutionQueries from "@/solutions/10-aem-references-rich-text/queries";
import * as solutionRichText from "@/solutions/10-aem-references-rich-text/RichText";
import type { ArticleReference } from "./types";

const { getArticle, getArticleList } = pick(exerciseQueries, solutionQueries);
const { RichText } = pick(exerciseRichText, solutionRichText);

withMockAem();

const nodes = [
  { nodeType: "header", style: "h2", content: [{ nodeType: "text", value: "When to go" }] },
  {
    nodeType: "paragraph",
    content: [
      { nodeType: "text", value: "Go " },
      { nodeType: "text", value: "early", format: { variants: ["bold"] } },
      { nodeType: "text", value: " and ", format: { variants: ["italic"] } },
      { nodeType: "link", value: "check tides", data: { href: "https://example.com", target: "_blank" } },
    ],
  },
  { nodeType: "unordered-list", content: [{ nodeType: "list-item", content: [{ nodeType: "text", value: "Wax" }] }] },
  { nodeType: "reference", data: { path: "/content/dam/x.jpg", mimetype: "image/jpeg" } },
  { nodeType: "paragraph", content: [{ nodeType: "reference", value: "Bali Surf Camp", data: { href: "/content/dam/a/bali", type: "fragment" } }] },
  { nodeType: "horizontal-rule" },
  { nodeType: "mystery-block", content: [{ nodeType: "text", value: "still rendered" }] },
] as unknown as RichTextNode[];

const references: ArticleReference[] = [
  { __typename: "ImageRef", _path: "/content/dam/x.jpg", _dynamicUrl: "/adobe/dynamicmedia/deliver/dm-aid--1/x.jpg?preferwebp=true", width: 1200, height: 800 },
  { __typename: "AdventureModel", _path: "/content/dam/a/bali", title: "Bali Surf Camp", slug: "bali-surf-camp" },
  { __typename: "AuthorModel" },
];

describe("Lab 10 · <RichText>", () => {
  const html = () => renderToStaticMarkup(<RichText nodes={nodes} references={references} />);

  it("renders headers, paragraphs, formatting and lists", () => {
    const markup = html();
    expect(markup).toContain("<h2>");
    expect(markup).toMatch(/<strong>early<\/strong>/);
    expect(markup).toMatch(/<em> and <\/em>/);
    expect(markup).toMatch(/<ul><li>.*Wax.*<\/li><\/ul>/);
  });

  it("renders links with target and rel", () => {
    expect(html()).toMatch(/<a href="https:\/\/example.com" target="_blank" rel="noreferrer">check tides<\/a>/);
  });

  it("resolves inline images and fragment links through _references", () => {
    const markup = html();
    expect(markup).toMatch(/<img src="http:\/\/localhost:\d+\/adobe\/dynamicmedia\/deliver\/dm-aid--1\/x\.jpg\?preferwebp=true&amp;width=1200"/);
    expect(markup).toContain('href="/capstone/adventures/bali-surf-camp"');
  });

  it("does not crash on unknown node types and keeps their children", () => {
    expect(html()).toContain("still rendered");
  });
});

describe("Lab 10 · queries against the mock AEM", () => {
  it("lists the 7 published English articles, newest first", async () => {
    const list = await getArticleList();
    expect(list.map((item) => item.slug)).toEqual([
      "packing-light-the-wknd-way",
      "camping-under-southern-skies",
      "eating-your-way-through-le-marais",
      "cycling-tuscany-slow-travel",
      "ten-tips-for-your-first-climb",
      "the-surfers-guide-to-bali",
      "ski-touring-for-beginners",
    ]);
  });

  it("loads an article with its author, related adventures and _references", async () => {
    const result = await getArticle("the-surfers-guide-to-bali");
    expect(result?.article.authorFragment?.firstName).toBe("Stacey");
    expect(result?.article.relatedAdventures.map((adventure) => adventure.slug)).toEqual(["bali-surf-camp", "surf-camp-costa-rica"]);
    expect(result?.article.main?.json?.[0]).toMatchObject({ nodeType: "paragraph" });

    const typenames = new Set(result?.references.map((reference) => reference.__typename));
    expect(typenames).toEqual(new Set(["ImageRef", "AuthorModel", "AdventureModel"]));
    const inlineImage = result?.references.find((reference) => "_path" in reference && reference._path.endsWith("-inline.jpg"));
    expect(inlineImage).toMatchObject({ __typename: "ImageRef", _dynamicUrl: expect.stringContaining("/adobe/dynamicmedia/deliver/") });
  });

  it("returns null for an unknown slug", async () => {
    expect(await getArticle("nope")).toBeNull();
  });
});
