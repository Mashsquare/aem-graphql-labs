import { param, type LabViewProps } from "@/lib/lab-view";
import { TeaserLayout } from "@/labs/06-graphql-codegen/ui";
import { AdventureTeaser } from "./AdventureTeaser";
import { getAdventureTeasers } from "./data";

export default async function Solution({ searchParams }: LabViewProps) {
  const difficulty = param(searchParams, "difficulty");
  const items = await getAdventureTeasers(difficulty);
  const adventures = items.filter((item) => item !== null);

  return (
    <TeaserLayout difficulty={difficulty} count={adventures.length}>
      {adventures.map((adventure, index) => (
        <AdventureTeaser key={index} adventure={adventure} />
      ))}
    </TeaserLayout>
  );
}
