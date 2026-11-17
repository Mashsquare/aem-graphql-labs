## Goal

Build a small production-shaped WKND site — the kind of thing you'll ship in your first weeks: a listing and detail pages fed by **persisted queries**, **typed by codegen**, **prerendered and cached** with Next.js Cache Components, and kept fresh by **AEM publish webhooks**.

```
              build / first visit                            editor clicks "Publish" in AEM
Next.js ──GET execute.json──▶ AEM Publish          AEM ──webhook──▶ /api/aem-events ──▶ revalidateTag()
   │      (persisted query)                                                                  │
   └─ "use cache" + cacheTag("aem:adventures", "aem:adventure:<slug>") ◀──── next request re-fetches
```

Your site lives at **[/capstone/adventures](/capstone/adventures)** (the routes are thin re-exports in `src/app/(sites)/capstone/`). The reference is at [/capstone-solution/adventures](/capstone-solution/adventures).

## Concepts and tooling

This lab adds little GraphQL; it **combines** what you have learned and adds the Next.js pieces that make it production-grade. Each concept below says where you met its ingredients.

### 1. The layers

| Layer | What it does | You learned it in |
| --- | --- | --- |
| Persisted queries over `GET` | the only way the site talks to AEM | Lab 11 |
| `aemPersistedQuery<T>(shortPath, variables)` from `@/lib/aem/client` | `GET`s `/graphql/execute.json/<shortPath>;var=value…`, throws on `errors`, returns `data` | Labs 07, 11 |
| Generated types (`AdventuresAllQuery`, `AdventureBySlugQuery`) | exact result types, no hand-written interfaces | Lab 06 |
| `"use cache"` + `cacheLife` + `cacheTag` | cache the function result, label it | Lab 11 |
| `AemImage`, `AemRichText` | images and rich text from `_dynamicUrl` / `json` | Labs 10, 13 |
| Webhook → `revalidateTag` | refresh exactly what changed | new |
| `generateStaticParams`, `generateMetadata`, `notFound()` | prerender, SEO tags, 404s | new |

### 2. Typed persisted queries

The site never *sends* GraphQL text at runtime; it executes a persisted query **by name**. But it still keeps the document in code ([documents.ts](./documents.ts)) so codegen can type the result. The two must not drift apart — that's what the "contract" test checks by comparing your document against `GET /graphql/list.json` on Publish.

```ts
import type { AdventuresAllQuery } from "./gql/graphql";

const data = await aemPersistedQuery<AdventuresAllQuery>("wknd-shared/adventures-all", { locale: "en" });
data.adventureList.items;   // typed: Array<{ _path: string; title?: string | null; … } | null>
```

Remember from Lab 06: AEM list items are typed `… | null`; filter the nulls out once, at the boundary, so the UI never sees them. A type predicate does it without a cast:

```ts
.filter((item): item is NonNullable<typeof item> => item !== null)
```

The `AdventureListItem` / `AdventureDetail` types in [types.ts](./types.ts) are *derived from the generated types* (`NonNullable<AdventuresAllQuery["adventureList"]["items"][number]>`) — change the query, re-run `npm run codegen`, and they follow.

### 3. Caching with tags: broad + specific

`"use cache"` caches a function's result (Lab 11). **Tags** decide what you can invalidate later. Think about which events must refresh what:

| Cached function | Tags | Refreshed when… |
| --- | --- | --- |
| `getAdventures()` (the list) | `aem:adventures` | *any* adventure (or related data) is published |
| `getAdventure(slug)` (a detail page) | `aem:adventures` **and** `aem:adventure:<slug>` | that adventure is published (specific), or "everything" is refreshed (broad) |

Two tag levels let the webhook be precise (publish one adventure → refresh the list and *that* page) while still allowing a blunt "refresh everything" (a shared location changed). Because the **function arguments are part of the cache key**, `getAdventure("tahoe-skiing")` and `getAdventure("bali-surf-camp")` are separate entries — each with its own specific tag.

```ts
export async function getLocations() {
  "use cache";
  cacheLife("hours");                 // a preset: seconds | minutes | hours | days | weeks | max
  cacheTag("aem:locations");
  return fetchLocations();
}
```

> [!NOTE]
> A function that returns `null` for an unknown slug caches that `null` too. If someone later publishes that slug, the page would keep 404-ing until the entry expires. That is why the detail function is tagged with the *per-slug* tag even before the adventure exists — the publish webhook for that slug then clears the cached `null`.

