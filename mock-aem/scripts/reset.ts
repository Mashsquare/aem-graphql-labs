/**
 * Forgets every runtime change made to the mock (persisted queries you created, edits, publish
 * status) by deleting the state file. Restart the mock afterwards.
 *
 *   npm run mock:reset
 */
import fs from "node:fs";
import { resolveOptions } from "../src/config";

const { stateFile } = resolveOptions();
if (stateFile && fs.existsSync(stateFile)) {
  fs.rmSync(stateFile);
  console.log(`Deleted ${stateFile}. Restart the mock (npm run dev) to load the seed content again.`);
} else {
  console.log("Nothing to reset — the mock is using its seed content.");
}
