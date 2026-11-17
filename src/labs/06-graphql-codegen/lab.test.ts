import { describe, expect, it } from "vitest";
import { pick, withMockAem } from "@/test/lab";
import * as exerciseData from "./data";
import * as exerciseDocuments from "./documents";
import * as exerciseGql from "./gql";
import * as solutionData from "@/solutions/06-graphql-codegen/data";
import * as solutionDocuments from "@/solutions/06-graphql-codegen/documents";
import * as solutionGql from "@/solutions/06-graphql-codegen/gql";

const data = pick(exerciseData, solutionData);
const documents = pick(exerciseDocuments, solutionDocuments) as typeof solutionDocuments;
const gql = pick(exerciseGql, solutionGql) as unknown as typeof solutionGql;

withMockAem();

describe("Lab 06 · teaserFilter()", () => {
  it("returns undefined without a difficulty", () => {
    expect(data.teaserFilter()).toBeUndefined();
  });
  it("builds an AEM filter", () => {
    expect(data.teaserFilter("Expert")).toEqual({ difficulty: { _expressions: [{ value: "Expert" }] } });
  });
});

describe("Lab 06 · getAdventureTeasers() against the mock AEM", () => {
  const unmask = (items: Awaited<ReturnType<typeof data.getAdventureTeasers>>) =>
    items
      .filter((item) => item !== null)
      .map((item) => gql.getFragmentData(documents.adventureTeaserFragment, item as never));

  it("returns every English adventure sorted by title", async () => {
    const teasers = unmask(await data.getAdventureTeasers());
    expect(teasers).toHaveLength(16);
    const titles = teasers.map((teaser) => teaser.title ?? "");
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it("filters by difficulty and exposes the difficulty field through the fragment", async () => {
    const teasers = unmask(await data.getAdventureTeasers("Expert"));
    expect(teasers.map((teaser) => teaser.title)).toEqual(["Ski Touring Mont Blanc"]);
    expect(teasers[0]).toHaveProperty("difficulty", "Expert");
    expect(teasers[0].primaryImage).toMatchObject({ __typename: "ImageRef" });
  });
});
