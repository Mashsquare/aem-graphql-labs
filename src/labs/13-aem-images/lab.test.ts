import { describe, expect, it } from "vitest";
import { pick, withMockAem } from "@/test/lab";
import * as exercise from "./images";
import * as solution from "@/solutions/13-aem-images/images";

const lab = pick(exercise, solution);
const mock = withMockAem();
const SRC = "/adobe/dynamicmedia/deliver/dm-aid--123/bali.jpg?preferwebp=true";

describe("Lab 13 · aemImageLoader()", () => {
  it("makes the URL absolute and sets width + quality, keeping existing params", () => {
    const url = new URL(lab.aemImageLoader({ src: SRC, width: 640, quality: 60 }));
    expect(url.origin).toBe(mock.aem.origins.publish);
    expect(url.pathname).toBe("/adobe/dynamicmedia/deliver/dm-aid--123/bali.jpg");
    expect(url.searchParams.get("width")).toBe("640");
    expect(url.searchParams.get("quality")).toBe("60");
    expect(url.searchParams.get("preferwebp")).toBe("true");
  });

  it("defaults quality to 75", () => {
    expect(new URL(lab.aemImageLoader({ src: SRC, width: 100 })).searchParams.get("quality")).toBe("75");
  });

  it("keeps a quality that _assetTransform already put into the URL", () => {
    expect(new URL(lab.aemImageLoader({ src: `${SRC}&quality=60`, width: 100 })).searchParams.get("quality")).toBe("60");
    expect(new URL(lab.aemImageLoader({ src: `${SRC}&quality=60`, width: 100, quality: 90 })).searchParams.get("quality")).toBe("90");
  });
});

describe("Lab 13 · buildSrcSet()", () => {
  it("lists one candidate per width", () => {
    const candidates = lab.buildSrcSet(SRC, [400, 800]).split(", ");
    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatch(/width=400.* 400w$/);
    expect(candidates[1]).toMatch(/width=800.* 800w$/);
  });
});

describe("Lab 13 · _assetTransform against the mock AEM", () => {
  it("returns six images with dimensions and both tier URLs", async () => {
    const images = await lab.getHeroImages();
    expect(images).toHaveLength(6);
    const image = images[0].primaryImage!;
    expect(image).toMatchObject({ mimeType: "image/jpeg", width: 2000, height: 1333 });
    expect(image._publishUrl).toBe(`${mock.aem.origins.publish}${image._path}`);
    expect(image._authorUrl).toBe(`${mock.aem.origins.author}${image._path}`);
  });

  it("applies the transform to every _dynamicUrl", async () => {
    const images = await lab.getHeroImages({ format: "WEBP", quality: 60, width: 800 });
    for (const { primaryImage } of images) {
      const url = new URL(primaryImage!._dynamicUrl, "http://x");
      expect(url.pathname).toMatch(/\.webp$/);
      expect(url.searchParams.get("width")).toBe("800");
      expect(url.searchParams.get("quality")).toBe("60");
    }
  });

  it("the delivery URL actually serves an image", async () => {
    const [first] = await lab.getHeroImages({ width: 300 });
    const response = await fetch(lab.aemImageLoader({ src: first.primaryImage!._dynamicUrl, width: 300 }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/");
  });
});
