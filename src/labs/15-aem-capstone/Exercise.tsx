import { tagsForEvent } from "./aem-events";
import { BASE_PATH } from "./AdventureListPage";
import { CapstoneChecklist } from "./checklist";
import { fetchAdventure, fetchAdventures } from "./data";

export default function Exercise() {
  return <CapstoneChecklist api={{ fetchAdventures, fetchAdventure, tagsForEvent, siteBase: BASE_PATH, webhookPath: "/api/aem-events" }} />;
}
