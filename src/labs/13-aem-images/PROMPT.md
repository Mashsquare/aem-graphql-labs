## Goal

Images are usually the heaviest part of a headless page. AEM as a Cloud Service can deliver **web-optimized renditions** (resized, recompressed, WebP) on the fly. You'll request them through GraphQL, wire them into **`next/image`** with a custom loader and build a responsive `srcset` by hand.

## Concepts and tooling

The GraphQL examples use the **Author** model's `profilePicture`. The tasks use the adventures' `primaryImage`.

### 1. Four URLs for one image

A content reference to an image resolves to `ImageRef` (Lab 07), which offers several URLs:

| Field | What it is | Use it for |
| --- | --- | --- |
| `_path` | DAM path `/content/dam/…/hero.jpg` | identity, lookups (`_references`, Lab 10) |
| `_authorUrl` / `_publishUrl` | absolute URL of the **original** binary on that tier | downloads, the original file |
| `_dynamicUrl` | **relative** URL of a web-optimized rendition: `/adobe/dynamicmedia/deliver/dm-aid--<uuid>/<name>.<ext>?preferwebp=true…` | everything you render |

Rule of thumb: render `_dynamicUrl`, never the original (a 6 MB camera JPEG).

> [!NOTE]
> Since `_dynamicUrl` is relative, *your app* decides the origin — Publish for visitors, Author (with authentication) for previews. Prefixing it is the most common thing forgotten in AEM headless code reviews. (You wrote `toPublishUrl` for this in Lab 07.)

### 2. `_assetTransform`: ask AEM to prepare the rendition

`_assetTransform` is an **argument of the query field** (`authorList(…, _assetTransform: {…})`, `adventureList(…)`, `…ByPath(…)`) and applies to *every* `_dynamicUrl` in that result:

```graphql
query AuthorAvatars($format: AssetTransformFormat, $quality: Int, $width: Int) {
  authorList(
    _locale: "en"
    limit: 1
    _assetTransform: { format: $format, quality: $quality, width: $width, preferWebp: true }
  ) {
    items {
      profilePicture { ... on ImageRef { _dynamicUrl width height } }
    }
  }
}
```

with variables `{ "format": "WEBP", "quality": 60, "width": 400 }` the response contains:

```json
{ "profilePicture": {
    "_dynamicUrl": "/adobe/dynamicmedia/deliver/dm-aid--139d041f-…/ian-provo.webp?preferwebp=true&width=400&quality=60",
    "width": 800, "height": 800 } }
```

