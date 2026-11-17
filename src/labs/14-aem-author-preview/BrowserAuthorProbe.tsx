"use client";

/** Provided — tries what you must NOT do: call AEM Author straight from the browser. */
import { useState } from "react";
import { buttonClass } from "@/components/lab-ui";

export function BrowserAuthorProbe({ authorUrl }: { authorUrl: string }) {
  const [result, setResult] = useState<string | null>(null);

  const probe = async () => {
    setResult("…");
    try {
      const response = await fetch(authorUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "{ adventureList { items { title } } }" }),
      });
      setResult(`HTTP ${response.status} — ${(await response.text()).slice(0, 160)}`);
    } catch (error) {
      setResult(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="space-y-2 text-sm">
      <button onClick={probe} className={buttonClass}>
        Call Author from the browser (no credentials)
      </button>
      {result ? <pre className="rounded-md bg-surface-2 p-3 font-mono text-xs whitespace-pre-wrap">{result}</pre> : null}
      <p className="text-muted">
        You get 401. The only way to make it work would be to ship Author credentials in the JavaScript bundle — which is why preview fetching happens on the server.
      </p>
    </div>
  );
}
