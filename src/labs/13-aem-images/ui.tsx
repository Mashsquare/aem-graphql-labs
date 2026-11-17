/** Provided UI for Lab 13. */
import type { ComponentType } from "react";
import { Field, JsonPeek, Panel, buttonClass, inputClass } from "@/components/lab-ui";
import type { AemImageProps } from "./AemImage";
import type { HeroImage, TransformOptions } from "./images";

export interface ImagesApi {
  getHeroImages: (transform?: TransformOptions) => Promise<HeroImage[]>;
  buildSrcSet: (dynamicUrl: string, widths: number[]) => string;
  AemImage: ComponentType<AemImageProps>;
}

const FORMATS = ["", "JPG", "PNG", "WEBP"] as const;

export async function ImagesView({ api, transform }: { api: ImagesApi; transform: TransformOptions }) {
  const images = await api.getHeroImages(transform);
  const [hero, ...rest] = images.filter((item) => item.primaryImage);
  const { AemImage } = api;

  return (
    <div className="space-y-6">
      <Panel title="_assetTransform playground" description="These values become GraphQL variables; every _dynamicUrl in the result changes. The image badge shows what was delivered.">
        <form className="flex flex-wrap items-end gap-3">
          <Field label="format">
            <select name="format" defaultValue={transform.format ?? ""} className={inputClass}>
              {FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format || "(original)"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="quality">
            <input name="quality" type="number" min={1} max={100} defaultValue={transform.quality ?? ""} className={`${inputClass} w-24`} />
          </Field>
          <Field label="width">
            <input name="width" type="number" min={50} max={4000} step={50} defaultValue={transform.width ?? ""} className={`${inputClass} w-28`} />
          </Field>
          <button className={buttonClass}>Apply</button>
        </form>
        {hero?.primaryImage ? <JsonPeek label="primaryImage of the first result" data={hero.primaryImage} /> : null}
      </Panel>

      {hero?.primaryImage ? (
        <Panel title={`<AemImage> · ${hero.title}`} description='next/image + your loader. Resize the window and watch DevTools: the browser picks a width from srcset; preload adds a <link rel="preload">.'>
          <AemImage image={hero.primaryImage} alt={hero.title} sizes="(min-width: 1024px) 60vw, 100vw" preload className="h-auto w-full rounded-lg" />
          <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted">_dynamicUrl</dt>
            <dd className="font-mono break-all">{hero.primaryImage._dynamicUrl}</dd>
            <dt className="text-muted">_publishUrl</dt>
            <dd className="font-mono break-all">{hero.primaryImage._publishUrl}</dd>
            <dt className="text-muted">_authorUrl</dt>
            <dd className="font-mono break-all">{hero.primaryImage._authorUrl}</dd>
          </dl>
        </Panel>
      ) : null}

      <Panel title="Plain <img srcSet> with your buildSrcSet()" description="No framework magic — useful in Server Components and emails.">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {rest.map((item) =>
            item.primaryImage ? (
              <figure key={item._path} className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={api.buildSrcSet(item.primaryImage._dynamicUrl, [400]).split(" ")[0]}
                  srcSet={api.buildSrcSet(item.primaryImage._dynamicUrl, [400, 800, 1200])}
                  sizes="(min-width: 768px) 33vw, 50vw"
                  width={item.primaryImage.width}
                  height={item.primaryImage.height}
                  alt={item.title}
                  loading="lazy"
                  className="h-auto w-full rounded-md"
                />
                <figcaption className="text-xs text-muted">{item.title}</figcaption>
              </figure>
            ) : null,
          )}
        </div>
      </Panel>
    </div>
  );
}

export function transformFrom(params: { format?: string; quality?: string; width?: string }): TransformOptions {
  const number = (value?: string) => (value && Number(value) > 0 ? Number(value) : undefined);
  return {
    format: (["JPG", "PNG", "WEBP", "GIF"].includes(params.format ?? "") ? params.format : undefined) as TransformOptions["format"],
    quality: number(params.quality),
    width: number(params.width),
  };
}
