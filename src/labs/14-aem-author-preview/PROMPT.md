## Goal

Editors want to see **unpublished** content in the real site before they hit Publish. That content only exists on **AEM Author**, which requires authentication. You'll build the standard Next.js answer: server-only Author access + **Draft Mode**, entered through a secret preview URL that AEM opens.

## Concepts and tooling

### 1. Two tiers, two audiences

| | Publish (`:4503`) | Author (`:4502`) |
| --- | --- | --- |
| Who | visitors, CDN | editors, preview, CI |
| Auth | none | **required** — local SDK: Basic `admin:admin`; AEMaaCS: developer token / service credentials (Bearer) |
| Content | replicated (published) versions only | working copies: drafts and unpublished edits |
| Browser access | yes (with CORS) | effectively no — you'd have to ship credentials to the browser |

"Preview" therefore means: **the same GraphQL query, sent to Author instead of Publish, with credentials, from the server.** Nothing about the query changes — only the host and the `Authorization` header.

In the mock, two adventures are drafts (*Iceland Northern Lights Trek*, *Patagonia Glacier Expedition*) and the [authoring console](http://localhost:4502/mock/console) lets you edit and publish fragments (the browser will ask for `admin` / `admin`).

### 2. Authenticating against Author

There are two schemes, both sent in the `Authorization` header:

| Scheme | When | Header |
| --- | --- | --- |
| **Basic** | local AEM SDK (and the mock) | `Authorization: Basic <base64("user:password")>` |
| **Bearer** | AEM as a Cloud Service: a developer token from the Developer Console, or a token minted from service credentials | `Authorization: Bearer <token>` |

In Node, base64 is `Buffer.from("user:password").toString("base64")`. For `admin:admin` that is `YWRtaW46YWRtaW4=`. Without credentials, Author answers **HTTP 401** with a GraphQL-style body:

```json
{ "errors": [{ "message": "Authentication required on AEM Author.", "extensions": { "hint": "Send \"Authorization: Basic …\" or \"Authorization: Bearer …\"" } }] }
```

A token, when configured, should win over username/password (it is the production credential; Basic is the local fallback).

### 3. Keeping credentials out of the browser

Two mechanisms, both used in this lab:

- **Environment variables.** Only variables prefixed `NEXT_PUBLIC_` are inlined into the JavaScript sent to the browser. `AEM_AUTHOR_USER`, `AEM_AUTHOR_PASSWORD` and `AEM_AUTHOR_TOKEN` have no such prefix, so they exist only on the server. Don't ever rename them.
- **`import "server-only"`.** Anything imported by a Client Component ends up in the browser bundle. A file that starts with `import "server-only";` makes the **build fail** if a Client Component imports it (directly or indirectly):

  ```ts
  // lib/secrets.ts
  import "server-only";
  export const apiKey = () => process.env.SOME_SECRET;
  ```

  Importing `lib/secrets.ts` from a `"use client"` file → build error, instead of a silent leak.

> [!CAUTION]
> This is the lab's main security lesson: **Author credentials must never reach a Client Component.** The "Call Author from the browser" button in the workspace demonstrates the failure mode — the browser can't authenticate, and shouldn't be able to.

### 4. Draft Mode

Next.js caches aggressively (Labs 11 and 15), but an editor needs to see the latest draft *now*, while visitors keep the cached site. **Draft Mode** does exactly that: it sets a cookie (`__prerender_bypass`) in **one browser**. While it is present:

- `fetch` skips the fetch cache and `"use cache"` functions **re-execute on every request** and are not saved;
- statically generated pages are rendered fresh for that browser;
- other visitors are unaffected.

The API (`next/headers`) is **async**:

```ts
import { draftMode } from "next/headers";

const draft = await draftMode();
draft.enable();            // set the cookie   — Route Handlers / Server Actions only
draft.disable();           // delete the cookie
draft.isEnabled;           // boolean          — readable in Server Components and inside "use cache" scopes
```

The pages then choose the tier: `const preview = (await draftMode()).isEnabled;` → `getAdventures(preview)`.

### 5. The preview entry point (a Route Handler)

The usual flow:

```
AEM "Preview" button ─▶ GET /api/lab14/draft?secret=…&slug=…
                          ├─ wrong secret ................ 401
                          ├─ no slug ..................... 400
                          ├─ slug unknown on Author ...... 404
                          └─ ok ─▶ draftMode().enable() ─▶ redirect to the page
```

Why each guard:

| Guard | Why |
| --- | --- |
| **shared secret** | a Route Handler that enables preview (and thereby shows Author content) must not be callable by anyone; only AEM knows the secret |
| **slug required** | nothing to preview otherwise |
| **look it up on Author** | drafts only exist there; a typo shouldn't enable preview and land on an empty page |
| **redirect with the slug *from AEM*** | never build the redirect target from the raw query parameter you were handed — that is how open redirects happen |

A Route Handler is a function `(request: Request) => Response`. The building blocks:

```ts
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);       // parse the query string
  const secret = searchParams.get("secret");           // string | null

  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response("Invalid preview secret", { status: 401 });   // plain text + status code
  }
  // …
}
```

`redirect(url)` from `next/navigation` works in Route Handlers too, with one gotcha: it **works by throwing**, so call it *outside* any `try/catch`, or your `catch` will swallow the redirect.

> [!NOTE]
> The mounted route (`src/app/api/lab14/draft/route.ts`) wraps your `GET` and first calls `await connection()`. With Cache Components, GET handlers are prerendered at build time unless they read request-time data; a preview entry point must run on every request.

### 6. Never cache a preview

A preview that is cached is a preview that shows stale or — worse — *leaks* unpublished content to the next visitor. On the `fetch` call use `cache: "no-store"`. (Draft Mode also bypasses the caches around your code, but make the fetch itself explicit.)

## Data shape

Same query, two tiers:

```bash
curl -s -X POST http://localhost:4503/content/cq:graphql/wknd-shared/endpoint.json -H "Content-Type: application/json" -d "{\"query\":\"{ adventureList(_locale: \\\"en\\\") { items { slug } } }\"}"
```

```json
{ "data": { "adventureList": { "items": ["… 16 published slugs …"] } } }
```

```bash
curl -s -u admin:admin -X POST http://localhost:4502/content/cq:graphql/wknd-shared/endpoint.json -H "Content-Type: application/json" -d "{\"query\":\"{ adventureList(_locale: \\\"en\\\") { items { slug } } }\"}"
```

```json
{ "data": { "adventureList": { "items": ["… 18 slugs, including iceland-northern-lights-trek …"] } } }
```

Without credentials, Author answers with the 401 body shown in concept 2.

## Your tasks

### Task 1 — choose the tier · [aem-tier.ts](./aem-tier.ts) → `getAemTarget(preview)`

Return an `AemTarget` (`{ tier, host, headers }` — [types.ts](./types.ts)). Read `aemConfig()` and `process.env` **inside** the function, so changes to the environment (the tests set `AEM_AUTHOR_TOKEN`) are seen.

| `preview` | Return |
| --- | --- |
| `false` | `{ tier: "publish", host: aemConfig().publishHost, headers: {} }` |
| `true`, `AEM_AUTHOR_TOKEN` set | `{ tier: "author", host: aemConfig().authorHost, headers: { Authorization: "Bearer <token>" } }` |
| `true`, no token | `{ tier: "author", host: aemConfig().authorHost, headers: { Authorization: "Basic <base64(user:password)>" } }` with `user = AEM_AUTHOR_USER ?? "admin"`, `password = AEM_AUTHOR_PASSWORD ?? "admin"` |

The test compares with `toEqual`: no extra keys.

### Task 2 — query the chosen tier · [aem-tier.ts](./aem-tier.ts) → `queryTier(preview, query, variables?)`

```ts
const target = getAemTarget(preview);
const response = await fetch(`${target.host}${aemConfig().endpoint}`, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...target.headers },
  body: JSON.stringify({ query, variables }),
  cache: "no-store",
});
```

Then: parse the JSON body. If the response is not OK **or** `body.errors?.length`, throw an `Error` whose message names the tier, the HTTP status and the joined `errors[].message` (so the 401 from Author is readable). Otherwise return `body.data` as `TData`.

(`getAdventures` and `getAdventureBySlug` below it are already written on top of `queryTier`.)

**Works when:** "shows drafts only on Author" (18 vs 16 adventures) and "shows unpublished edits only in preview" pass.

### Task 3 — the guarded entry point · [draft-route.ts](./draft-route.ts) → `GET(request)`

In exactly this order:

| # | Check | Response |
| --- | --- | --- |
| 1 | `secret` query parameter ≠ `process.env.PREVIEW_SECRET ?? "lab-preview-secret"` | `new Response("Invalid preview secret", { status: 401 })` |
| 2 | no `slug` parameter | `new Response("Missing slug", { status: 400 })` |
| 3 | `await getAdventureBySlug(slug, true)` (the **Author** tier) returns `null` | a `Response` with status **404** and a text such as `No adventure "<slug>" on AEM Author` |
| 4 | otherwise | enable Draft Mode, then redirect (see below) |

Step 4 in code:

```ts
(await draftMode()).enable();
redirect(`${WORKSPACE}?slug=${encodeURIComponent(adventure.slug)}`);
```

Import `draftMode` from `next/headers`, `redirect` from `next/navigation` and `getAdventureBySlug` from `./aem-tier`. Remember the `redirect` gotcha from concept 5 — no `try/catch` around it. Use `adventure.slug` (from AEM), not the raw parameter.

**Works when:** the three "draft route guards" tests pass.

## Acceptance criteria

- `npm test -- 14` passes.
- "preview the Iceland draft" switches the workspace into preview: banner, 18 adventures, Iceland visible with a *draft* badge. "Exit preview" returns to 16.
- "try a wrong secret" shows `Invalid preview secret` (401).
- Edit *Tahoe Skiing*'s title in the authoring console: the preview shows it at once; visitors only after you click **Publish** in the console.
- "Call Author from the browser" fails with 401 — and nothing in your client bundle contains `admin:admin`.

## Stretch goals

- Read `isEnabled` inside a `"use cache"` function (allowed) to choose the tier, and confirm the cache is bypassed while previewing.
- AEM's **Universal Editor** loads your site in an iframe from Author; look up its `data-aue-*` instrumentation attributes and add `data-aue-resource`/`data-aue-prop` to the adventure title.
- Replace Basic auth with a token: set `AEM_AUTHOR_TOKEN=mock-local-dev-token` in `.env.local` and restart.
