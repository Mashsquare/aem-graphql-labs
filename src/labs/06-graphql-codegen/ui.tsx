/** Provided UI for Lab 06 — difficulty filter + grid. */
import Link from "next/link";
import type { ReactNode } from "react";
import { CardGrid, EmptyState, Panel, buttonClass } from "@/components/lab-ui";

export const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"];

export function TeaserLayout({ difficulty, count, children }: { difficulty?: string; count: number; children: ReactNode }) {
  return (
    <Panel title="Adventure teasers" description={`${count} adventures · typed end to end by GraphQL Code Generator`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="?" className={`${buttonClass} ${!difficulty ? "border-accent text-accent" : ""}`}>
          all
        </Link>
        {difficulties.map((value) => (
          <Link key={value} href={`?difficulty=${value}`} className={`${buttonClass} ${difficulty === value ? "border-accent text-accent" : ""}`}>
            {value}
          </Link>
        ))}
      </div>
      {count ? <CardGrid>{children}</CardGrid> : <EmptyState>No adventures.</EmptyState>}
    </Panel>
  );
}