Notice what changed: the **file extension** follows `format`, and `width` and `quality` are **query parameters in the URL**. (`width`/`height` next to it are the *original's* dimensions — useful for aspect ratio, not for the delivered size.)

| `_assetTransform` field | Values |
| --- | --- |
| `format` | an **enum**: `GIF`, `PNG`, `PNG8`, `JPG`, `PJPG`, `BJPG`, `WEBP`, `WEBPLL`, `WEBPLY` |
| `quality` | `1`–`100` |
| `width` | pixels |
| `preferWebp` | serve WebP when the browser supports it |
| also | `seoName`, `crop { xOrigin yOrigin width height }`, `size { width height }`, `rotation`, `flip` |

> [!IMPORTANT]
> `format` is a GraphQL **enum**: in the query text you write it bare (`format: WEBP`), but as a **variable** it is passed as a JSON string (`"WEBP"`) and the variable's type is the enum's name (`$format: AssetTransformFormat`). Quoting it in the query text (`format: "WEBP"`) is a validation error.

### 3. Because it's a URL, you can adjust it later

The transform is encoded in the query string. So the same `_dynamicUrl` can be re-targeted to other widths **in the client, without another GraphQL request** — which is exactly what responsive images need.

```ts
const url = new URL("/adobe/x/a.webp?preferwebp=true&quality=60", "http://localhost:4503");
url.searchParams.set("width", "640");     // add or replace one parameter
url.searchParams.has("quality");           // true  → leave it alone
url.searchParams.get("preferwebp");        // "true" → untouched
url.toString();                            // "http://localhost:4503/adobe/x/a.webp?preferwebp=true&quality=60&width=640"
```

`URL` + `searchParams` is the right tool: string concatenation breaks the moment the URL already has (or lacks) a `?`.

### 4. `next/image`, `srcset` and the loader

A responsive `<img>` offers the browser **several candidate files** and lets it choose:

```html
<img src="…width=800" srcset="…width=400 400w, …width=800 800w, …width=1600 1600w" sizes="(max-width: 768px) 100vw, 50vw">
```

- `srcset` lists `URL <width>w` pairs (`400w` = "this file is 400 px wide"), separated by `, `.
- `sizes` tells the browser how wide the image will be *on screen* so it can pick a candidate. Without it the browser assumes `100vw` and downloads more than needed.

`next/image` generates that markup for you. It asks a **loader function** for the URL of each width it wants (derived from `deviceSizes`/`imageSizes`). The default loader points at Next.js's own optimizer; for AEM, which already optimizes images, you supply your own:

```ts
// contract: ({ src, width, quality }) => string      (quality is undefined unless you pass the quality prop)
const exampleCdnLoader = ({ src, width, quality }: ImageLoaderProps) =>
  `https://cdn.example.com/${src}?w=${width}&q=${quality || 75}`;
```

```tsx
<Image loader={exampleCdnLoader} src="me.png" width={500} height={500} alt="Me" />
```

Other `next/image` props this lab uses:

| Prop | Why |
| --- | --- |
| `width`, `height` | the image's *intrinsic* size — lets the browser reserve space, so no layout shift. From AEM: `ImageRef.width/height`. |
| `alt` | required. Describe the image, or `""` if it is decorative. |
| `sizes` | see above |
| `preload` | `true` adds a `<link rel="preload">` — for the **one** above-the-fold hero image only. (Next.js 16 replaces the deprecated `priority` prop with `preload`.) |
| `quality` | forwarded to your loader. Next.js 16 only accepts values listed in `images.qualities` in `next.config.ts` (this project allows 40, 60, 75, 90); others are coerced to the closest. |

> [!NOTE]
> `loader` is a **function**, and functions can't be passed from a Server Component to a Client Component. That is why `AemImage` is a Client Component that imports the loader itself.

The mock renders placeholder SVGs and prints the delivered size/quality/format into a badge, so you can *see* whether your parameters arrived.

## Data shape

`adventureList(_locale: "en", limit: 6, _assetTransform: { format: WEBP, quality: 60, width: 800, preferWebp: true })`

```json
{
  "_path": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp",
  "title": "Bali Surf Camp",
  "primaryImage": {
    "_path": "/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp-hero.jpg",
    "_dynamicUrl": "/adobe/dynamicmedia/deliver/dm-aid--dce67894-bf0e-57f8-8be6-ce1d79097ee2/bali-surf-camp-hero.webp?preferwebp=true&width=800&quality=60",
    "_publishUrl": "http://localhost:4503/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp-hero.jpg",
    "_authorUrl": "http://localhost:4502/content/dam/wknd-shared/en/adventures/bali-surf-camp/bali-surf-camp-hero.jpg",
    "mimeType": "image/jpeg",
    "width": 2000,
    "height": 1333
  }
}
```

## Your tasks

### Task 1 — the query · [images.ts](./images.ts) → `HERO_IMAGES_QUERY`, `getHeroImages(transform)`

```graphql
query HeroImages($format: AssetTransformFormat, $quality: Int, $width: Int) {
  adventureList(
    _locale: "en"
    sort: "title ASC"
    limit: 6
    _assetTransform: { format: $format, quality: $quality, width: $width, preferWebp: true }
  ) {
    items {
      _path
      title
      primaryImage { … on ImageRef { … } }
    }
  }
}
```

On the `ImageRef` select `_path _dynamicUrl _publishUrl _authorUrl mimeType width height` (write the real `... on ImageRef`). `getHeroImages(transform = {})` passes `transform` directly as the variables — its keys (`format`, `quality`, `width`) are already named like the variables — and returns `data.adventureList.items`. Omitted variables simply aren't sent.

**Works when:** without a transform you get 6 images with both tier URLs; with `{ format: "WEBP", quality: 60, width: 800 }` every `_dynamicUrl` ends in `.webp` and carries `width=800&quality=60`.

### Task 2 — the loader · [images.ts](./images.ts) → `aemImageLoader({ src, width, quality })`

1. `const url = new URL(src, publicAemConfig().publishHost);` — absolute on Publish; existing parameters survive.
2. `url.searchParams.set("width", String(width));` — **always**.
3. Quality, in this order of priority:

   | Situation | Do |
   | --- | --- |
   | the `quality` argument is set | `url.searchParams.set("quality", String(quality))` |
   | no argument, URL has no `quality` yet | set `"75"` |
   | no argument, URL already has `quality` (from `_assetTransform`) | leave it |

4. `return url.toString();`

**Works when** (the three loader tests):

| Input | Output has |
| --- | --- |
| `{ src: SRC, width: 640, quality: 60 }` | `width=640`, `quality=60`, `preferwebp=true`, origin = Publish |
| `{ src: SRC, width: 100 }` | `quality=75` |
| `{ src: SRC + "&quality=60", width: 100 }` | `quality=60`; with `quality: 90` argument → `90` |

### Task 3 — a hand-made `srcset` · [images.ts](./images.ts) → `buildSrcSet(dynamicUrl, widths)`

For each width call the loader and append the descriptor, then join with `", "`:

```
buildSrcSet(SRC, [400, 800])  →  "http://localhost:4503/…?preferwebp=true&quality=75&width=400 400w, http://localhost:4503/…&width=800 800w"
```

(Parameter order inside the URL doesn't matter; the pair `<url> <width>w` does.)

### Task 4 — the component · [AemImage.tsx](./AemImage.tsx) → `AemImage`

Render `next/image` (`import Image from "next/image"`):

```tsx
<Image
  loader={aemImageLoader}
  src={props.image._dynamicUrl}
  width={props.image.width}
  height={props.image.height}
  alt={props.alt}
  sizes={props.sizes}
  preload={props.preload}
  quality={props.quality}
  className={props.className}
/>
```

Keep `"use client"` at the top of the file. Remove the `todo(...)` call.

**Works when:** the workspace shows the images with a badge per image.

## Acceptance criteria

- `npm test -- 13` passes.
- The playground changes every image (format/quality/width appear in the badges).
- In DevTools → Elements, the hero `<img>` has a `srcset` with many widths pointing at `localhost:4503/adobe/dynamicmedia/deliver/…`; DevTools → Network shows the browser fetched only one of them.

## Stretch goals

- Use `seoName` to deliver SEO-friendly file names (`/…/surf-camp-bali.webp`).
- Art direction: a `<picture>` with a square `crop` for mobile and the full image for desktop.
- Configure the loader globally with `images.loaderFile` in `next.config.ts` instead of a wrapper component — what are the trade-offs?
