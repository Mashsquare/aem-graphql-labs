import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";

export default function LabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-6 border-b border-line bg-bg/85 px-4 backdrop-blur lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent font-mono text-xs text-white">
            {"{ }"}
          </span>
          AEM GraphQL Labs
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm text-muted">
          <a className="hidden hover:text-fg sm:inline" href="http://localhost:4503/aem/graphiql.html" target="_blank" rel="noreferrer">
            GraphiQL ↗
          </a>
          <a className="hidden hover:text-fg sm:inline" href="http://localhost:4502/mock/console" target="_blank" rel="noreferrer">
            Author console ↗
          </a>
        </nav>
      </header>
      <div className="flex flex-col lg:flex-row">
        <SiteNav />
        <main className="min-w-0 flex-1 px-4 py-8 lg:px-10">{children}</main>
      </div>
    </>
  );
}
