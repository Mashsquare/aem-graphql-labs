## Walkthrough

### Transform once, in the query

```graphql
adventureList(_locale: "en", limit: 6,
  _assetTransform: { format: $format, quality: $quality, width: $width, preferWebp: true }) { … }
```

Variables keep the document constant, so the same persisted query can serve "card" and "hero" sizes. Unset variables are dropped and AEM falls back to the original.

### The loader

```ts
export function aemImageLoader({ src, width, quality }: ImageLoaderProps) {
  const url = new URL(src, publicAemConfig().publishHost);
  url.searchParams.set("width", String(width));
  if (quality) url.searchParams.set("quality", String(quality));
  else if (!url.searchParams.has("quality")) url.searchParams.set("quality", "75");
  return url.toString();
}
```

- `new URL(relative, base)` resolves the relative `_dynamicUrl` and keeps existing params (`preferwebp=true`).
- `searchParams.set` overrides a `width` that came from `_assetTransform`, so next/image controls the width per `srcset` candidate.
- Quality is different: next/image only passes `quality` when you set the prop. Without it, keep the quality the content query asked for (`_assetTransform: { quality }`) instead of silently replacing it with a default.
- With a custom `loader`, Next.js' built-in optimizer (`/_next/image`) is bypassed entirely — AEM does the work, closer to the CDN, and you don't need `images.remotePatterns`.

### Why a Client Component wrapper

`loader` is a function prop, and Server Components can only pass serializable props to Client Components. Putting `"use client"` + the import inside `AemImage.tsx` solves it once for the whole app. (Alternative: `images.loaderFile` in `next.config.ts` makes the loader global for every `next/image`.)

### width + height from AEM

`ImageRef.width/height` are the intrinsic dimensions. Passing them gives next/image the aspect ratio, so the browser reserves space before the image loads — no Cumulative Layout Shift.

## Real-world notes

- `_dynamicUrl` is AEM as a Cloud Service only (not AEM 6.5). With Dynamic Media (Scene7) you'd use `_dmS7Url`, and smart crops are available as `_smartCrops`.
- Web-optimized delivery responses are cached (the docs mention 10 minutes on Publish). Image URLs are cache keys — avoid adding random parameters.
