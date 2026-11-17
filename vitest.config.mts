import path from "node:path";
import { defineConfig } from "vitest/config";

const root = import.meta.dirname;

/**
 * Three projects:
 *   npm test                 -> runs every lab's checks against YOUR code   (LAB_TARGET=exercise)
 *   npm test -- 08           -> only lab 08 (vitest filters test files by name)
 *   npm run test:solutions   -> the same checks against the reference solutions
 *   npm run test:mock        -> tests for the mock AEM backend itself
 */
export default defineConfig({
  resolve: {
    alias: {
      "@/": `${path.join(root, "src")}/`,
      "@mock-aem/": `${path.join(root, "mock-aem")}/`,
      // `server-only` throws outside the React Server Components runtime; tests run in plain Node.
      "server-only": path.join(root, "src/test/empty-module.ts"),
    },
  },
  test: {
    testTimeout: 30_000,
    hookTimeout: 30_000,
    projects: [
      {
        extends: true,
        test: { name: "labs", include: ["src/labs/**/*.test.{ts,tsx}"], env: { LAB_TARGET: "exercise" } },
      },
      {
        extends: true,
        test: { name: "solutions", include: ["src/labs/**/*.test.{ts,tsx}"], env: { LAB_TARGET: "solution" } },
      },
      {
        extends: true,
        test: { name: "mock", include: ["mock-aem/**/*.test.ts"] },
      },
    ],
  },
});
