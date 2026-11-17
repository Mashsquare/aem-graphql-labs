## Walkthrough

### Typed persisted queries

```ts
const data = await aemPersistedQuery<AdventuresAllQuery>(PERSISTED_ADVENTURES_ALL, { locale: "en" });
```

The query *text* is stored in AEM (and mirrored in `documents.ts`); the app only sends the name and variables over GET. Codegen types come from the mirrored document, and a contract test compares it with `/graphql/list.json`. That's the safest way to combine "persisted in AEM" with "type-safe in TypeScript".

### Cache: functions, not pages

```ts
export async function getAdventure(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(ADVENTURES_TAG, adventureTag(slug));
  return fetchAdventure(slug);
}
```

- Arguments (`slug`) are part of the cache key automatically.
- Two tags per detail entry: the specific one for "this adventure was published", the shared one for "list-level changes" (locations, persisted query changes).
- `cacheLife("hours")` is a safety net; webhooks make updates near-instant.
- Fetchers (`fetchAdventure`) are kept separate from the cached wrappers so they're unit-testable without the Next.js runtime.

### Static params + app shell

```tsx
export async function generateStaticParams() {
  return (await getAdventures()).flatMap((a) => (a.slug ? [{ slug: a.slug }] : []));
}
export default function AdventureDetailPage({ params }: Props) {
  return <Suspense fallback={<DetailSkeleton />}><AdventureContent params={params} /></Suspense>;
}
```

All known slugs are prerendered during `next build` (the build talks to AEM — `npm run build` starts the mock for you). An adventure published *after* the build gets an instant shell and is rendered on the first visit, then cached — ISR without any `revalidate` export.

> [!NOTE]
> **Status codes for unknown slugs.** `notFound()` runs inside the Suspense boundary, after the shell started streaming, so the response keeps HTTP **200** — Next.js renders the not-found UI and injects `<meta name="robots" content="noindex">` so search engines drop the page. If you need a real **404** status (monitoring, CDN rules), check the slug *before* streaming starts: in [Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) against a cached slug list, or by awaiting the data outside `<Suspense>` (at the cost of a blocking route).

### The webhook

```ts
if (request.headers.get("x-aem-webhook-secret") !== process.env.AEM_WEBHOOK_SECRET) return 401;
const tags = tagsForEvent(event);
for (const tag of tags) revalidateTag(tag, { expire: 0 });
```

- `*.modified` is ignored: it fires on Author edits, but the site renders Publish — nothing changed yet.
- `{ expire: 0 }` expires immediately (next request re-fetches). `revalidateTag(tag, "max")` would serve stale content once while refreshing in the background — gentler on AEM under load, at the cost of one stale view.
- Unpublishing removes the adventure from Publish; after revalidation the list drops it and the detail page 404s.

## Mapping to a real AEM as a Cloud Service setup

| This lab | Real world |
| --- | --- |
| mock webhook on (un)publish | **AEM Eventing** → Adobe I/O Events → a webhook (or Adobe App Builder action) calling your `/api/aem-events` |
| shared secret header | I/O Events signature verification (`x-adobe-digital-signature-*`) |
| `aemPersistedQuery()` GET | the same GET to `publish-p…-e….adobeaemcloud.com`, usually through the CDN |
| `npm run build` with the mock | CI build with `AEM_PUBLISH_HOST` pointing at the environment |
