"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LabTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const base = `/labs/${slug}`;
  const tabs = [
    { href: base, label: "Brief" },
    // No prefetch: it would render your unfinished starter in the background and its TODO errors
    // would pop up in the dev overlay on whatever tab you're on.
    { href: `${base}/workspace`, label: "Your workspace", prefetch: false },
    { href: `${base}/solution`, label: "Solution walkthrough" },
    { href: `${base}/solution/live`, label: "Solution (live)" },
  ];
  return (
    <div role="tablist" className="mb-8 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const isSolution = tab.href.includes("/solution");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={tab.prefetch}
            role="tab"
            aria-selected={active}
            className={`-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              active ? "border-accent font-medium text-fg" : "border-transparent text-muted hover:text-fg"
            } ${isSolution && !active ? "opacity-80" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
