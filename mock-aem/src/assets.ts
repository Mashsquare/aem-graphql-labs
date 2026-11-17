import type { Asset } from "./types";

/** The `_assetTransform` argument as it arrives from GraphQL. */
export interface AssetTransformInput {
  format?: "GIF" | "PNG" | "PNG8" | "JPG" | "PJPG" | "BJPG" | "WEBP" | "WEBPLL" | "WEBPLY";
  seoName?: string;
  crop?: { xOrigin: number; yOrigin: number; width?: number; height?: number };
  size?: { width?: number; height?: number };
  rotation?: "R90" | "R180" | "R270";
  flip?: "HORIZONTAL" | "VERTICAL" | "HORIZONTAL_AND_VERTICAL";
  quality?: number;
  width?: number;
  preferWebp?: boolean;
}

const extensionFor = (format: AssetTransformInput["format"], fallback: string) => {
  switch (format) {
    case "GIF":
      return "gif";
    case "PNG":
    case "PNG8":
      return "png";
    case "JPG":
    case "PJPG":
    case "BJPG":
      return "jpg";
    case "WEBP":
    case "WEBPLL":
    case "WEBPLY":
      return "webp";
    default:
      return fallback;
  }
};

const basename = (assetPath: string) => assetPath.split("/").pop() ?? "asset";

/**
 * Builds a web-optimized delivery URL like AEM as a Cloud Service does:
 *   /adobe/dynamicmedia/deliver/dm-aid--<asset uuid>/<seo-name>.<ext>?preferwebp=true&width=...&quality=...
 * The URL is relative on purpose — clients must prefix the AEM Publish (or Author) origin.
 */
export function dynamicUrl(asset: Asset, transform: AssetTransformInput | undefined): string | null {
  if (asset.kind !== "image") return null;
  const file = basename(asset.path);
  const dot = file.lastIndexOf(".");
  const stem = (transform?.seoName ?? (dot > 0 ? file.slice(0, dot) : file)).toLowerCase();
  const ext = extensionFor(transform?.format, dot > 0 ? file.slice(dot + 1).toLowerCase() : "jpg");

  const params = new URLSearchParams();
  if (transform?.preferWebp !== false) params.set("preferwebp", "true");
  const width = transform?.size?.width ?? transform?.width;
  if (width) params.set("width", String(width));
  if (transform?.size?.height) params.set("height", String(transform.size.height));
  if (transform?.quality) params.set("quality", String(transform.quality));
  if (transform?.crop) {
    const { xOrigin, yOrigin, width: cropWidth, height: cropHeight } = transform.crop;
    params.set("crop", [xOrigin, yOrigin, cropWidth ?? "", cropHeight ?? ""].join(","));
  }
  if (transform?.rotation) params.set("rotate", transform.rotation.slice(1));
  if (transform?.flip) params.set("flip", transform.flip.toLowerCase());

  return `/adobe/dynamicmedia/deliver/dm-aid--${asset.id}/${stem}.${ext}?${params.toString()}`;
}

