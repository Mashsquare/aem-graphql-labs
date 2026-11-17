/**
 *   npm run solution11:persist
 */
import type { AEMHeadless, AEMHeadlessError } from "@adobe/aem-headless-client-js";
import { aemConfig } from "@/lib/aem/config";
import { CONFIGURATION, LAB_QUERIES } from "@/labs/11-aem-persisted-queries/queries";
import { createAuthorClient } from "./aem-headless";

const basicAuth = () =>
  `Basic ${Buffer.from(`${process.env.AEM_AUTHOR_USER ?? "admin"}:${process.env.AEM_AUTHOR_PASSWORD ?? "admin"}`).toString("base64")}`;

async function replicate(path: string) {
  const response = await fetch(`${aemConfig().authorHost}/bin/replicate.json`, {
    method: "POST",
    headers: { Authorization: basicAuth(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ cmd: "activate", path }),
  });
  if (!response.ok) throw new Error(`Replication of ${path} failed: HTTP ${response.status} ${await response.text()}`);
}

export async function persistLabQueries(author: AEMHeadless = createAuthorClient()): Promise<string[]> {
  const persisted: string[] = [];
  for (const { name, ...body } of LAB_QUERIES) {
    const shortPath = `${CONFIGURATION}/${name}`;
    // The SDK sends this string as the request body; AEM accepts the raw query or this JSON form,
    // and only the JSON form can carry cache-control / surrogate-control.
    const payload = JSON.stringify(body);
    try {
      await author.persistQuery(payload, shortPath); // PUT = create
    } catch (error) {
      if ((error as AEMHeadlessError).sdkDetails?.status !== 409) throw error;
      await author.persistQuery(payload, shortPath, { method: "POST" }); // POST = update
    }
    // Persisted queries live under /conf on Author and must be replicated like content.
    await replicate(`/conf/${CONFIGURATION}/settings/graphql/persistentQueries/${name}`);
    persisted.push(shortPath);
  }
  return persisted;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("11-aem-persisted-queries/persist-queries.ts")) {
  persistLabQueries()
    .then((paths) => console.log(`Persisted and published:\n  ${paths.join("\n  ")}`))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
