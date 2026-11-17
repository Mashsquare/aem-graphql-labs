import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Next.js 16 only allows listed quality values (others are coerced to the closest one).
    // Lab 13 lets you pick these for AEM's web-optimized image delivery.
    qualities: [40, 60, 75, 90],
  },
  turbopack: {
    // Keep Turbopack from picking up lockfiles in parent folders (e.g. the home directory).
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
