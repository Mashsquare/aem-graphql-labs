export function PageSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-6 w-1/3 animate-pulse rounded bg-surface-2" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
    </div>
  );
}
