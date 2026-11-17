import http, { type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { parse, printSchema, validate, type GraphQLSchema } from "graphql";
import type { PersistedQuery, Tier } from "../types";
import { resolveOptions, type MockAemOptions } from "../config";
import { coerceMatrixVariables, createSchema, runGraphQL, type GraphQLRequest, type RequestContext } from "../engine";
import { renderPlaceholderPdf, renderPlaceholderSvg } from "../assets";
import { MockAemStore, ReplicationError, persistedQueryRepositoryPath, type AemEvent } from "../store";
import { consolePage, editPage, graphiqlPage, homePage } from "./pages";
import { findPage, pageHtml, pageModel, resolve, resourceModel } from "../content/sites";

const MAX_BODY_BYTES = 1024 * 1024; // AEM rejects queries larger than 1M characters

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function send(res: ServerResponse, status: number, body: string | Buffer, contentType: string, headers: Record<string, string> = {}) {
  res.writeHead(status, { "Content-Type": contentType, ...headers });
  res.end(body);
}

const sendJson = (res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) =>
  send(res, status, JSON.stringify(body, null, 2), "application/json;charset=utf-8", headers);

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "Request body exceeds 1 MB (AEM's maximum query size).");
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Parses urlencoded, multipart (curl -F) or JSON form bodies into a flat map. */
function parseForm(body: string, contentType: string | undefined): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  const add = (key: string, value: string) => {
    const existing = result[key];
    result[key] = existing === undefined ? value : Array.isArray(existing) ? [...existing, value] : [existing, value];
  };
  if (contentType?.includes("application/json")) {
    const json = JSON.parse(body || "{}") as Record<string, unknown>;
    for (const [key, value] of Object.entries(json)) add(key, String(value));
  } else if (contentType?.includes("multipart/form-data")) {
    const boundary = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType);
    const marker = `--${boundary?.[1] ?? boundary?.[2]}`;
    for (const part of body.split(marker)) {
      const match = /name="([^"]+)"[^\r\n]*\r?\n(?:[^\r\n]+\r?\n)*\r?\n([\s\S]*?)\r?\n?$/.exec(part);
      if (match) add(match[1], match[2]);
    }
  } else {
    for (const [key, value] of new URLSearchParams(body)) add(key, value);
  }
  return result;
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function cacheHeaders(tier: Tier, query: PersistedQuery): Record<string, string> {
  // Defaults documented for AEM as a Cloud Service persisted queries.
  const maxAge = query.cacheControl?.["max-age"] ?? 60;
  const surrogate = {
    "max-age": tier === "author" ? 60 : 7200,
    "stale-while-revalidate": 86400,
    "stale-if-error": 86400,
    ...query.surrogateControl,
  };
  return {
    "Cache-Control": `max-age=${maxAge}`,
    "Surrogate-Control": `max-age=${surrogate["max-age"]}, stale-while-revalidate=${surrogate["stale-while-revalidate"]}, stale-if-error=${surrogate["stale-if-error"]}`,
  };
}

function describePersistedQuery(query: PersistedQuery) {
  return {
    path: {
      configurationName: query.configurationName,
      name: query.name,
      shortPath: `/${query.configurationName}/${query.name}`,
      path: persistedQueryRepositoryPath(query.configurationName, query.name),
    },
    data: {
      query: query.query,
      ...(query.cacheControl ? { "cache-control": query.cacheControl } : {}),
      ...(query.surrogateControl ? { "surrogate-control": query.surrogateControl } : {}),
    },
    published: query.published,
    lastModified: query.lastModified,
  };
}

export interface MockAem {
  readonly store: MockAemStore;
  readonly options: MockAemOptions;
  readonly origins: { author: string; publish: string };
  readonly schema: GraphQLSchema;
  start(): Promise<{ author: string; publish: string }>;
  stop(): Promise<void>;
}