A page that gets all its data from cached functions can be **prerendered**: Next.js builds it once and serves it statically until a tag is revalidated.

### 4. Dynamic routes with Cache Components

`app/…/adventures/[slug]/page.tsx` is a dynamic route: one page per slug. Four pieces make it fast and correct:

- **`generateStaticParams()`** returns the slugs to prerender at build time: `[{ slug: "bali-surf-camp" }, …]`. Under Cache Components it **must return at least one entry** (an empty array is a build error), so keep a fallback entry in case the list is ever empty.
- **`params` is a Promise** — `const { slug } = await params`. Awaiting it is "runtime data", so do it *inside a `<Suspense>` boundary*: the page outside the boundary can be served instantly as a static shell, and the part that needs the slug streams in. For slugs you *did* prerender it is all static.

  ```tsx
  export default function Page({ params }: { params: Promise<{ slug: string }> }) {
    return (
      <Suspense fallback={<Skeleton />}>
        <Content params={params} />        {/* async component: awaits params, fetches, renders */}
      </Suspense>
    );
  }
  ```
- **`generateMetadata({ params })`** returns the `<title>`/`<meta description>` for the page — `{ title: "…", description: "…" }` — and uses the same cached data, so it costs nothing extra.
- **`notFound()`** (from `next/navigation`) stops rendering and shows the not-found UI. Next.js adds `<meta name="robots" content="noindex">` so search engines don't index it. Call it where the render path can see it (inside the async component, not in a floating promise).

> [!NOTE]
> With streaming, the response status for a not-found page that is discovered *after* the shell was sent is 200, not 404 — hence the `noindex` tag. The solution walkthrough explains the trade-off.

### 5. AEM webhooks → cache tags

When an editor publishes, you don't want to wait for `cacheLife` to run out. **AEM Eventing** can call a webhook with a **CloudEvent** (the mock imitates it):

```http
POST /api/aem-events
Content-Type: application/cloudevents+json
x-aem-webhook-secret: mock-webhook-secret
```

```json
{
  "specversion": "1.0",
  "id": "5f0c…",
  "type": "aem.sites.contentFragment.published",
  "source": "urn:mock-aem:author",
  "time": "2026-10-23T16:20:00.000Z",
  "data": { "path": "/content/dam/wknd-shared/en/adventures/tahoe-skiing/tahoe-skiing", "id": "…", "model": "adventure", "slug": "tahoe-skiing", "user": "admin" }
}
```

| Event `type` | Meaning |
| --- | --- |
| `aem.sites.contentFragment.published` / `.unpublished` | what visitors see changed → invalidate |
| `aem.sites.contentFragment.modified` | an Author-only edit; Publish (what the site renders) didn't change → **ignore** |
| `aem.graphql.persistedQuery.published` / `.unpublished` | a query the site runs changed → invalidate |

Your webhook has three jobs, in this order:

1. **Authenticate** — only AEM knows the shared secret (`x-aem-webhook-secret`). Wrong/missing → `401`. A public endpoint that can purge your cache is a denial-of-service waiting to happen.
2. **Translate** the event into cache tags (a pure function, `tagsForEvent`, so it is trivially testable).
3. **Revalidate** each tag and answer with JSON.

**`revalidateTag(tag, profile)`** (from `next/cache`, usable in Route Handlers) marks tagged entries stale. The second argument decides how stale content is handled: `"max"` serves the old content once while refreshing in the background; **`{ expire: 0 }`** expires the entry immediately, so the *next request waits for fresh data*. From a webhook you want the latter: the editor just clicked Publish and expects the next reload to show it.

```ts
import { revalidateTag } from "next/cache";
for (const tag of ["aem:adventures"]) revalidateTag(tag, { expire: 0 });
```

## What's provided

- **[documents.ts](./documents.ts)** — the persisted queries `wknd-shared/adventures-all` and `wknd-shared/adventure-by-slug` as `graphql()` documents, copied from `GET /graphql/list.json`. Codegen turned them into `AdventuresAllQuery` / `AdventureBySlugQuery` (in `gql/`), and [types.ts](./types.ts) derives `AdventureListItem` / `AdventureDetail` from them. A test checks the documents still match what AEM has persisted — if someone changes the persisted query, your types would lie, and CI tells you.
- **[ui.tsx](./ui.tsx)** — `AdventureGrid`, `AdventureDetailView`, `DetailSkeleton`, `excerptFromHtml`, `WkndShell`.
- `aemPersistedQuery()` from `@/lib/aem/client`, `AemImage` and `AemRichText` from `@/lib/aem/`.

