import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ModelNode, PageModel } from "@/lib/aem/page-model";
import { fetchPageModel } from "@/lib/aem/sites";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseMapping from "./mapping";
import * as exerciseComponent from "./ModelComponent";
import * as exerciseModel from "./model";
import * as solutionMapping from "@/solutions/18-spa-page-model/mapping";
import * as solutionComponent from "@/solutions/18-spa-page-model/ModelComponent";
import * as solutionModel from "@/solutions/18-spa-page-model/model";
import { registerDemoComponents } from "./components";

const { createMapping } = pick(exerciseMapping, solutionMapping);
const { ModelComponent } = pick(exerciseComponent, solutionComponent);
const { applyUpdate, childrenOf, findByPath } = pick(exerciseModel, solutionModel);

withMockAem();

const Echo = ({ text, children }: { text?: string; children?: React.ReactNode }) => createElement("b", null, text, children);

describe("Lab 18 · Task 1 · createMapping", () => {
  it("registers a component for one or several resource types and returns it", () => {
    const mapping = createMapping();
    expect(mapping.MapTo("wknd/components/title")(Echo)).toBe(Echo);
    mapping.MapTo(["wknd/components/a", "wknd/components/b"])(Echo, { emptyLabel: "Echo" });
    expect(mapping.get("wknd/components/title")?.Component).toBe(Echo);
    expect(mapping.get("wknd/components/a")?.editConfig?.emptyLabel).toBe("Echo");
    expect(mapping.get("wknd/components/b")?.Component).toBe(Echo);
    expect(mapping.get("wknd/components/c")).toBeUndefined();
  });

  it("treats /apps/ and /libs/ prefixes as optional, in both directions", () => {
    const mapping = createMapping();
    mapping.MapTo("wknd/components/title")(Echo);
    mapping.MapTo("/apps/wknd/components/text")(Echo);
    expect(mapping.get("/apps/wknd/components/title")?.Component).toBe(Echo);
    expect(mapping.get("/libs/wknd/components/title")?.Component).toBe(Echo);
    expect(mapping.get("wknd/components/text")?.Component).toBe(Echo);
  });

  it("replaces an earlier registration and keeps registries independent", () => {
    const first = createMapping();
    const second = createMapping();
    const Other = () => null;
    first.MapTo("x/y")(Echo);
    first.MapTo("x/y")(Other);
    expect(first.get("x/y")?.Component).toBe(Other);
    expect(second.get("x/y")).toBeUndefined();
  });
});

describe("Lab 18 · Task 2 · childrenOf", () => {
  const leaf = (name: string): ModelNode => ({ ":type": `t/${name}` });

  it("follows :itemsOrder, not the key order of :items", () => {
    const model: ModelNode = { ":type": "c", ":items": { a: leaf("a"), b: leaf("b"), c: leaf("c") }, ":itemsOrder": ["c", "a", "b"] };
    expect(childrenOf(model).map((child) => child.key)).toEqual(["c", "a", "b"]);
    expect(childrenOf(model)[0].model[":type"]).toBe("t/c");
  });

  it("skips stale names and items that are not in the order list", () => {
    const model: ModelNode = { ":type": "c", ":items": { a: leaf("a"), b: leaf("b") }, ":itemsOrder": ["gone", "b", "constructor"] };
    expect(childrenOf(model).map((child) => child.key)).toEqual(["b"]);
  });

  it("falls back to the key order, and to nothing", () => {
    expect(childrenOf({ ":type": "c", ":items": { x: leaf("x"), y: leaf("y") } }).map((child) => child.key)).toEqual(["x", "y"]);
    expect(childrenOf({ ":type": "leaf" })).toEqual([]);
  });
});

