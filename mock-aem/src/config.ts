import path from "node:path";

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function listFromEnv(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export interface MockAemOptions {
  hostname: string;
  authorPort: number;
  publishPort: number;
  /** Sites configuration that owns the models + GraphQL endpoint (wknd-shared, like the WKND reference site). */
  configurationName: string;
  /** Local AEM SDK default credentials. */
  username: string;
  password: string;
  /** Simulates a "Local Development Access Token" from the AEM Developer Console. */
  devToken: string;
  /** Mirrors com.adobe.granite.cors.impl.CORSPolicyImpl "alloworigin". */
  corsAllowedOrigins: string[];
  /** Artificial latency for GraphQL responses so loading states are visible. */
  latencyMs: number;
  /** Simulates the Dispatcher default that blocks POST/ad-hoc GraphQL queries on Publish. */
  blockAdhocQueriesOnPublish: boolean;
  /** Receives AEM-Eventing-style webhooks when content is (un)published. */
  webhookUrls: string[];
  webhookSecret: string;
  /** Where runtime changes (persisted queries, edits, replication) are stored. null = in memory only. */
  stateFile: string | null;
  /** Print one line per request. */
  logRequests: boolean;
}

export function resolveOptions(overrides: Partial<MockAemOptions> = {}): MockAemOptions {
  const persist = process.env.MOCK_AEM_PERSIST_STATE !== "false";
  return {
    hostname: process.env.MOCK_AEM_HOSTNAME ?? "localhost",
    authorPort: intFromEnv("MOCK_AEM_AUTHOR_PORT", 4502),
    publishPort: intFromEnv("MOCK_AEM_PUBLISH_PORT", 4503),
    configurationName: "wknd-shared",
    username: process.env.MOCK_AEM_USER ?? "admin",
    password: process.env.MOCK_AEM_PASSWORD ?? "admin",
    devToken: process.env.MOCK_AEM_DEV_TOKEN ?? "mock-local-dev-token",
    corsAllowedOrigins: listFromEnv("MOCK_AEM_CORS_ALLOWED_ORIGINS", [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]),
    latencyMs: intFromEnv("MOCK_AEM_LATENCY_MS", 150),
    blockAdhocQueriesOnPublish: process.env.MOCK_AEM_BLOCK_ADHOC_ON_PUBLISH === "true",
    webhookUrls: listFromEnv("MOCK_AEM_WEBHOOK_URLS", [
      "http://localhost:3000/api/aem-events",
      "http://localhost:3000/api/solutions/aem-events",
    ]),
    webhookSecret: process.env.MOCK_AEM_WEBHOOK_SECRET ?? "mock-webhook-secret",
    stateFile: persist
      ? (process.env.MOCK_AEM_STATE_FILE ?? path.resolve(process.cwd(), "mock-aem/.data/state.json"))
      : null,
    logRequests: process.env.MOCK_AEM_LOG !== "false",
    ...overrides,
  };
}