## Data shapes

### `wknd-shared/adventures-all;locale=en`

```json
{ "data": { "adventureList": { "items": [
  { "_path": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp", "title": "Bali Surf Camp", "slug": "bali-surf-camp",
    "activity": "Surfing", "adventureType": "Multi-day Trip", "price": 1890, "tripLength": "6 Days", "groupSize": 6, "difficulty": "Beginner",
    "primaryImage": { "_path": "…", "_dynamicUrl": "/adobe/dynamicmedia/deliver/…", "mimeType": "image/jpeg", "width": 2000, "height": 1333 },
    "description": { "plaintext": "Six days of warm water…" } }
] } } }
```

### `wknd-shared/adventure-by-slug;slug=ski-touring-mont-blanc`

```json
{ "data": { "adventureList": {
  "items": [{ "_path": "…", "_variation": "master", "title": "Ski Touring Mont Blanc", "slug": "ski-touring-mont-blanc",
              "description": { "json": [ { "nodeType": "paragraph", "content": ["…"] } ], "html": "<p>Hut-to-hut ski touring…</p>" },
              "location": { "name": "Chamonix-Mont-Blanc", "city": "Chamonix", "country": "France", "region": "Europe", "coordinates": { "lat": 45.9237, "lng": 6.8694 } },
              "itinerary": { "json": ["…"] }, "gearList": { "json": ["…"] }, "…": "…" }],
  "_references": [{ "_path": "…/ski-touring-mont-blanc-hero.jpg", "_dynamicUrl": "/adobe/…" }, {}, "…"]
} } }
```

An unknown or unpublished slug gives `"items": []`.

## Your tasks

The workspace tab runs a live self-check of tasks 1, 2 and 6. Do them in order.

### Task 1 — all adventures · [data.ts](./data.ts) → `fetchAdventures()`

```ts
const data = await aemPersistedQuery<AdventuresAllQuery>(PERSISTED_ADVENTURES_ALL, { locale: "en" });
return data.adventureList.items.filter(/* drop the nulls — concept 2 */);
```

Return type `Promise<AdventureListItem[]>`.

**Works when:** it returns 16 adventures, the first being *Bali Surf Camp*.

### Task 2 — one adventure · [data.ts](./data.ts) → `fetchAdventure(slug)`

Execute `PERSISTED_ADVENTURE_BY_SLUG` with `{ slug }`. Take `data.adventureList.items[0]`; if it is missing (or `null`) return `null`. Otherwise return `{ adventure, references: data.adventureList._references }` (the `AdventureDetail` shape in [types.ts](./types.ts)).

**Works when:** `ski-touring-mont-blanc` returns the adventure with `location.country === "France"`, rich-text `json` and at least one reference; `does-not-exist` and the draft `iceland-northern-lights-trek` return `null`.

### Task 3 — cached wrappers · [data.ts](./data.ts) → `getAdventures()`, `getAdventure(slug)`

Both are `async` and begin with `"use cache"` (concept 3):

| Function | Body |
| --- | --- |
| `getAdventures()` | `"use cache"; cacheLife("hours"); cacheTag(ADVENTURES_TAG);` → `return fetchAdventures();` |
| `getAdventure(slug)` | `"use cache"; cacheLife("hours"); cacheTag(ADVENTURES_TAG, adventureTag(slug));` → `return fetchAdventure(slug);` |

Import `cacheLife` and `cacheTag` from `next/cache`. `"use cache"` must be the **first statement** of the function body.

### Task 4 — the listing page · [AdventureListPage.tsx](./AdventureListPage.tsx)

```tsx
const adventures = await getAdventures();
return <AdventureGrid adventures={adventures} basePath={BASE_PATH} />;
```

Import `getAdventures` from `./data` and `AdventureGrid` from `./ui`; delete the `CapstoneTodo` placeholder.

**Works when:** `/capstone/adventures` shows 16 cards.

### Task 5 — the detail page · [AdventureDetailPage.tsx](./AdventureDetailPage.tsx)

Three exports (concept 4):

