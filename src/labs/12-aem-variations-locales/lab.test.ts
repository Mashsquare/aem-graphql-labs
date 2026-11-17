import { describe, expect, it } from "vitest";
import { pick, withMockAem } from "@/test/lab";
import * as exercise from "./data";
import * as solution from "@/solutions/12-aem-variations-locales/data";

const lab = pick(exercise, solution);
const BALI = "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp";

withMockAem();

describe("Lab 12 · variations", () => {
  it("returns the requested variation", async () => {
    const summer = await lab.getAdventureVariation("bali-surf-camp", "summer");
    expect(summer).toMatchObject({ _variation: "summer", title: "Bali Surf Camp — Summer Swell", price: 1690, _variations: ["summer"] });
  });

  it("falls back to master when the fragment has no such variation", async () => {
    const fallback = await lab.getAdventureVariation("beervana-portland", "summer");
    expect(fallback).toMatchObject({ _variation: "master", price: 149, _variations: [] });
  });

  it("returns master and all variations with includeVariations", async () => {
    expect(await lab.getAllVariations("bali-surf-camp")).toEqual([
      { _variation: "master", title: "Bali Surf Camp", price: 1890 },
      { _variation: "summer", title: "Bali Surf Camp — Summer Swell", price: 1690 },
    ]);
  });
});

describe("Lab 12 · locales", () => {
  it("scopes lists to one language copy", async () => {
    const german = await lab.getLocalizedAdventures("de");
    expect(german.map((item) => item.title)).toEqual([
      "Radfahren in der Toskana",
      "Skitouren am Mont Blanc",
      "Surfcamp auf Bali",
      "Weinprobe im Napa Valley",
    ]);
    expect(german.every((item) => item._path.startsWith("/content/dam/wknd-shared/de/"))).toBe(true);
    expect(await lab.getLocalizedAdventures("en")).toHaveLength(16);
  });

  it("combines _locale with variation", async () => {
    expect(await lab.getAdventureVariation("bali-surf-camp", "summer", "de")).toMatchObject({ title: "Surfcamp auf Bali — Sommer-Swell", _variation: "summer" });
    expect(await lab.getAdventureVariation("beervana-portland", undefined, "de")).toBeNull();
  });
});

describe("Lab 12 · metadata", () => {
  it("reads _model, _tags and typed _metadata", async () => {
    const metadata = await lab.getAdventureMetadata(BALI);
    expect(metadata?._model.title).toBe("Adventure");
    expect(metadata?._tags).toContain("wknd-shared:activity/surfing");
    expect(lab.metadataValue(metadata!._metadata, "title")).toBe("Bali Surf Camp");
    expect(lab.metadataValue(metadata!._metadata, "cq:tags")).toEqual(metadata?._tags);
    expect(lab.metadataValue(metadata!._metadata, "cq:lastReplicated")).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(lab.metadataValue(metadata!._metadata, "does-not-exist")).toBeUndefined();
  });
});
