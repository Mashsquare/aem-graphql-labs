## Goal

In production, AEM headless apps don't POST queries to Publish — they call **persisted queries** with `GET`, so the Dispatcher and the CDN can cache the responses. You'll go through the whole lifecycle with Adobe's official SDK, **`@adobe/aem-headless-client-js`**:

**write → persist on Author → replicate to Publish → execute with GET → cache in Next.js**

## Concepts and tooling

### 1. Why persisted queries exist

An ad-hoc query is an HTTP `POST` with the query text in the body. That has three problems in production:

| Problem with ad-hoc `POST` | What persisted queries do instead |
| --- | --- |
| **CDNs and the Dispatcher don't cache `POST`** — every visitor hits AEM | the query is addressed by a **URL**, fetched with `GET`, cached like any page |
| Anyone can send *any* query — including expensive ones | only queries a developer stored on the server can run (an allow-list) |
| Long query text on every request | the request is a short URL; the text lives on the server |

So the rule of thumb: **ad-hoc POST for development (GraphiQL, labs 07–10), persisted `GET` for anything a visitor triggers.**

### 2. The lifecycle: one query, two tiers

A persisted query is stored as a node under the configuration: `/conf/<config>/settings/graphql/persistentQueries/<name>`. You persist it on **Author**, then **replicate** that node to **Publish** (the same mechanism that publishes pages). Publish can only run what has been replicated.

