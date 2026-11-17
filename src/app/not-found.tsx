import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Nothing here</h1>
      <p className="mt-3 text-muted">
        On AEM Publish this is also what an <em>unpublished</em> fragment looks like: <code>item: null</code>.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2">
        Back to the labs
      </Link>
    </div>
  );
}
