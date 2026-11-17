"use client";

import { catchError, type ErrorInfo } from "next/error";

function hintFor(message: string): string | null {
  if (/fetch failed|ECONNREFUSED|Failed to fetch|NetworkError/i.test(message)) {
    return "Could not reach the API. For AEM labs make sure the mock is running (npm run dev starts it with Next.js). For public APIs check your internet connection.";
  }
  if (/CORS|cross-origin/i.test(message)) return "Looks like a CORS problem — see the browser console and the mock AEM terminal output.";
  if (/omitted in production|Server Components render/i.test(message)) {
    return "Production builds hide server error messages. Check the terminal running Next.js, or use npm run dev.";
  }
  return null;
}

function LabErrorFallback({ files }: { files: string[] }, { error, retry }: ErrorInfo) {
  const message = error instanceof Error ? error.message : String(error);
  const isTodo = message.startsWith("TODO:");
  const hint = hintFor(message);

  if (isTodo) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
        <p className="text-xs font-semibold tracking-wider text-amber-600 uppercase dark:text-amber-400">Not implemented yet</p>
        <p className="mt-2 font-mono text-sm">{message.replace(/^TODO:\s*/, "")}</p>
        <p className="mt-3 text-sm text-muted">
          Implement it in {files.map((file, index) => (
            <span key={file}>
              {index > 0 ? ", " : ""}
              <code className="rounded bg-surface-2 px-1">{file}</code>
            </span>
          ))}{" "}
          — the page reloads automatically when you save.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-5">
      <p className="text-xs font-semibold tracking-wider text-red-600 uppercase dark:text-red-400">Something threw</p>
      <pre className="mt-2 overflow-x-auto font-mono text-sm whitespace-pre-wrap">{message}</pre>
      {hint ? <p className="mt-3 text-sm text-muted">{hint}</p> : null}
      <button onClick={() => retry()} className="mt-4 rounded-md border border-line bg-surface px-3 py-1.5 text-sm hover:bg-surface-2">
        Try again
      </button>
    </div>
  );
}

export const LabBoundary = catchError(LabErrorFallback);
