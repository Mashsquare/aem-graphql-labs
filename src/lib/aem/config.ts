/**
 * Where AEM lives. Read lazily (functions, not constants) so tests can point the app at a
 * private mock instance. The defaults match the mock started by `npm run dev`.
 */
export interface AemConfig {
  publishHost: string;
  authorHost: string;
  /** e.g. /content/cq:graphql/wknd-shared/endpoint.json */
  endpoint: string;
  /** Sites configuration that owns the models and persisted queries, e.g. wknd-shared */
  configurationName: string;
}

export function aemConfig(): AemConfig {
  const configurationName = process.env.AEM_CONFIGURATION_NAME ?? "wknd-shared";
  return {
    publishHost: process.env.AEM_PUBLISH_HOST ?? "http://localhost:4503",
    authorHost: process.env.AEM_AUTHOR_HOST ?? "http://localhost:4502",
    endpoint: process.env.AEM_GRAPHQL_ENDPOINT ?? `/content/cq:graphql/${configurationName}/endpoint.json`,
    configurationName,
  };
}

/**
 * The subset that is safe to ship to the browser. Only NEXT_PUBLIC_* variables are inlined into
 * client bundles — and only Publish, never Author or credentials.
 */
export function publicAemConfig(): Pick<AemConfig, "publishHost" | "endpoint"> {
  return {
    publishHost: process.env.NEXT_PUBLIC_AEM_PUBLISH_HOST ?? "http://localhost:4503",
    endpoint: process.env.NEXT_PUBLIC_AEM_GRAPHQL_ENDPOINT ?? "/content/cq:graphql/wknd-shared/endpoint.json",
  };
}
