import "server-only";
import { aemQuery, type AemRequestOptions } from "./client";

/**
 * Author credentials for server-side code. `server-only` makes the build fail if a Client
 * Component ever imports this file — so the credentials can never end up in a browser bundle.
 */
export function authorAuthorizationHeader(): string {
  const token = process.env.AEM_AUTHOR_TOKEN;
  if (token) return `Bearer ${token}`;
  const user = process.env.AEM_AUTHOR_USER ?? "admin";
  const password = process.env.AEM_AUTHOR_PASSWORD ?? "admin";
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

export function aemAuthorQuery<TData, TVariables extends object = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  options: Omit<AemRequestOptions, "tier"> = {},
) {
  return aemQuery<TData, TVariables>(query, variables, {
    ...options,
    tier: "author",
    headers: { Authorization: authorAuthorizationHeader(), ...options.headers },
  });
}
