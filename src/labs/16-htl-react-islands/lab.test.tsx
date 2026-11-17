import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { pick, withMockAem } from "@/test/lab";
import { fetchPageHtml } from "@/lib/aem/sites";
import * as exerciseIslands from "./islands";
import * as exerciseLinks from "./links";
import * as exercisePriceTag from "./PriceTag";
import * as exerciseProps from "./props";
import * as solutionIslands from "@/solutions/16-htl-react-islands/islands";
import * as solutionLinks from "@/solutions/16-htl-react-islands/links";
import * as solutionPriceTag from "@/solutions/16-htl-react-islands/PriceTag";
import * as solutionProps from "@/solutions/16-htl-react-islands/props";
import { fakeDocument, fakeElement, parseMountPoints } from "./html";
import { PropsError } from "./types";

const { coerceAttribute, readProps } = pick(exerciseProps, solutionProps);
const { mountIslands } = pick(exerciseIslands, solutionIslands);
const { safeHref } = pick(exerciseLinks, solutionLinks);
const { PriceTag } = pick(exercisePriceTag, solutionPriceTag);

withMockAem();

describe("Lab 16 · Task 1 · coerceAttribute", () => {
  it.each([
    ["", true],
    ["true", true],
    ["false", false],
    ["1450", 1450],
    ["-3.5", -3.5],
    ["0", 0],
    ["007", "007"],
    ["1e3", "1e3"],
    ["Bali Surf Camp", "Bali Surf Camp"],
    ['["a","b"]', ["a", "b"]],
    ['{"a":1}', { a: 1 }],
    ["[not json", "[not json"],
  ])("%j -> %j", (input, expected) => {
    expect(coerceAttribute(input)).toEqual(expected);
  });
});

describe("Lab 16 · Task 1 · readProps", () => {
  const noScripts = () => null;

  it("reads individual data attributes and coerces them", () => {
    const element = fakeElement({ reactComponent: "PriceTag", amount: "1450", currency: "USD", sale: "", label: "Bali Surf Camp", cqDataPath: "/content/x" });
    expect(readProps(element, noScripts)).toEqual({ amount: 1450, currency: "USD", sale: true, label: "Bali Surf Camp" });
  });

  it("reads a JSON data-props attribute (no coercion: the JSON already has types)", () => {
    const element = fakeElement({ reactComponent: "AdventureCard", props: '{"title":"Bali","price":1450,"code":"007","tags":["a"]}', amount: "ignored" });
    expect(readProps(element, noScripts)).toEqual({ title: "Bali", price: 1450, code: "007", tags: ["a"] });
  });

  it("reads props from a <script type=application/json> referenced by data-props-id", () => {
    const element = fakeElement({ reactComponent: "Departure", propsId: "p1", props: '{"ignored":true}' });
    const reader = vi.fn((id: string) => (id === "p1" ? '{"date":"2026-12-04"}' : null));
    expect(readProps(element, reader)).toEqual({ date: "2026-12-04" });
    expect(reader).toHaveBeenCalledWith("p1");
  });

  it("throws a PropsError naming the component for broken payloads", () => {
    const broken = [
      fakeElement({ reactComponent: "AdventureCard", props: "{oops" }),
      fakeElement({ reactComponent: "AdventureCard", props: "null" }),
      fakeElement({ reactComponent: "AdventureCard", props: "[1,2]" }),
      fakeElement({ reactComponent: "AdventureCard", propsId: "missing" }),
    ];
    for (const element of broken) {
      expect(() => readProps(element, noScripts)).toThrow(PropsError);
      expect(() => readProps(element, noScripts)).toThrow(/AdventureCard/);
    }
  });
});

