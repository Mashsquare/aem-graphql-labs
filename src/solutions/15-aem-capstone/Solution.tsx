import { CapstoneChecklist } from "@/labs/15-aem-capstone/checklist";
import { tagsForEvent } from "./aem-events";
import { BASE_PATH } from "./AdventureListPage";
import { fetchAdventure, fetchAdventures } from "./data";

export default function Solution() {
  return (
    <CapstoneChecklist api={{ fetchAdventures, fetchAdventure, tagsForEvent, siteBase: BASE_PATH, webhookPath: "/api/solutions/aem-events" }} />
  );
}
