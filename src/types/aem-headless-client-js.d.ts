/**
 * Type declarations for @adobe/aem-headless-client-js (the package ships plain JavaScript).
 * Written from its src/index.js and api-reference.md — a very common task in real projects:
 * typing an untyped vendor SDK yourself.
 */
declare module "@adobe/aem-headless-client-js" {
  export interface AEMHeadlessConfig {
    /** AEM origin, e.g. https://publish-p123-e456.adobeaemcloud.com */
    serviceURL?: string;
    /** GraphQL endpoint path. Defaults to content/graphql/global/endpoint.json (!) */
    endpoint?: string;
    /** string = Bearer token, [user, password] = Basic auth */
    auth?: string | [string, string];
    headers?: Record<string, string>;
    /** Required outside the browser (Node.js has no window.fetch for the SDK to find). */
    fetch?: (input: string, init?: RequestInit) => Promise<Response>;
  }

  export interface GraphQLResult<TData> {
    data: TData;
    errors?: { message: string }[];
  }

  /** Extra fetch options merged into the request, e.g. { method: "POST" } or Next.js { next: { revalidate } }. */
  export type RequestOptions = RequestInit & { next?: { revalidate?: number | false; tags?: string[] } };

  export class AEMHeadless {
    constructor(config: string | AEMHeadlessConfig);
    serviceURL: string;
    endpoint: string;

    /** POST an ad-hoc query to the configured endpoint. */
    runQuery<TData = unknown>(
      body: string | { query: string; variables?: Record<string, unknown> },
      options?: RequestOptions,
      retryOptions?: Record<string, unknown>,
    ): Promise<GraphQLResult<TData>>;

    /** PUT /graphql/persist.json/<path> (pass { method: "POST" } to update an existing query). */
    persistQuery(query: string, path: string, options?: RequestOptions, retryOptions?: Record<string, unknown>): Promise<unknown>;

    /** GET /graphql/list.json */
    listPersistedQueries(options?: RequestOptions, retryOptions?: Record<string, unknown>): Promise<unknown>;

    /** GET /graphql/execute.json/<path>;var=value… (variables are URI-encoded for you). */
    runPersistedQuery<TData = unknown>(
      path: string,
      variables?: Record<string, unknown>,
      options?: RequestOptions,
      retryOptions?: Record<string, unknown>,
    ): Promise<GraphQLResult<TData>>;

    /** Async generator over List/Paginated results. */
    runPaginatedQuery<TItem = unknown>(
      model: string,
      fields: string,
      config?: Record<string, unknown>,
      args?: Record<string, unknown>,
      options?: RequestOptions,
      retryOptions?: Record<string, unknown>,
    ): AsyncGenerator<TItem[]>;
  }

  /** Errors thrown by the SDK. `code` is REQUEST_ERROR | RESPONSE_ERROR | API_ERROR | INVALID_PARAM. */
  export interface AEMHeadlessError extends Error {
    code: string;
    sdk: "AEMHeadless";
    sdkDetails: { serviceURL?: string; endpoint?: string; status?: number };
  }

  export const ErrorCodes: Record<string, new (...args: unknown[]) => AEMHeadlessError>;
  export default AEMHeadless;
}
