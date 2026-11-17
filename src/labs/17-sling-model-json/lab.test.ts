import { describe, expect, it } from "vitest";
import type { ImageModel, TeaserModel } from "@/lib/aem/page-model";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseLinks from "./links";
import * as exerciseModel from "./model";
import * as exerciseSanitize from "./sanitize";
import * as exerciseTeaser from "./teaser";
import * as solutionLinks from "@/solutions/17-sling-model-json/links";
import * as solutionModel from "@/solutions/17-sling-model-json/model";
import * as solutionSanitize from "@/solutions/17-sling-model-json/sanitize";
import * as solutionTeaser from "@/solutions/17-sling-model-json/teaser";
import { AemModelError } from "./types";

const { fetchModel, modelUrl } = pick(exerciseModel, solutionModel);
const { toRoute } = pick(exerciseLinks, solutionLinks);
const { sanitizeRichText } = pick(exerciseSanitize, solutionSanitize);
const { adaptTeaser, buildSrcSet } = pick(exerciseTeaser, solutionTeaser);

const mock = withMockAem();
const basic = `Basic ${Buffer.from("admin:admin").toString("base64")}`;

describe("Lab 17 · Task 1 · modelUrl", () => {
  it.each([
    ["/content/wknd/us/en/featured", "/content/wknd/us/en/featured.model.json"],
    ["/content/wknd/us/en/featured.html", "/content/wknd/us/en/featured.model.json"],
    ["/content/wknd/us/en/featured/", "/content/wknd/us/en/featured.model.json"],
    ["/content/wknd/us/en/featured.model.json", "/content/wknd/us/en/featured.model.json"],
    ["/content/wknd/us/en/jcr:content/root/container/hero", "/content/wknd/us/en/jcr:content/root/container/hero.model.json"],
  ])("%s", (input, expected) => {
    expect(modelUrl(input)).toBe(expected);
  });

  it.each(["https://evil.example/content/x", "//evil.example/content/x", "/etc/passwd", "/content/../etc/passwd", "content/wknd", ""])("refuses %j", (input) => {
    expect(() => modelUrl(input)).toThrow(RangeError);
  });
});