/* -------------------------------------------------------------------------- */
/* Placeholder renditions                                                      */
/* -------------------------------------------------------------------------- */

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function sceneShapes(scene: Asset["scene"], w: number, h: number, hue: number): string {
  const ground = `hsl(${(hue + 140) % 360} 35% 32%)`;
  const ground2 = `hsl(${(hue + 160) % 360} 30% 22%)`;
  switch (scene) {
    case "waves":
      return [0, 1, 2]
        .map((row) => {
          const y = h * (0.6 + row * 0.12);
          const amp = h * 0.03;
          const path = Array.from({ length: 9 }, (_, i) => `Q ${(w / 8) * i + w / 16} ${y - amp * (i % 2 ? -1 : 1)} ${(w / 8) * (i + 1)} ${y}`).join(" ");
          return `<path d="M 0 ${y} ${path} L ${w} ${h} L 0 ${h} Z" fill="hsl(${(hue + 190) % 360} 60% ${45 - row * 9}%)" opacity="0.92"/>`;
        })
        .join("");
    case "city":
      return Array.from({ length: 14 }, (_, i) => {
        const bw = w / 14;
        const bh = h * (0.25 + ((i * 37) % 40) / 100);
        return `<rect x="${i * bw}" y="${h - bh}" width="${bw - 4}" height="${bh}" fill="${i % 2 ? ground : ground2}"/>`;
      }).join("");
    case "forest":
      return (
        `<path d="M0 ${h * 0.7} Q ${w * 0.3} ${h * 0.55} ${w * 0.6} ${h * 0.68} T ${w} ${h * 0.62} V ${h} H 0 Z" fill="${ground}"/>` +
        Array.from({ length: 12 }, (_, i) => {
          const x = (w / 12) * i + w / 24;
          const th = h * (0.18 + ((i * 13) % 10) / 60);
          const base = h * 0.82;
          return `<path d="M ${x} ${base - th} L ${x + th * 0.35} ${base} L ${x - th * 0.35} ${base} Z" fill="${ground2}"/>`;
        }).join("")
      );
    case "desert":
      return (
        `<path d="M ${w * 0.15} ${h} V ${h * 0.45} H ${w * 0.3} V ${h * 0.6} H ${w * 0.38} V ${h} Z" fill="hsl(${(hue + 10) % 360} 55% 40%)"/>` +
        `<path d="M 0 ${h * 0.8} Q ${w * 0.5} ${h * 0.65} ${w} ${h * 0.82} V ${h} H 0 Z" fill="hsl(${(hue + 30) % 360} 60% 55%)"/>`
      );
    case "snow":
      return (
        `<path d="M0 ${h} L ${w * 0.3} ${h * 0.35} L ${w * 0.55} ${h * 0.75} L ${w * 0.75} ${h * 0.45} L ${w} ${h * 0.8} V ${h} Z" fill="hsl(${hue} 15% 92%)"/>` +
        `<path d="M0 ${h} L ${w * 0.3} ${h * 0.35} L ${w * 0.38} ${h * 0.5} L ${w * 0.22} ${h} Z" fill="hsl(${hue} 20% 80%)"/>`
      );
    case "portrait":
      return (
        `<circle cx="${w / 2}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.18}" fill="hsl(${(hue + 20) % 360} 35% 80%)"/>` +
        `<path d="M ${w * 0.2} ${h} Q ${w / 2} ${h * 0.55} ${w * 0.8} ${h} Z" fill="${ground}"/>`
      );
    default:
      return (
        `<path d="M0 ${h} L ${w * 0.28} ${h * 0.42} L ${w * 0.5} ${h * 0.7} L ${w * 0.72} ${h * 0.3} L ${w} ${h * 0.75} V ${h} Z" fill="${ground}"/>` +
        `<path d="M ${w * 0.72} ${h * 0.3} L ${w * 0.79} ${h * 0.42} L ${w * 0.68} ${h * 0.38} Z" fill="white" opacity="0.85"/>` +
        `<path d="M0 ${h} L ${w * 0.35} ${h * 0.68} L ${w * 0.6} ${h * 0.85} L ${w} ${h * 0.7} V ${h} Z" fill="${ground2}"/>`
      );
  }
}

export interface PlaceholderOptions {
  width: number;
  height: number;
  /** Shown in a badge so you can see which transformation the URL requested. */
  badge?: string;
  flip?: string | null;
  rotate?: number;
}

export function renderPlaceholderSvg(asset: Asset, options: PlaceholderOptions): string {
  const { width: w, height: h } = options;
  const hue = asset.hue;
  const font = Math.max(12, Math.round(Math.min(w, h) / 16));
  const transforms: string[] = [];
  if (options.flip === "horizontal" || options.flip === "horizontal_and_vertical") transforms.push(`translate(${w} 0) scale(-1 1)`);
  if (options.flip === "vertical" || options.flip === "horizontal_and_vertical") transforms.push(`translate(0 ${h}) scale(1 -1)`);
  if (options.rotate) transforms.push(`rotate(${options.rotate} ${w / 2} ${h / 2})`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(asset.title)}">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="hsl(${hue} 70% 72%)"/><stop offset="1" stop-color="hsl(${(hue + 35) % 360} 80% 90%)"/>
</linearGradient></defs>
<g transform="${transforms.join(" ")}">
<rect width="${w}" height="${h}" fill="url(#sky)"/>
<circle cx="${w * 0.78}" cy="${h * 0.24}" r="${Math.min(w, h) * 0.09}" fill="hsl(${(hue + 50) % 360} 95% 88%)"/>
${sceneShapes(asset.scene, w, h, hue)}
</g>
<rect x="0" y="${h - font * 2.2}" width="${w}" height="${font * 2.2}" fill="black" opacity="0.45"/>
<text x="${font * 0.8}" y="${h - font * 0.75}" font-family="system-ui, sans-serif" font-size="${font}" fill="white">${esc(asset.title)}</text>
${
  options.badge
    ? `<rect x="${w - font * 0.6 - options.badge.length * font * 0.52}" y="${font * 0.5}" rx="${font * 0.3}" width="${options.badge.length * font * 0.52 + font * 0.2}" height="${font * 1.5}" fill="black" opacity="0.6"/>
<text x="${w - font * 0.5}" y="${font * 1.6}" text-anchor="end" font-family="ui-monospace, monospace" font-size="${font * 0.8}" fill="white">${esc(options.badge)}</text>`
    : ""
}
</svg>`;
}

/** A tiny but valid single-page PDF so DocumentRef links open in the browser. */
export function renderPlaceholderPdf(asset: Asset): Buffer {
  const pdfText = (value: string) => value.replace(/[\\()]/g, (char) => `\\${char}`).replace(/[^\x20-\x7e]/g, "?");
  const stream = `BT /F1 22 Tf 72 720 Td (${pdfText(asset.title)}) Tj ET\nBT /F1 12 Tf 72 690 Td (Placeholder document served by the mock AEM DAM: ${pdfText(asset.path)}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}
