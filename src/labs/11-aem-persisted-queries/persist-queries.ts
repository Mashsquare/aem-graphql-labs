/**
 * Task 2 — persist the lab queries on AUTHOR and publish them.
 *
 *   npm run lab11:persist
 *
 * For every query in LAB_QUERIES:
 *   1. persist it: author.persistQuery(body, `${CONFIGURATION}/${name}`)
 *      - body: JSON.stringify({ query, "cache-control", "surrogate-control" })
 *      - PUT creates; if it already exists (HTTP 409 -> error.sdkDetails.status === 409),
 *        update with author.persistQuery(body, path, { method: "POST" })
 *   2. replicate it to Publish: POST <author>/bin/replicate.json
 *      form fields cmd=activate and path=/conf/<config>/settings/graphql/persistentQueries/<name>
 *      (the SDK has no helper for this — use fetch with the same Basic auth)
 * Return the short paths you persisted, e.g. ["wknd-shared/lab-adventures-by-difficulty", ...].
 */
import type { AEMHeadless } from "@adobe/aem-headless-client-js";
import { todo } from "@/lib/todo";
import { createAuthorClient } from "./aem-headless";
import { CONFIGURATION, LAB_QUERIES } from "./queries";

export async function persistLabQueries(author: AEMHeadless = createAuthorClient()): Promise<string[]> {
  void author;
  void CONFIGURATION;
  void LAB_QUERIES;
  return todo("implement persistLabQueries() in persist-queries.ts");
}

// Runs when executed as a script (npm run lab11:persist), not when imported by tests or pages.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("11-aem-persisted-queries/persist-queries.ts")) {
  persistLabQueries()
    .then((paths) => console.log(`Persisted and published:\n  ${paths.join("\n  ")}`))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
