/**
 * Small presentational building blocks for lab workspaces, so the exercises can focus on
 * GraphQL instead of CSS. No hooks — usable from Server and Client Components alike.
 */
import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

const tones = {
  neutral: "bg-surface-2 text-fg/80",
  accent: "bg-accent-soft text-accent",
  ok: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger: "bg-red-500/10 text-red-700 dark:text-red-300",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

/** Collapsible view of the GraphQL document a section sends — handy while debugging. */
export function QueryPeek({ label = "GraphQL document", query }: { label?: string; query: string }) {
  return (
    <details className="group mt-3 rounded-lg border border-line text-sm">
      <summary className="cursor-pointer px-3 py-2 text-muted select-none group-open:border-b group-open:border-line">{label}</summary>
      <pre className="overflow-x-auto bg-surface-2 p-3 font-mono text-xs leading-relaxed">{query.trim()}</pre>
    </details>
  );
}

export function JsonPeek({ label = "Raw JSON", data }: { label?: string; data: unknown }) {
  return (
    <details className="group mt-3 rounded-lg border border-line text-sm">
      <summary className="cursor-pointer px-3 py-2 text-muted select-none group-open:border-b group-open:border-line">{label}</summary>
      <pre className="max-h-96 overflow-auto bg-surface-2 p-3 font-mono text-xs leading-relaxed">{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function MediaCard({
  title,
  imageUrl,
  imageAlt = "",
  meta = [],
  badge,
  href,
  footer,
}: {
  title: ReactNode;
  imageUrl?: string | null;
  imageAlt?: string;
  meta?: ReactNode[];
  badge?: ReactNode;
  href?: string;
  footer?: ReactNode;
}) {
  const body = (
    <>
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-2">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- plain <img> on purpose; Lab 13 covers next/image
          <img src={imageUrl} alt={imageAlt} className="size-full object-cover transition-transform group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <div className="grid size-full place-items-center text-xs text-muted">no image</div>
        )}
        {badge ? <div className="absolute top-2 left-2">{badge}</div> : null}
      </div>
      <div className="p-3">
        <h3 className="font-medium leading-snug">{title}</h3>
        {meta.length ? (
          <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-muted">
            {meta.map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </p>
        ) : null}
        {footer ? <div className="mt-2">{footer}</div> : null}
      </div>
    </>
  );
  const className = "group block overflow-hidden rounded-lg border border-line bg-surface transition-shadow hover:shadow-md";
  return href ? (
    <a href={href} className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">{children}</p>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "rounded-md border border-line bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export const buttonClass =
  "inline-flex items-center justify-center rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const formatPrice = (price: number | null | undefined) =>
  typeof price === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(price) : "—";
