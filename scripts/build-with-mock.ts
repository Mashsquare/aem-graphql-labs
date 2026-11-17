/**
 * `npm run build` — runs `next build` with the mock AEM reachable.
 *
 * Pages that prerender AEM content (generateStaticParams, "use cache") fetch from AEM *during the
 * build*, exactly like a real project's CI build needs a reachable AEM Publish. If the mock is
 * already running (npm run dev in another terminal) it is reused; otherwise it is started here.
 */
import { spawn } from "node:child_process";
import { createMockAem } from "../mock-aem/src/http/server";

async function isUp(url: string) {
  try {
    return (await fetch(`${url}/mock/health`)).ok;
  } catch {
    return false;
  }
}

async function main() {
  let stop: (() => Promise<void>) | undefined;
  if (await isUp(process.env.AEM_PUBLISH_HOST ?? "http://localhost:4503")) {
    console.log("[build] Using the mock AEM that is already running.");
  } else {
    const aem = createMockAem({ logRequests: false, webhookUrls: [] });
    await aem.start();
    stop = () => aem.stop();
    console.log("[build] Started mock AEM for the build (author :4502, publish :4503).");
  }

  const code = await new Promise<number>((resolve) => {
    const child = spawn("npx", ["next", "build", ...process.argv.slice(2)], { stdio: "inherit", shell: true });
    child.on("exit", (exitCode) => resolve(exitCode ?? 1));
  });
  await stop?.();
  process.exit(code);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