1. **`generateStaticParams`** → `(await getAdventures()).flatMap((a) => a.slug ? [{ slug: a.slug }] : [])`; if that is empty return `[{ slug: "bali-surf-camp" }]` (Cache Components needs at least one).
2. **`generateMetadata({ params })`** → `const detail = await getAdventure((await params).slug)`. No detail → `{ title: "Adventure not found" }`. Otherwise return a `title` of the adventure's title followed by ` · WKND` (for example `Bali Surf Camp · WKND`) and a `description` of `excerptFromHtml(detail.adventure.description?.html)` (`excerptFromHtml` is exported from [ui.tsx](./ui.tsx)).
3. **Default export** → a component that renders `<Suspense fallback={<DetailSkeleton />}><AdventureContent params={params} /></Suspense>`, where the async `AdventureContent`:
   - awaits `params` to get `slug`,
   - calls `getAdventure(slug)`,
   - calls `notFound()` when the result is `null`,
   - otherwise renders `<AdventureDetailView detail={detail} basePath={BASE_PATH} />`.

**Works when:** every card opens a detail page with rich text sections and the location; `/capstone/adventures/nope` shows the not-found page.

### Task 6 — events → tags · [aem-events.ts](./aem-events.ts) → `tagsForEvent(event)`

Apply the rules top to bottom; the first match wins:

| # | Condition | Return |
| --- | --- | --- |
| 1 | `event.type` does **not** end in `.published` or `.unpublished` (e.g. `…modified`) | `[]` |
| 2 | `event.type` starts with `aem.graphql.persistedQuery.` | `[ADVENTURES_TAG]` |
| 3 | `event.data.model === "adventure"` and `event.data.slug` | `[ADVENTURES_TAG, adventureTag(event.data.slug)]` |
| 4 | `event.data.model === "adventure"` without a slug | `[ADVENTURES_TAG]` |
| 5 | `event.data.model === "location"` (shown on every adventure page) | `[ADVENTURES_TAG]` |
| 6 | anything else (articles, authors, …) | `[]` |

`ADVENTURES_TAG` and `adventureTag` come from `./data`. A regular expression such as `/\.(published|unpublished)$/` handles rule 1.

**Works when:** the two `tagsForEvent` tests pass.

### Task 7 — the webhook · [aem-events.ts](./aem-events.ts) → `POST(request)`

| Step | Do | Otherwise |
| --- | --- | --- |
| 1 | header `x-aem-webhook-secret` must equal `process.env.AEM_WEBHOOK_SECRET ?? "mock-webhook-secret"` | `new Response("Unauthorized", { status: 401 })` |
| 2 | `event = await request.json()` inside `try/catch` | `new Response("Invalid JSON", { status: 400 })` |
| 3 | `tags = tagsForEvent(event)`; `revalidateTag(tag, { expire: 0 })` for each | |
| 4 | answer `Response.json({ type: event.type, revalidated: tags })` | |

Check the secret **before** parsing the body — an unauthenticated caller shouldn't make you do any work. Import `revalidateTag` from `next/cache`.

**Works when:** "rejects requests without the shared secret" (401) and "rejects invalid JSON" (400) pass.

## Acceptance criteria

- `npm test -- 15` passes.
- `/capstone/adventures` lists 16 adventures; every card opens a detail page with rich text sections and the location; `/capstone/adventures/nope` shows the not-found page (with a `noindex` tag — see the walkthrough for why the status is 200).
- `npm run build` prerenders all 16 detail pages (look for them in the build output under `/capstone/adventures/[slug]`).
- **The loop**: edit Tahoe Skiing in the [authoring console](http://localhost:4502/mock/console) → reload, unchanged → Publish → the terminal shows `webhook aem.sites.contentFragment.published -> …/api/aem-events 200` → reload, updated.

> [!TIP]
> Stuck on caching behaviour? `npm run build && npm start` behaves like production. In `npm run dev`, Next.js re-renders more eagerly, so stale-content effects are easier to see in production mode.

## Stretch goals

- Persist your *own* queries for the site (Lab 11's script) instead of using the seeded ones — and update `documents.ts` + run codegen.
- Add a `/capstone/adventures/activity/[activity]` route using `wknd-shared/adventures-by-activity` with its own tag.
- Add `sitemap.ts` that lists every adventure URL using `getAdventures()`.
- Add a German site (`/capstone/de/adventures`) — `_locale: "de"` and a fallback to English.