describe("Lab 18 · Task 3 · <ModelComponent>", () => {
  const title: ModelNode = { ":type": "wknd/components/title", ":path": "/p/jcr:content/root/title", id: "title-1", text: "Hello", type: "h1" };
  const empty: ModelNode = { ":type": "wknd/components/title", ":path": "/p/jcr:content/root/empty", text: "" };
  const survey: ModelNode = { ":type": "wknd/components/survey", ":path": "/p/jcr:content/root/survey", question: "?" };
  const root: ModelNode = {
    ":type": "wknd/components/container",
    ":path": "/p/jcr:content/root",
    gridClassNames: "aem-Grid",
    columnClassNames: { title: "col-title", survey: "col-survey", empty: "col-empty" },
    ":items": { title, survey, empty },
    ":itemsOrder": ["title", "survey", "empty"],
  };

  const mapping = () => {
    const m = createMapping();
    const Title = ({ text, type = "h2", cqPath, isInEditor }: { text?: string; type?: "h1" | "h2"; cqPath?: string; isInEditor?: boolean }) =>
      createElement(type, { "data-seen": `${cqPath}|${isInEditor}` }, text);
    m.MapTo("wknd/components/title")(Title, { emptyLabel: "Title", isEmpty: (props: { text?: string }) => !props.text });
    return m;
  };
  const html = (isInEditor: boolean, model = root) => renderToStaticMarkup(createElement(ModelComponent, { model, mapping: mapping(), isInEditor }));

  it("renders the grid, the columns and the mapped components with their props, on Publish", () => {
    const markup = html(false);
    expect(markup).toContain('<div class="aem-Grid">');
    expect(markup).toContain('<div class="col-title"><h1 data-seen="/p/jcr:content/root/title|false">Hello</h1></div>');
    // the empty title is still a title: no placeholders outside the editor
    expect(markup).toContain('<div class="col-empty"><h2 data-seen="/p/jcr:content/root/empty|false"></h2></div>');
  });

  it("passes model properties but none of the :-prefixed ones", () => {
    const Spy = (props: Record<string, unknown>) => createElement("pre", null, Object.keys(props).sort().join(","));
    const m = createMapping();
    m.MapTo("wknd/components/title")(Spy);
    const markup = renderToStaticMarkup(createElement(ModelComponent, { model: title, mapping: m }));
    expect(markup).toBe("<pre>cqPath,id,isInEditor,text,type</pre>");
  });

  it("renders nothing for unmapped leaves on Publish", () => {
    const markup = html(false);
    expect(markup).not.toContain("survey?");
    expect(markup).not.toContain("Unmapped");
    expect(markup).toContain('<div class="col-survey"></div>');
  });

  it("still renders the children of an unmapped container", () => {
    const wrapper: ModelNode = { ":type": "some/unmapped/container", ":items": { title }, ":itemsOrder": ["title"] };
    expect(html(false, wrapper)).toContain("<h1");
  });

  it("marks components for the page editor and shows unmapped ones", () => {
    const markup = html(true);
    expect(markup).toContain('data-cq-data-path="/p/jcr:content/root"'); // the grid
    expect(markup).toMatch(/<div data-cq-data-path="\/p\/jcr:content\/root\/title"><h1 data-seen="\/p\/jcr:content\/root\/title\|true">Hello<\/h1><\/div>/);
    expect(markup).toContain("Unmapped component: wknd/components/survey");
    expect(markup).toContain("aem-unmapped");
  });

  it("shows the placeholder for an empty component in the editor", () => {
    const markup = html(true);
    expect(markup).toMatch(/<div data-cq-data-path="\/p\/jcr:content\/root\/empty"><div class="cq-placeholder" data-emptytext="Title"><\/div><\/div>/);
  });

  it("lets a mapped container receive the rendered grid as children", () => {
    const m = mapping();
    const Frame = ({ children }: { children?: React.ReactNode }) => createElement("section", null, children);
    m.MapTo("wknd/components/container")(Frame);
    const markup = renderToStaticMarkup(createElement(ModelComponent, { model: root, mapping: m }));
    expect(markup.startsWith('<section><div class="aem-Grid">')).toBe(true);
  });
});

describe("Lab 18 · Task 3 · against the page model of the mock AEM", () => {
  it("renders /featured in the editor and on Publish with the demo components", async () => {
    const page = await fetchPageModel<PageModel>("/content/wknd/us/en/featured");
    const mapping = registerDemoComponents(createMapping());
    const publish = renderToStaticMarkup(createElement(ModelComponent, { model: page, mapping }));
    expect(publish).toContain("Featured adventures</h1>");
    expect(publish).toContain("aem-GridColumn--default--6");
    expect(publish.match(/bali-surf-camp\/bali-surf-camp/g)?.length).toBe(1);
    expect(publish).not.toContain("data-cq-data-path");
    expect(publish).not.toContain("Where next?");

    const editor = renderToStaticMarkup(createElement(ModelComponent, { model: page, mapping, isInEditor: true }));
    expect(editor).toContain("Unmapped component: wknd/components/survey");
    expect(editor).toContain('data-emptytext="Adventure card"'); // the card without a fragment
    expect((editor.match(/data-cq-data-path/g) ?? []).length).toBeGreaterThan(8);
  });
});

describe("Lab 18 · Task 4 · findByPath and applyUpdate", () => {
  const model = (): ModelNode => ({
    ":type": "page",
    ":path": "/p",
    ":items": {
      root: {
        ":type": "container",
        ":path": "/p/jcr:content/root",
        ":items": {
          title: { ":type": "title", ":path": "/p/jcr:content/root/title", text: "Old" },
          cards: { ":type": "container", ":path": "/p/jcr:content/root/cards", ":items": { one: { ":type": "card", ":path": "/p/jcr:content/root/cards/one" } } },
        },
      },
    },
  });

  it("finds nodes at any depth, including the root", () => {
    const page = model();
    expect(findByPath(page, "/p")).toBe(page);
    expect(findByPath(page, "/p/jcr:content/root/cards/one")?.[":type"]).toBe("card");
    expect(findByPath(page, "/p/nope")).toBeUndefined();
  });

  it("returns a new model with the node replaced and does not mutate the original", () => {
    const page = model();
    const updated = applyUpdate(page, "/p/jcr:content/root/title", { ":type": "title", ":path": "/p/jcr:content/root/title", text: "New" });
    expect(findByPath(updated, "/p/jcr:content/root/title")?.text).toBe("New");
    expect(findByPath(page, "/p/jcr:content/root/title")?.text).toBe("Old");
    expect(updated).not.toBe(page);
  });

  it("copies only the ancestors: other branches keep their identity", () => {
    const page = model();
    const updated = applyUpdate(page, "/p/jcr:content/root/title", { ":type": "title", ":path": "/p/jcr:content/root/title", text: "New" });
    expect(findByPath(updated, "/p/jcr:content/root/cards")).toBe(findByPath(page, "/p/jcr:content/root/cards"));
    expect(findByPath(updated, "/p/jcr:content/root")).not.toBe(findByPath(page, "/p/jcr:content/root"));
  });

  it("returns the same model when nothing matches and the replacement when the root matches", () => {
    const page = model();
    expect(applyUpdate(page, "/p/elsewhere", { ":type": "x" })).toBe(page);
    const replacement: ModelNode = { ":type": "page", ":path": "/p" };
    expect(applyUpdate(page, "/p", replacement)).toBe(replacement);
  });
});