describe("Lab 16 · Task 2 · mountIslands", () => {
  const Plain = ({ name }: { name?: string }) => createElement("b", null, name);
  const setup = (elements = [fakeElement({ reactComponent: "Plain", name: "Ada" })], scripts = {}) => {
    const host = fakeDocument(elements, scripts);
    const mount = vi.fn(() => ({ unmount: vi.fn() }));
    return { host, mount };
  };

  it("mounts a registered component with its props", () => {
    const { host, mount } = setup();
    const islands = mountIslands(host, { Plain }, mount);
    expect(islands).toHaveLength(1);
    expect(islands[0]).toMatchObject({ name: "Plain", props: { name: "Ada" } });
    const [element, node] = mount.mock.calls[0] as unknown as [unknown, Parameters<typeof renderToStaticMarkup>[0]];
    expect(element).toBe(host.elements[0]);
    expect(renderToStaticMarkup(node)).toBe("<b>Ada</b>");
  });

  it("does not mount the same element twice", () => {
    const { host, mount } = setup();
    mountIslands(host, { Plain }, mount);
    expect(mountIslands(host, { Plain }, mount)).toHaveLength(0);
    expect(mount).toHaveBeenCalledTimes(1);
  });

  it("unmount() unmounts the root and allows mounting again (editor re-render)", () => {
    const { host, mount } = setup();
    const [island] = mountIslands(host, { Plain }, mount);
    island.unmount();
    expect(host.elements[0].dataset.reactMounted).toBeUndefined();
    expect(mountIslands(host, { Plain }, mount)).toHaveLength(1);
  });

  it("reports unknown components and keeps going, including names that exist on every object", () => {
    const { host, mount } = setup([
      fakeElement({ reactComponent: "Nope" }),
      fakeElement({ reactComponent: "constructor" }),
      fakeElement({ reactComponent: "Plain", name: "ok" }),
    ]);
    const errors: string[] = [];
    const islands = mountIslands(host, { Plain }, mount, (error) => errors.push(error.message));
    expect(islands.map((island) => island.name)).toEqual(["Plain"]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toContain("Nope");
  });

  it("reports broken props and keeps going", () => {
    const { host, mount } = setup([fakeElement({ reactComponent: "Plain", props: "{broken" }), fakeElement({ reactComponent: "Plain", name: "ok" })]);
    const errors: Error[] = [];
    const islands = mountIslands(host, { Plain }, mount, (error) => errors.push(error));
    expect(islands).toHaveLength(1);
    expect(errors[0]).toBeInstanceOf(PropsError);
  });

  it("finds script payloads through the host", () => {
    const { host, mount } = setup([fakeElement({ reactComponent: "Plain", propsId: "p" })], { p: '{"name":"from script"}' });
    expect(mountIslands(host, { Plain }, mount)[0].props).toEqual({ name: "from script" });
  });
});

describe("Lab 16 · Task 2 · against the HTML the mock AEM renders", () => {
  it("mounts every component of /content/wknd/us/en/adventures", async () => {
    const host = parseMountPoints(await fetchPageHtml("/content/wknd/us/en/adventures"));
    const Any = (props: Record<string, unknown>) => createElement("i", null, JSON.stringify(props));
    const errors: Error[] = [];
    const islands = mountIslands(host, { PriceTag: Any, AdventureCard: Any, Departure: Any }, () => ({ unmount() {} }), (error) => errors.push(error));

    expect(errors).toEqual([]);
    expect(islands.map((island) => island.name)).toEqual(["PriceTag", "PriceTag", "PriceTag", "AdventureCard", "AdventureCard", "Departure"]);
    expect(islands[0].props).toEqual({ amount: 1450, currency: "USD", sale: true, label: "Bali Surf Camp" });
    expect(islands[1].props).toMatchObject({ amount: 2100, currency: "EUR", label: "Cycling Tuscany" });
    expect(islands[1].props).not.toHaveProperty("sale"); // HTL omits the attribute when the value is false
    expect(islands[2].props).toMatchObject({ amount: 0 });
    expect(islands[3].props).toMatchObject({ title: "Bali Surf Camp", price: 1450, tags: ["surfing", "bali", "beginner-friendly"] });
    expect(islands[5].props).toEqual({ date: "2026-12-04", label: "Next Bali departure", showWeekday: true });
  });
});

describe("Lab 16 · Task 3 · <PriceTag>", () => {
  const html = (props: Parameters<typeof PriceTag>[0]) => renderToStaticMarkup(createElement(PriceTag, props));

  it("formats the amount and shows label and sale badge", () => {
    const markup = html({ amount: 1450, currency: "USD", sale: true, label: "Bali Surf Camp" });
    expect(markup).toContain('<span class="price-tag__label">Bali Surf Camp</span>');
    expect(markup).toContain('<span class="price-tag__amount">$1,450</span>');
    expect(markup).toContain('<span class="price-tag__badge">Sale</span>');
  });

  it("defaults the currency to USD, supports others and omits label and badge", () => {
    expect(html({ amount: 99 })).toContain(">$99<");
    expect(html({ amount: 2100, currency: "EUR" })).toContain("€2,100");
    const markup = html({ amount: 99, sale: false });
    expect(markup).not.toContain("badge");
    expect(markup).not.toContain("label");
  });

  it("treats 0 as Free and bad amounts as a dash", () => {
    expect(html({ amount: 0 })).toContain(">Free<");
    expect(html({})).toContain(">—<");
    expect(html({ amount: Number.NaN })).toContain(">—<");
  });

  it("does not crash on a currency Intl rejects", () => {
    expect(html({ amount: 5, currency: "not a currency" })).toContain("5 not a currency");
  });
});

describe("Lab 16 · Task 4 · safeHref", () => {
  it.each([
    ["/content/wknd/us/en/adventures.html", "/content/wknd/us/en/adventures.html"],
    ["#details", "#details"],
    ["?page=2", "?page=2"],
    ["adventures/bali.html", "adventures/bali.html"],
    ["https://www.surf-forecast.com", "https://www.surf-forecast.com"],
    ["HTTP://example.com", "HTTP://example.com"],
    ["mailto:hi@wknd.site", "mailto:hi@wknd.site"],
    ["tel:+3112345678", "tel:+3112345678"],
    ["  /trimmed  ", "/trimmed"],
  ])("allows %j", (input, expected) => {
    expect(safeHref(input)).toBe(expected);
  });

  it.each(["javascript:alert(1)", "  JavaScript:alert(1)", "java\tscript:alert(1)", "java\nscript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:msgbox", "", "   ", undefined, null, 42, {}])(
    "blocks %j",
    (input) => {
      expect(safeHref(input)).toBeUndefined();
    },
  );
});
