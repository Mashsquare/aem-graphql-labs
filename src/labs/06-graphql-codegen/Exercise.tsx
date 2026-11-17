import { param, type LabViewProps } from "@/lib/lab-view";
import { AdventureTeaser } from "./AdventureTeaser";
import { getAdventureTeasers } from "./data";
import { TeaserLayout } from "./ui";

export default async function Exercise({ searchParams }: LabViewProps) {
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