| Step | Request | Tier |
| --- | --- | --- |
| Create | `PUT /graphql/persist.json/<config>/<name>` with the query (raw text, or JSON `{ "query", "cache-control", "surrogate-control" }`) | **Author** |
| Update | `POST /graphql/persist.json/<config>/<name>` | Author |
| List | `GET /graphql/list.json` | both |
| Publish (replicate) | `POST /bin/replicate.json` with form fields `cmd=activate` and `path=/conf/<config>/settings/graphql/persistentQueries/<name>` (in real AEM also a content package or GraphiQL's Publish button) | Author → Publish |
| Execute | `GET /graphql/execute.json/<config>/<name>;var1=value1;var2=value2` | Publish |

> [!IMPORTANT]
> The classic production bug: *"it works on Author but Publish says 404"*. The query was persisted but never replicated. This lab makes you hit — and fix — exactly that.

Persisting by hand with `curl` (Author needs credentials; Git Bash users prefix `MSYS_NO_PATHCONV=1`, PowerShell users use `curl.exe`):

```bash
# create — a persisted query that lists locations
curl -u admin:admin -X PUT http://localhost:4502/graphql/persist.json/wknd-shared/my-locations \
  -H "Content-Type: application/json" \
  -d '{"query":"{ locationList(_locale: \"en\") { items { name } } }"}'
# replicate to Publish
curl -u admin:admin -X POST http://localhost:4502/bin/replicate.json \
  -F cmd=activate -F path=/conf/wknd-shared/settings/graphql/persistentQueries/my-locations
# execute on Publish
curl http://localhost:4503/graphql/execute.json/wknd-shared/my-locations
```

Run the first command, then open the Publish URL — **404**. Run the second, then the third — data. (Do this before writing code; it is the whole lab in three lines.)

### 3. Variables are "matrix parameters"

A persisted query URL has no query string. Variables are appended to the **path**, each introduced by `;`:

```
/graphql/execute.json/wknd-shared/adventure-by-slug;slug=bali-surf-camp
                      └─── config/name ───────────┘└── ;name=value ──┘
```

The reason is caching: a path is a cache key everywhere, while query strings are often stripped or ignored. The consequence is encoding — a value containing `;`, `=`, `/`, `?` or `&` would corrupt the URL, so each value goes through `encodeURIComponent`:

```ts
encodeURIComponent("rock/climbing; hard");   // "rock%2Fclimbing%3B%20hard"
encodeURIComponent(JSON.stringify([1, 2]));   // "%5B1%2C2%5D"  ← non-string values are JSON first
```

The algorithm to build the suffix is therefore: for each variable, skip it if it is `undefined`/`null`; turn it into a string (strings as-is, anything else with `JSON.stringify`); encode it; append `;name=encodedValue`. The SDK does exactly this for you; in Task 3 you do it by hand once so it isn't magic.

### 4. Default cache headers

AEM answers a persisted-query `GET` with caching headers, and that is where the performance comes from:

| | Author | Publish |
| --- | --- | --- |
| `Cache-Control: max-age` (the **browser**) | 60 | 60 |
| `Surrogate-Control: max-age` (the **CDN**) | 60 | 7200 |
| `stale-while-revalidate` / `stale-if-error` | 86400 | 86400 |

`stale-while-revalidate` means: after `max-age` expires the CDN may still serve the old copy while it fetches a new one in the background; `stale-if-error` serves the old copy if AEM is down. You can override all of it **per query** (`cache-control` / `surrogate-control` in the persist body, which this lab does), via Cloud Manager variables or OSGi.

### 5. The SDK in one screen

```ts
import { AEMHeadless } from "@adobe/aem-headless-client-js";

const aem = new AEMHeadless({
  serviceURL: "http://localhost:4503",
  endpoint: "/content/cq:graphql/wknd-shared/endpoint.json", // the default is the *global* endpoint!
  auth: ["admin", "admin"],          // [user, password] = Basic; a string = Bearer token; omit on Publish
  fetch: (url, init) => fetch(url, init), // required outside the browser
});

await aem.persistQuery(queryOrJsonBody, "wknd-shared/my-query");                       // PUT (create)
await aem.persistQuery(queryOrJsonBody, "wknd-shared/my-query", { method: "POST" });    // update
const { data } = await aem.runPersistedQuery("wknd-shared/my-query", { slug: "bali-surf-camp" });
```

| Gotcha | Why |
| --- | --- |
| `endpoint` defaults to the **global** endpoint | wrong for `wknd-shared` — always set it |
| `fetch` is required outside the browser | Node has no `window.fetch` for the SDK to find. Wrap it: `fetch: (url, init) => fetch(url, init)` |
| `auth` shape | `[user, password]` → Basic, `string` → Bearer |
| errors | the SDK throws `AEMHeadlessError`: `error.code` (`API_ERROR`, `REQUEST_ERROR`, …) and `error.sdkDetails.status` (the HTTP status) |
| no types | the package ships plain JavaScript; this repo adds `src/types/aem-headless-client-js.d.ts` — typing an untyped vendor SDK is a very real task |

The SDK also has no "replicate" helper. That is one plain `fetch` (Task 2).

### 6. Next.js: a second cache in front of AEM

Even with CDN caching, your server still calls AEM when it renders. **Cache Components** (`cacheComponents: true`, already on in this project) let you cache the *result of a function* with the `"use cache"` directive:

```ts
import { cacheLife, cacheTag } from "next/cache";

export async function getLocations(country: string) {
  "use cache";                                              // first statement of the function body
  cacheLife({ stale: 60, revalidate: 120, expire: 3600 });  // how long the entry lives
  cacheTag("aem:locations");                                // a label you can invalidate by

  const data = await fetchLocationsFromAem(country);
  return { data, fetchedAt: new Date().toISOString() };     // proof of caching: the time doesn't change
}
```

| Piece | Meaning |
| --- | --- |
| `"use cache"` | the function's return value is cached; **its arguments are part of the cache key** (`"FR"` and `"IT"` are separate entries). Arguments and return value must be serialisable. |
| `cacheLife({ stale, revalidate, expire })` | `stale`: seconds a *client* may reuse without asking. `revalidate`: after this, the next request gets the cached value **and** triggers a background refresh. `expire`: after this with no traffic, the next request waits for fresh data. (`expire` must be longer than `revalidate`.) Presets exist: `cacheLife("hours")`. |
| `cacheTag(tag)` | attach tags; `revalidateTag(tag, …)` later invalidates every entry with that tag (Lab 15 wires that to AEM publish events) |

Pick values that mirror the AEM response: a query AEM says is good for 120 s makes `revalidate: 120` a sensible match. You now have **two** caches (Next.js, then the AEM CDN); a change on AEM becomes visible only after both have expired or been invalidated — remember this when something "doesn't update".

## Data shapes

### `GET /graphql/execute.json/wknd-shared/lab-adventures-by-difficulty;difficulty=Expert`

```http
HTTP/1.1 200 OK
Content-Type: application/json;charset=utf-8
Cache-Control: max-age=120
Surrogate-Control: max-age=600, stale-while-revalidate=86400, stale-if-error=86400
```

```json
{ "data": { "adventureList": { "items": [
  { "_path": "/content/dam/wknd-shared/en/adventures/ski-touring-mont-blanc/ski-touring-mont-blanc", "title": "Ski Touring Mont Blanc", "slug": "ski-touring-mont-blanc", "activity": "Skiing", "difficulty": "Expert", "price": 3890 }
] } } }
```

### `PUT /graphql/persist.json/wknd-shared/lab-adventures-by-difficulty` → 201

```json
{ "action": "create", "configurationName": "wknd-shared", "name": "lab-adventures-by-difficulty",
  "shortPath": "/wknd-shared/lab-adventures-by-difficulty",
  "path": "/conf/wknd-shared/settings/graphql/persistentQueries/lab-adventures-by-difficulty" }
```

Persisting the same name again with `PUT` answers **409 Conflict** — that is when you switch to `POST`.

## Your tasks

### Task 1 — two SDK clients · [aem-headless.ts](./aem-headless.ts)

`createPublishClient()` and `createAuthorClient()` both return `new AEMHeadless({ … })` (concept 5) with values read from `aemConfig()` **inside** the functions:

| | Publish client | Author client |
| --- | --- | --- |
| `serviceURL` | `aemConfig().publishHost` | `aemConfig().authorHost` |
| `endpoint` | `aemConfig().endpoint` | `aemConfig().endpoint` |
| `auth` | none | `[process.env.AEM_AUTHOR_USER ?? "admin", process.env.AEM_AUTHOR_PASSWORD ?? "admin"]` |
| `fetch` | `(url, init) => fetch(url, init)` | same |

**Works when:** "point at the right tiers and endpoint" and "the publish client can run a seeded persisted query" pass.

### Task 2 — persist and publish · [persist-queries.ts](./persist-queries.ts) → `persistLabQueries(author)`

Run it with `npm run lab11:persist` (the mock must be running). For **each entry of `LAB_QUERIES`**, in order, do the five steps below. Let `name` be `entry.name`, `shortPath` be `"<CONFIGURATION>/<name>"` and `nodePath` be `"/conf/<CONFIGURATION>/settings/graphql/persistentQueries/<name>"`.

```ts
// 1. the body: the query plus its per-query cache settings (undefined keys vanish in JSON.stringify)
const body = JSON.stringify({ query, "cache-control": …, "surrogate-control": … });

// 2. create it
await author.persistQuery(body, shortPath);

// 3. if it already exists, update it instead — the SDK error carries the HTTP status
//    catch (error) { if (error.sdkDetails?.status === 409) await author.persistQuery(body, shortPath, { method: "POST" }); else throw error; }

// 4. replicate to Publish: a form POST with Basic auth (the SDK has no helper for this)
const response = await fetch(`${authorHost}/bin/replicate.json`, {
  method: "POST",
  headers: { Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}` },
  body: new URLSearchParams({ cmd: "activate", path: nodePath }),
});
// …throw if !response.ok