describe("Lab 17 · Task 1 · fetchModel", () => {
  it("fetches a page model from Publish", async () => {
    const model = await fetchModel<{ ":type": string; title: string }>("/content/wknd/us/en/featured");
    expect(model[":type"]).toBe("wknd/components/page");
    expect(model.title).toBe("Featured adventures");
  });

  it("fetches one component by its jcr:content path", async () => {
    const hero = await fetchModel<TeaserModel>("/content/wknd/us/en/jcr:content/root/container/hero");
    expect(hero[":type"]).toBe("wknd/components/teaser");
  });

  it("throws AemModelError with the status for missing pages", async () => {
    await expect(fetchModel("/content/wknd/us/en/nope")).rejects.toMatchObject({ name: "AemModelError", status: 404 });
    await expect(fetchModel("/content/wknd/us/en/nope")).rejects.toBeInstanceOf(AemModelError);
  });

  it("uses the Author host for tier author and passes headers", async () => {
    await expect(fetchModel("/content/wknd/us/en/featured", { tier: "author" })).rejects.toMatchObject({ status: 401 });
    const model = await fetchModel<{ title: string }>("/content/wknd/us/en/featured", { tier: "author", headers: { Authorization: basic } });
    expect(model.title).toBe("Featured adventures");
  });

  it("rejects an HTML answer that pretends to be fine", async () => {
    // The page itself, not its model: status 200, text/html.
    const html = await fetch(`${mock.aem.origins.publish}/content/wknd/us/en/featured.html`);
    expect(html.status).toBe(200);
    // fetchModel only ever asks for .model.json, so simulate an intermediary answering HTML with a stubbed fetch.
    const original = globalThis.fetch;
    globalThis.fetch = (async () => new Response("<html>Sign in</html>", { status: 200, headers: { "content-type": "text/html" } })) as typeof fetch;
    try {
      await expect(fetchModel("/content/wknd/us/en/featured")).rejects.toBeInstanceOf(AemModelError);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe("Lab 17 · Task 2 · toRoute", () => {
  it.each([
    ["/content/wknd/us/en/adventures.html", "/adventures"],
    ["/content/wknd/us/en.html", "/"],
    ["/content/wknd/us/en", "/"],
    ["/content/wknd/us/en/magazine.html#latest", "/magazine#latest"],
    ["/content/wknd/us/en/a/b", "/a/b"],
    ["/content/wknd/us/en/a/b.html?x=1&y=2#top", "/a/b?x=1&y=2#top"],
    ["/content/wknd/us/english/x.html", "/content/wknd/us/english/x.html"],
    ["/content/wknd/us/fr/x.html", "/content/wknd/us/fr/x.html"],
    ["https://www.surf-forecast.com", "https://www.surf-forecast.com"],
    ["mailto:hi@wknd.site", "mailto:hi@wknd.site"],
  ])("%s -> %s", (input, expected) => {
    expect(toRoute(input)).toBe(expected);
  });

  it("makes DAM links absolute on the Publish host", () => {
    expect(toRoute("/content/dam/wknd-shared/en/x/map.pdf")).toBe(`${mock.aem.origins.publish}/content/dam/wknd-shared/en/x/map.pdf`);
  });

  it("supports another site root and drops unsafe or empty links", () => {
    expect(toRoute("/content/wknd/us/fr/x.html", "/content/wknd/us/fr")).toBe("/x");
    for (const bad of ["javascript:alert(1)", "", "   ", undefined, null]) expect(toRoute(bad)).toBeUndefined();
  });
});

describe("Lab 17 · Task 3 · sanitizeRichText", () => {
  it("keeps the formatting authors use", () => {
    const html = "<p>We run <b>small</b> <i>groups</i></p><ul><li>Guides</li><li>Gear<br></li></ul><h2>Hi</h2>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("lowercases tags and removes every attribute except a safe href and target", () => {
    expect(sanitizeRichText('<P CLASS="x" style="color:red" onclick="steal()">Hi</P>')).toBe("<p>Hi</p>");
    expect(sanitizeRichText('<a href="https://example.com/a?b=1&amp;c=2" class="btn" target="_blank">go</a>')).toBe(
      '<a href="https://example.com/a?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">go</a>',
    );
    expect(sanitizeRichText('<a href="/adventures.html" target="_self">x</a>')).toBe('<a href="/adventures.html">x</a>');
  });

  it("removes scripts, styles and their content", () => {
    expect(sanitizeRichText('<p>a</p><script>alert("xss")</script><p>b</p>')).toBe("<p>a</p><p>b</p>");
    expect(sanitizeRichText("<STYLE>p{display:none}</STYLE>text")).toBe("text");
    expect(sanitizeRichText("before<iframe src=//evil.example></iframe>after")).toBe("beforeafter");
    expect(sanitizeRichText("<script>never closed… <p>hidden</p>")).toBe("");
  });

  it("removes unknown tags but keeps their text; drops comments", () => {
    expect(sanitizeRichText('<span style="x">hi</span> <img src=x onerror=alert(1)>there<!-- <script> -->')).toBe("hi there");
  });

  it.each([
    ['<a href="javascript:alert(1)">x</a>', "<a>x</a>"],
    ['<a href=" JaVaScRiPt:alert(1)">x</a>', "<a>x</a>"],
    ['<a href="java&#9;script:alert(1)">x</a>', "<a>x</a>"],
    ['<a href="&#106;avascript:alert(1)">x</a>', "<a>x</a>"],
    ['<a href="&#x6A;avascript:alert(1)">x</a>', "<a>x</a>"],
    ['<a href="javascript&colon;alert(1)">x</a>', "<a>x</a>"],
    ['<a href="jav&Tab;ascript:alert(1)">x</a>', "<a>x</a>"],
    ['<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>', "<a>x</a>"],
  ])("neutralises the link %s", (input, expected) => {
    expect(sanitizeRichText(input)).toBe(expected);
  });

  it("never emits an unescaped angle bracket from text", () => {
    expect(sanitizeRichText("1 < 2 and 3 > 2")).toBe("1 &lt; 2 and 3 &gt; 2");
    const nasty = sanitizeRichText("<scr<script>ipt>alert(1)</scr</script>ipt>");
    expect(nasty).not.toMatch(/<script/i);
    expect(nasty).not.toContain("alert(1)</");
    expect(sanitizeRichText('<a href="x" title=">"><b>y</b></a>')).not.toMatch(/<b>y<\/b>.*<script/);
  });

  it("keeps the output balanced", () => {
    expect(sanitizeRichText("<p><b>open")).toBe("<p><b>open</b></p>");
    expect(sanitizeRichText("text</b></p>")).toBe("text");
    expect(sanitizeRichText("<p><b>x</p>")).toBe("<p><b>x</b></p>");
  });

  it("cleans the hostile component of the mock page", async () => {
    const promo = await fetchModel<{ text: string }>("/content/wknd/us/en/jcr:content/root/container/promo");
    expect(sanitizeRichText(promo.text)).toBe("<p>Book now! <a>Click here</a></p><p>Offer ends <b>soon</b>.</p>");
  });
});

describe("Lab 17 · Task 4 · buildSrcSet and adaptTeaser", () => {
  const template = "/content/wknd/us/en/jcr:content/root/container/banner.coreimg{.width}.jpeg/1730000000000/abc/hero.jpg";

  it("builds an srcset with absolute URLs, in the given order", () => {
    const host = mock.aem.origins.publish;
    expect(buildSrcSet(template, [320, 800])).toBe(
      `${host}/content/wknd/us/en/jcr:content/root/container/banner.coreimg.320.jpeg/1730000000000/abc/hero.jpg 320w, ${host}/content/wknd/us/en/jcr:content/root/container/banner.coreimg.800.jpeg/1730000000000/abc/hero.jpg 800w`,
    );
  });

  it("throws for something that is not a template", () => {
    expect(() => buildSrcSet("/content/x/image.jpeg", [320])).toThrow();
  });

  const getHero = () => fetch(`${mock.aem.origins.publish}/content/wknd/us/en/jcr:content/root/container/hero.model.json`).then((response) => response.json() as Promise<TeaserModel>);

  it("adapts the Core Teaser export", async () => {
    const view = adaptTeaser(await getHero());
    expect(view.heading).toBe("Live your adventure");
    expect(view.headingLevel).toBe("h1");
    expect(view.href).toBe("/adventures");
    expect(view.bodyHtml).toBe("<p>Surf, ski, climb and cycle. <b>New trips every month.</b></p>");
    expect(view.image?.alt).toBe("Surfer on a wave in Bali");
    expect(view.image?.src).toMatch(/^http:\/\/localhost:\d+\/content\/wknd\/us\/en\/jcr:content\/root\/container\/hero\/image\.coreimg\.1200\.jpeg\//);
    expect(view.image?.srcSet).toContain(" 320w, ");
    expect(view.image?.srcSet.split(", ")).toHaveLength(5);
    expect(view.actions.map((action) => [action.label, action.href, action.external])).toEqual([
      ["Browse adventures", "/adventures", false],
      ["Read the magazine", "/magazine#latest", false],
      ["Surf forecast", "https://www.surf-forecast.com", true],
    ]);
  });

  it("copes with missing parts of the export", async () => {
    const hero = await getHero();
    const view = adaptTeaser({ ...hero, titleType: undefined, linkURL: "", actionsEnabled: false, description: "", image: { src: "", srcUriTemplate: "", alt: "" } } as unknown as TeaserModel);
    expect(view.headingLevel).toBe("h2");
    expect(view.href).toBeUndefined();
    expect(view.actions).toEqual([]);
    expect(view.image).toBeNull();
    expect(view.bodyHtml).toBe("");
  });

  it("drops actions with unsafe URLs and sanitises the description", async () => {
    const hero = await getHero();
    const view = adaptTeaser({
      ...hero,
      description: '<p onmouseover="x()">hi</p><script>bad()</script>',
      actions: [{ id: "a", title: "Bad", url: "javascript:alert(1)" }, { id: "b", title: "Good", url: "/content/wknd/us/en/featured.html" }],
    });
    expect(view.bodyHtml).toBe("<p>hi</p>");
    expect(view.actions).toEqual([{ id: "b", label: "Good", href: "/featured", external: false }]);
  });

  it("uses the widths of the export when present", async () => {
    const banner = await fetch(`${mock.aem.origins.publish}/content/wknd/us/en/jcr:content/root/container/banner.model.json`).then((response) => response.json() as Promise<ImageModel>);
    expect(buildSrcSet(banner.srcUriTemplate, banner.widths!).split(", ")).toHaveLength(5);
  });
});