export function createMockAem(overrides: Partial<MockAemOptions> = {}): MockAem {
  const options = resolveOptions(overrides);
  const store = new MockAemStore(options.stateFile);
  const schema = createSchema();
  const origins = {
    author: `http://${options.hostname}:${options.authorPort}`,
    publish: `http://${options.hostname}:${options.publishPort}`,
  };
  const warnedOrigins = new Set<string>();
  let webhookWarned = false;

  const log = (tier: Tier, message: string) => {
    if (options.logRequests) console.log(`[${tier.padEnd(7)}] ${message}`);
  };

  /* ------------------------------------------------------------------------ */
  /* Webhooks (AEM Eventing / Adobe I/O Events style CloudEvents)              */
  /* ------------------------------------------------------------------------ */

  store.onEvent((event: AemEvent) => {
    const data =
      "fragment" in event
        ? {
            path: event.fragment.path,
            id: event.fragment.id,
            model: event.fragment.model,
            slug: event.fragment.content.master.slug ?? null,
            user: event.user,
          }
        : {
            path: persistedQueryRepositoryPath(event.query.configurationName, event.query.name),
            shortPath: `/${event.query.configurationName}/${event.query.name}`,
            user: event.user,
          };
    const payload = { specversion: "1.0", id: randomUUID(), type: event.type, source: "urn:mock-aem:author", time: new Date().toISOString(), data };
    for (const url of options.webhookUrls) {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/cloudevents+json", "x-aem-webhook-secret": options.webhookSecret },
        body: JSON.stringify(payload),
      })
        .then((response) => log("author", `webhook ${event.type} -> ${url} ${response.status}`))
        .catch(() => {
          if (!webhookWarned) log("author", `webhook ${url} unreachable (is the Next.js app running?)`);
          webhookWarned = true;
        });
    }
  });

  /* ------------------------------------------------------------------------ */
  /* Cross-cutting: CORS + authentication                                      */
  /* ------------------------------------------------------------------------ */

  function applyCors(tier: Tier, req: IncomingMessage, res: ServerResponse) {
    const origin = req.headers.origin;
    if (!origin) return;
    if (!options.corsAllowedOrigins.includes(origin)) {
      if (!warnedOrigins.has(origin)) {
        warnedOrigins.add(origin);
        log(tier, `CORS: origin ${origin} is not allowed. In AEM you would add it to a com.adobe.granite.cors.impl.CORSPolicyImpl OSGi config (here: MOCK_AEM_CORS_ALLOWED_ORIGINS).`);
      }
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", tier === "author" ? "GET, HEAD, POST, PUT, DELETE, OPTIONS" : "GET, HEAD, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Expose-Headers", "Surrogate-Control, X-Mock-Aem-Tier");
    res.setHeader("Access-Control-Max-Age", "1800");
    if (tier === "author") res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  function authenticatedUser(req: IncomingMessage): string | null {
    const header = req.headers.authorization ?? "";
    if (header.startsWith("Basic ")) {
      const [user, ...rest] = Buffer.from(header.slice(6), "base64").toString("utf8").split(":");
      return user === options.username && rest.join(":") === options.password ? user : null;
    }
    if (header.startsWith("Bearer ")) {
      return header.slice(7) === options.devToken ? "dev-token-user" : null;
    }
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Route handlers                                                            */
  /* ------------------------------------------------------------------------ */

  const contextFor = (tier: Tier): RequestContext => ({ tier, store, origins, configurationName: options.configurationName });

  function assertConfiguration(name: string) {
    if (name !== options.configurationName) {
      throw new HttpError(404, `No GraphQL endpoint for configuration "${name}". This instance only has "${options.configurationName}".`, {
        hint: `Use /content/cq:graphql/${options.configurationName}/endpoint.json — AEM only exposes models of the configuration the endpoint belongs to.`,
      });
    }
  }

  async function handleGraphQL(tier: Tier, req: IncomingMessage, res: ServerResponse, url: URL): Promise<string> {
    let request: GraphQLRequest;
    if (req.method === "POST") {
      if (tier === "publish" && options.blockAdhocQueriesOnPublish) {
        throw new HttpError(403, "Ad-hoc GraphQL queries are blocked on Publish (Dispatcher default). Use a persisted query.");
      }
      const body = await readBody(req);
      try {
        request = req.headers["content-type"]?.includes("application/graphql") ? { query: body } : (JSON.parse(body) as GraphQLRequest);
      } catch {
        throw new HttpError(400, "Request body is not valid JSON. Send { \"query\": \"...\", \"variables\": {...} }.");
      }
    } else if (req.method === "GET") {
      const variables = url.searchParams.get("variables");
      request = {
        query: url.searchParams.get("query") ?? "",
        variables: variables ? (JSON.parse(variables) as Record<string, unknown>) : undefined,
        operationName: url.searchParams.get("operationName"),
      };
    } else {
      throw new HttpError(405, `Method ${req.method} not allowed on the GraphQL endpoint.`);
    }
    await sleep(options.latencyMs);
    const result = await runGraphQL(schema, request, contextFor(tier));
    sendJson(res, 200, result);
    return /(?:query|mutation)\s+(\w+)/.exec(request.query ?? "")?.[1] ?? "anonymous";
  }

  async function handleExecute(tier: Tier, req: IncomingMessage, res: ServerResponse, rawRemainder: string): Promise<string> {
    // The AEM Headless SDK encodes the whole ";name=value" suffix, so decode first, then split.
    const decoded = decodeURIComponent(rawRemainder);
    const [shortPath, ...matrix] = decoded.split(";");
    const [configurationName, name, ...extra] = shortPath.split("/");
    if (!configurationName || !name || extra.length) {
      throw new HttpError(400, `Expected /graphql/execute.json/<configuration>/<query-name>, got "${shortPath}".`);
    }
    const query = store.persistedQuery(configurationName, name);
    if (!query || (tier === "publish" && !query.published)) {
      throw new HttpError(404, `Persisted query not found: /${configurationName}/${name}`, {
        hint:
          query && tier === "publish"
            ? "It exists on Author but has not been published. Replicate /conf/" +
              `${configurationName}/settings/graphql/persistentQueries/${name} (POST /bin/replicate.json or the console).`
            : "Check /graphql/list.json for the available names.",
      });
    }
    const raw: Record<string, string> = {};
    for (const pair of matrix) {
      if (!pair) continue;
      const index = pair.indexOf("=");
      if (index > 0) raw[pair.slice(0, index)] = pair.slice(index + 1);
    }
    let variables = coerceMatrixVariables(schema, query.query, raw);
    if (req.method === "POST") {
      const body = await readBody(req);
      if (body) variables = { ...variables, ...((JSON.parse(body) as { variables?: Record<string, unknown> }).variables ?? {}) };
    }
    await sleep(options.latencyMs);
    const result = await runGraphQL(schema, { query: query.query, variables }, contextFor(tier));
    sendJson(res, 200, result, cacheHeaders(tier, query));
    return `${configurationName}/${name}`;
  }

  async function handlePersist(req: IncomingMessage, res: ServerResponse, configurationName: string, name: string) {
    assertConfiguration(configurationName);
    if (req.method === "DELETE") {
      const existed = store.deletePersistedQuery(configurationName, name);
      return sendJson(res, existed ? 200 : 404, { action: existed ? "delete" : "not-found", configurationName, name });
    }
    const body = await readBody(req);
    let input: { query: string; cacheControl?: PersistedQuery["cacheControl"]; surrogateControl?: PersistedQuery["surrogateControl"] };
    try {
      const json = JSON.parse(body) as Record<string, unknown>;
      input = {
        query: String(json.query ?? ""),
        cacheControl: json["cache-control"] as PersistedQuery["cacheControl"],
        surrogateControl: json["surrogate-control"] as PersistedQuery["surrogateControl"],
      };
    } catch {
      // The AEM Headless SDK sends the raw GraphQL document as the body.
      input = { query: body };
    }
    if (!input.query.trim()) throw new HttpError(400, "Missing query in request body.");
    let invalid: string[];
    try {
      invalid = validate(schema, parse(input.query)).map((error) => error.message);
    } catch (error) {
      invalid = [(error as Error).message];
    }
    if (invalid.length) {
      throw new HttpError(400, "The query is not valid against the wknd-shared schema.", { errors: invalid });
    }
    const mode = req.method === "PUT" ? "create" : "update";
    const saved = store.savePersistedQuery(mode, { configurationName, name, ...input });
    sendJson(res, mode === "create" ? 201 : 200, {
      action: mode,
      configurationName,
      name,
      shortPath: `/${configurationName}/${name}`,
      path: persistedQueryRepositoryPath(configurationName, name),
      published: saved.published,
    });
  }

  function handleDam(tier: Tier, res: ServerResponse, assetPath: string) {
    const asset = store.assets.get(assetPath);
    if (!asset) throw new HttpError(404, `No asset at ${assetPath}`);
    const cache = { "Cache-Control": tier === "author" ? "private, no-cache" : "public, max-age=600" };
    if (asset.kind === "document") return send(res, 200, renderPlaceholderPdf(asset), "application/pdf", cache);
    send(res, 200, renderPlaceholderSvg(asset, { width: asset.width!, height: asset.height! }), "image/svg+xml", cache);
  }

  function handleDynamicMedia(tier: Tier, res: ServerResponse, assetId: string, file: string, url: URL) {
    const asset = store.assetsById.get(assetId);
    if (!asset || asset.kind !== "image") throw new HttpError(404, `No image asset with id ${assetId}`);
    const params = url.searchParams;
    const crop = params.get("crop")?.split(",").map((value) => Number.parseInt(value, 10));
    const requestedWidth = Number.parseInt(params.get("width") ?? "", 10) || undefined;
    const requestedHeight = Number.parseInt(params.get("height") ?? "", 10) || undefined;
    const sourceWidth = crop?.[2] || asset.width!;
    const sourceHeight = crop?.[3] || asset.height!;
    const width = Math.min(requestedWidth ?? sourceWidth, 4000);
    const height = requestedHeight ?? Math.round((width * sourceHeight) / sourceWidth);
    const format = file.split(".").pop() ?? "jpg";
    const badge = [`${width}×${height}`, params.get("quality") ? `q${params.get("quality")}` : null, format, crop ? "crop" : null]
      .filter(Boolean)
      .join(" · ");
    send(
      res,
      200,
      renderPlaceholderSvg(asset, { width, height, badge, flip: params.get("flip"), rotate: Number(params.get("rotate") ?? 0) }),
      "image/svg+xml",
      { "Cache-Control": tier === "author" ? "private, no-cache" : "public, max-age=600" },
    );
  }

  async function handleReplicate(req: IncomingMessage, res: ServerResponse, user: string) {
    const form = parseForm(await readBody(req), req.headers["content-type"]);
    const command = first(form.cmd)?.toLowerCase();
    const paths = ([] as string[]).concat(form.path ?? []);
    if (command !== "activate" && command !== "deactivate") throw new HttpError(400, 'cmd must be "activate" or "deactivate".');
    if (paths.length === 0) throw new HttpError(400, "path is required.");
    const results = paths.map((path) => {
      store.replicate(path, command, user);
      return { path, cmd: command, status: "ok" };
    });
    sendJson(res, 200, results.length === 1 ? results[0] : results);
  }

  /**
   * The classic half: HTL output, Sling Model Exporter JSON and Core Image renditions of /content/wknd/...
   */
  async function handleSite(tier: Tier, res: ServerResponse, path: string, url: URL): Promise<string> {
    // The default Sling GET servlets dump the raw JCR tree. Publish/Dispatcher block them; so does the mock.
    if (/\.(?:infinity|tidy(?:\.\d+)?|\d+)\.json$/.test(path)) {
      throw new HttpError(403, "The default JSON renderer is disabled. Use the Sling Model Exporter: <path>.model.json", {
        hint: ".infinity.json / .tidy.json / .1.json expose the repository structure, not a stable API. Dispatcher filters block them on Publish.",
      });
    }
    const image = /^(.*)\.coreimg(?:\.(\d+))?\.(?:jpeg|png|webp)\/\d+\/([0-9a-f-]+)\/([^/]+)$/.exec(path);
    if (image) {
      const params = new URL(url);
      if (image[2]) params.searchParams.set("width", image[2]);
      handleDynamicMedia(tier, res, image[3], image[4], params);
      return "coreimg";
    }
    const model = /^(.*)\.model\.json$/.exec(path);
    if (model) {
      const found = resolve(model[1]);
      if (!found) throw new HttpError(404, `No resource at ${model[1]}`, { hint: "Pages: /content/wknd/us/en, /adventures, /featured. Components live under <page>/jcr:content/root/..." });
      await sleep(options.latencyMs);
      const body = found.resourcePath.length === 0 ? pageModel(found.page) : resourceModel(found.page, found.resource, found.resourcePath);
      sendJson(res, 200, body, { "Cache-Control": tier === "publish" ? "max-age=300" : "no-cache" });
      return "model.json";
    }
    const html = /^(.*)\.html$/.exec(path);
    if (html) {
      const page = findPage(html[1]);
      if (!page) throw new HttpError(404, `No page at ${html[1]}`);
      await sleep(options.latencyMs);
      // Author renders in edit mode (adds data-cq-data-path) unless ?wcmmode=disabled.
      const editMode = tier === "author" && url.searchParams.get("wcmmode") !== "disabled";
      send(res, 200, pageHtml(page, { editMode }), "text/html;charset=utf-8", { "Cache-Control": tier === "publish" ? "max-age=300" : "no-cache" });
      return "htl";
    }
    throw new HttpError(404, `No resource at ${path}`);
  }

  async function handleConsole(req: IncomingMessage, res: ServerResponse, route: string, url: URL, user: string) {
    if (req.method === "GET" && route === "/mock/console") return send(res, 200, consolePage(store, url.searchParams.get("flash") ?? undefined), "text/html;charset=utf-8");
    if (req.method === "GET" && route === "/mock/console/edit") {
      const fragment = store.fragments.get(url.searchParams.get("path") ?? "");
      if (!fragment) throw new HttpError(404, "Fragment not found");
      return send(res, 200, editPage(fragment), "text/html;charset=utf-8");
    }
    if (req.method !== "POST") throw new HttpError(405, "Method not allowed");
    const form = parseForm(await readBody(req), req.headers["content-type"]);
    let flash = "";
    if (route === "/mock/console/replicate") {
      const path = first(form.path) ?? "";
      const command = first(form.cmd) === "deactivate" ? "deactivate" : "activate";
      store.replicate(path, command, user);
      flash = `${command === "activate" ? "Published" : "Unpublished"} ${path}`;
    } else if (route === "/mock/console/edit") {
      const path = first(form.path) ?? "";
      const numbers = new Set(([] as string[]).concat(form.__number ?? []));
      const booleans = new Set(([] as string[]).concat(form.__bool ?? []));
      const changes: Record<string, string | number | boolean> = {};
      for (const [key, value] of Object.entries(form)) {
        if (key === "path" || key.startsWith("__")) continue;
        const single = first(value) ?? "";
        changes[key] = numbers.has(key) ? Number(single) : single;
      }
      for (const key of booleans) changes[key] = first(form[key]) === "true";
      store.updateFragment(path, changes, user);
      flash = `Saved ${path} on Author. Publish it to update the Publish tier.`;
    } else if (route === "/mock/console/delete-query") {
      const [configurationName, name] = (first(form.name) ?? "").split("/");
      store.deletePersistedQuery(configurationName, name);
      flash = `Deleted persisted query ${configurationName}/${name}`;
    } else {
      throw new HttpError(404, "Unknown console action");
    }
    res.writeHead(303, { Location: `/mock/console?flash=${encodeURIComponent(flash)}` });
    res.end();
  }

  /* ------------------------------------------------------------------------ */
  /* Router                                                                    */
  /* ------------------------------------------------------------------------ */

  async function route(tier: Tier, req: IncomingMessage, res: ServerResponse): Promise<string | void> {
    const rawPath = (req.url ?? "/").split("?")[0];
    const url = new URL(req.url ?? "/", "http://mock.local");
    let path = rawPath;
    try {
      path = decodeURIComponent(rawPath);
    } catch {
      // keep raw path
    }
    res.setHeader("X-Mock-Aem-Tier", tier);
    applyCors(tier, req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return void res.end();
    }

    if (path === "/mock/health") return sendJson(res, 200, { ok: true, tier, configurationName: options.configurationName });

    let user = "anonymous";
    if (tier === "author") {
      const authenticated = authenticatedUser(req);
      if (!authenticated) {
        throw new HttpError(401, "Authentication required on AEM Author.", {
          hint: `Send "Authorization: Basic <base64 ${options.username}:${options.password}>" (local SDK) or "Authorization: Bearer <MOCK_AEM_DEV_TOKEN>" (developer token).`,
        });
      }
      user = authenticated;
    }

    if (path === "/" && req.method === "GET") return send(res, 200, homePage(tier, options.configurationName, origins), "text/html;charset=utf-8");
    if (path === "/aem/graphiql.html") return send(res, 200, graphiqlPage(tier, options.configurationName), "text/html;charset=utf-8");

    const endpoint = /^\/content\/(?:cq:graphql|_cq_graphql|graphql)\/([^/]+)\/endpoint\.(json|GQLschema)$/.exec(path);
    if (endpoint) {
      assertConfiguration(endpoint[1]);
      if (endpoint[2] === "GQLschema") return send(res, 200, printSchema(schema), "text/x-graphql-schema;charset=utf-8");
      return handleGraphQL(tier, req, res, url);
    }

    const execute = /^\/graphql\/execute\.json\/(.+)$/.exec(rawPath);
    if (execute) {
      if (req.method !== "GET" && req.method !== "POST") throw new HttpError(405, "Use GET (cacheable) or POST to run a persisted query.");
      return handleExecute(tier, req, res, execute[1]);
    }

    const persist = /^\/graphql\/persist\.json\/([^/]+)\/([^/;]+)$/.exec(path);
    if (persist) {
      if (tier === "publish") throw new HttpError(405, "Persisted queries are created on AEM Author and then published.");
      if (!["PUT", "POST", "DELETE"].includes(req.method ?? "")) throw new HttpError(405, "Use PUT to create, POST to update or DELETE to remove.");
      return handlePersist(req, res, persist[1], persist[2]);
    }

    if (path === "/graphql/list.json") {
      const queries = [...store.persistedQueries.values()].filter((query) => tier === "author" || query.published);
      return sendJson(res, 200, queries.map(describePersistedQuery));
    }

    if (path === "/bin/replicate.json") {
      if (tier === "publish") throw new HttpError(404, "Replication is triggered on Author.");
      if (req.method !== "POST") throw new HttpError(405, "POST cmd=activate|deactivate&path=<path>");
      return handleReplicate(req, res, user);
    }

    if (path.startsWith("/content/wknd/") && (req.method === "GET" || req.method === "HEAD")) return handleSite(tier, res, path, url);

    if (path.startsWith("/content/dam/") && (req.method === "GET" || req.method === "HEAD")) return handleDam(tier, res, path);

    const dm = /^\/adobe\/dynamicmedia\/deliver\/dm-aid--([0-9a-f-]+)\/([^/]+)$/.exec(path);
    if (dm) return handleDynamicMedia(tier, res, dm[1], dm[2], url);

    if (path.startsWith("/mock/console")) {
      if (tier === "publish") throw new HttpError(404, "The authoring console only exists on Author.");
      return handleConsole(req, res, path, url, user);
    }

    throw new HttpError(404, `No resource at ${path}`);
  }

  function handler(tier: Tier) {
    return (req: IncomingMessage, res: ServerResponse) => {
      const started = Date.now();
      route(tier, req, res)
        .then((label) => {
          log(tier, `${req.method} ${decodeSafe(req.url)} -> ${res.statusCode} ${Date.now() - started}ms${label ? ` (${label})` : ""}`);
        })
        .catch((error: unknown) => {
          const status = error instanceof HttpError || error instanceof ReplicationError ? error.status : 500;
          const message = error instanceof Error ? error.message : String(error);
          const extra = error instanceof HttpError ? error.extra : {};
          if (status === 500) console.error(error);
          if (!res.headersSent) {
            const headers: Record<string, string> =
              status === 401 && req.headers.accept?.includes("text/html") ? { "WWW-Authenticate": 'Basic realm="Mock AEM Author (admin/admin)"' } : {};
            sendJson(res, status, { errors: [{ message, ...(Object.keys(extra).length ? { extensions: extra } : {}) }] }, headers);
          }
          log(tier, `${req.method} ${decodeSafe(req.url)} -> ${status} ${Date.now() - started}ms ${message}`);
        });
    };
  }

  const servers: Record<Tier, http.Server> = {
    author: http.createServer(handler("author")),
    publish: http.createServer(handler("publish")),
  };

  const listen = (server: http.Server, port: number) =>
    new Promise<number>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, options.hostname === "localhost" ? undefined : options.hostname, () => {
        resolve((server.address() as AddressInfo).port);
      });
    });

  return {
    store,
    options,
    origins,
    schema,
    async start() {
      const [authorPort, publishPort] = await Promise.all([
        listen(servers.author, options.authorPort),
        listen(servers.publish, options.publishPort),
      ]);
      origins.author = `http://${options.hostname}:${authorPort}`;
      origins.publish = `http://${options.hostname}:${publishPort}`;
      return { ...origins };
    },
    async stop() {
      await Promise.all(
        Object.values(servers).map(
          (server) =>
            new Promise<void>((resolve) => {
              if (!server.listening) return resolve();
              server.closeAllConnections();
              server.close(() => resolve());
            }),
        ),
      );
    },
  };
}

function decodeSafe(value: string | undefined): string {
  try {
    return decodeURIComponent(value ?? "");
  } catch {
    return value ?? "";
  }
}