// 5. remember shortPath for the return value
```

`authorHost` is `aemConfig().authorHost`; `user`/`password` are the same credentials as in Task 1 (`AEM_AUTHOR_USER` / `AEM_AUTHOR_PASSWORD`, default `admin`/`admin`). `URLSearchParams` as a body makes `fetch` send `application/x-www-form-urlencoded`, which is what `/bin/replicate.json` expects.

Return the list: `["wknd-shared/lab-adventures-by-difficulty", "wknd-shared/lab-adventure-slugs"]`.

**Works when:** the "persist → replicate → execute" tests pass — including *"can run again (updates instead of failing with 409)"* — and the workspace status panel turns green after `npm run lab11:persist`.

### Task 3 — the URL, by hand · [data.ts](./data.ts) → `persistedQueryUrl(shortPath, variables?)`

Return `/graphql/execute.json/<shortPath>` followed by the matrix suffix from concept 3. Examples the tests check:

| Call | Result |
| --- | --- |
| `("wknd-shared/adventure-by-slug", { slug: "bali-surf-camp" })` | `/graphql/execute.json/wknd-shared/adventure-by-slug;slug=bali-surf-camp` |
| `("cfg/q", { text: "a;b=c/d", limit: 3, filter: { x: 1 }, skip: undefined })` | `/graphql/execute.json/cfg/q;text=a%3Bb%3Dc%2Fd;limit=3;filter=%7B%22x%22%3A1%7D` |

### Task 4 — run it through the SDK · [data.ts](./data.ts) → `getAdventuresByDifficulty(difficulty)`

`createPublishClient().runPersistedQuery<LabAdventuresData>("wknd-shared/lab-adventures-by-difficulty", { difficulty })` and return `data.adventureList.items`. (`LabAdventuresData` is in [queries.ts](./queries.ts).)

### Task 5 — look at the headers · [data.ts](./data.ts) → `inspectPersistedQuery(shortPath, variables?)`

A plain `fetch` of `` `${aemConfig().publishHost}${persistedQueryUrl(shortPath, variables)}` `` and return `{ url, status: response.status, cacheControl: response.headers.get("cache-control"), surrogateControl: response.headers.get("surrogate-control") }`. **Do not throw on 404** — the first test *expects* status 404 before the query is replicated, and you want to see the headers either way.

### Task 6 — cache it in Next.js · [cached.ts](./cached.ts) → `getCachedAdventures(difficulty)`

Per concept 6, inside the function: `"use cache"` as the first statement, `cacheLife({ stale: 60, revalidate: 120, expire: 3600 })`, `cacheTag(ADVENTURES_TAG)`. Then `return { items: await getAdventuresByDifficulty(difficulty), fetchedAt: new Date().toISOString() }`. Import `cacheLife` and `cacheTag` from `next/cache`.

**Works when:** reloading the workspace keeps the same "fetched at" time; clicking "Expire tag" makes the next render fetch again.

## Acceptance criteria

- `npm test -- 11` passes (it persists into a private mock and checks Publish).
- After `npm run lab11:persist` the workspace shows both queries on Author **and** Publish, the results per difficulty, and `Cache-Control: max-age=120` for your query vs `max-age=60` for the seeded `adventures-all`.
- Reloading keeps the same "fetched at" time; "Expire tag" makes the next render fetch again.

## Stretch goals

- Change the query in `queries.ts`, re-run the script and observe the update (POST) path.
- Run a persisted query with `{ method: "POST" }` and a JSON variables body — and think about why that defeats CDN caching.
- Compare `"use cache"` with the previous model: `fetch(url, { next: { revalidate: 120, tags: [ADVENTURES_TAG] } })`. Same idea, per request instead of per function.
