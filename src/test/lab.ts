import { afterAll, beforeAll } from "vitest";
import { createMockAem, type MockAem } from "@mock-aem/src/http/server";

/** "exercise" when you run `npm test`, "solution" for `npm run test:solutions`. */
export const LAB_TARGET = process.env.LAB_TARGET === "solution" ? "solution" : "exercise";

/**
 * Picks your implementation or the reference solution, so both run against the same checks.
 * Typed as the exercise module (string constants differ between the two, signatures don't).
 */
export function pick<T>(exercise: T, solution: unknown): T {
  return (LAB_TARGET === "solution" ? solution : exercise) as T;
}

/**
 * Starts a private mock AEM (author + publish on random ports, in-memory state) for a test file
 * and points the AEM_* environment variables at it. Your `npm run dev` instance is not touched.
 */
export function withMockAem(): { readonly aem: MockAem } {
  let aem: MockAem | undefined;
  beforeAll(async () => {
    aem = createMockAem({
      authorPort: 0,
      publishPort: 0,
      stateFile: null,
      webhookUrls: [],
      latencyMs: 0,
      logRequests: false,
    });
    const origins = await aem.start();
    process.env.AEM_PUBLISH_HOST = origins.publish;
    process.env.AEM_AUTHOR_HOST = origins.author;
    process.env.NEXT_PUBLIC_AEM_PUBLISH_HOST = origins.publish;
  });
  afterAll(async () => {
    await aem?.stop();
  });
  return {
    get aem() {
      if (!aem) throw new Error("Mock AEM is not started yet (use it inside a test or hook)");
      return aem;
    },
  };
}
