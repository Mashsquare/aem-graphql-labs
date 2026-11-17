import { print, type DocumentNode } from "graphql";
import { aemConfig } from "./config";
import type { GraphQLErrorShape, GraphQLResponse } from "./types";

/**
 * A small, framework-free AEM GraphQL client used by the provided parts of the labs.
 * (Lab 07 asks you to build exactly this yourself.)
 */

export class AemGraphQLError extends Error {
  constructor(
    message: string,
    readonly errors: GraphQLErrorShape[] = [],
    readonly status?: number,
  ) {
    super(message);
    this.name = "AemGraphQLError";
  }
}

export type AemTier = "publish" | "author";

export interface AemRequestOptions {
  tier?: AemTier;
  /** Extra headers, e.g. Authorization for Author (see lib/aem/server.ts). */
  headers?: HeadersInit;
  /** Passed through to fetch — e.g. { cache: "force-cache", next: { revalidate: 60 } }. */
  init?: RequestInit;
}

const hostFor = (tier: AemTier = "publish") => (tier === "author" ? aemConfig().authorHost : aemConfig().publishHost);

async function parse<TData>(response: Response, label: string): Promise<TData> {
  let body: GraphQLResponse<TData>;
  try {
    body = (await response.json()) as GraphQLResponse<TData>;
  } catch {
    throw new AemGraphQLError(`${label}: AEM answered ${response.status} with a non-JSON body`, [], response.status);
  }
  // AEM answers 200 even for invalid queries — always check `errors`.
  if (!response.ok || body.errors?.length) {
    const messages = body.errors?.map((error) => error.message).join("; ") || response.statusText;
    throw new AemGraphQLError(`${label}: ${messages}`, body.errors ?? [], response.status);
  }
  if (!body.data) throw new AemGraphQLError(`${label}: response contained no data`, [], response.status);
  return body.data;
}

/** POST an ad-hoc query to /content/cq:graphql/<config>/endpoint.json */
export async function aemQuery<TData, TVariables extends object = Record<string, unknown>>(
  query: string | DocumentNode,
  variables?: TVariables,
  options: AemRequestOptions = {},
): Promise<TData> {
  const response = await fetch(`${hostFor(options.tier)}${aemConfig().endpoint}`, {
    ...options.init,
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...options.headers },
    body: JSON.stringify({ query: typeof query === "string" ? query : print(query), variables }),
  });
  return parse<TData>(response, "AEM GraphQL");
}

/**
 * Builds /graphql/execute.json/<config>/<name>;var1=value1;var2=value2
 * Values are URI-encoded; objects/arrays are sent as JSON.
 */
export function persistedQueryPath(shortPath: string, variables: Record<string, unknown> = {}): string {
  const matrix = Object.entries(variables)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, value]) => `;${name}=${encodeURIComponent(typeof value === "string" ? value : JSON.stringify(value))}`)
    .join("");
  return `/graphql/execute.json/${shortPath.replace(/^\//, "")}${matrix}`;
}

/** GET a persisted query — cacheable by the browser, Dispatcher and CDN. */
export async function aemPersistedQuery<TData>(
  shortPath: string,
  variables: Record<string, unknown> = {},
  options: AemRequestOptions = {},
): Promise<TData> {
  const response = await fetch(`${hostFor(options.tier)}${persistedQueryPath(shortPath, variables)}`, {
    ...options.init,
    method: "GET",
    headers: { Accept: "application/json", ...options.headers },
  });
  return parse<TData>(response, `Persisted query ${shortPath}`);
}

/** Turns a repository path or relative _dynamicUrl into an absolute URL on the given tier. */
export function aemUrl(pathOrUrl: string, tier: AemTier = "publish"): string {
  return new URL(pathOrUrl, hostFor(tier)).toString();
}
