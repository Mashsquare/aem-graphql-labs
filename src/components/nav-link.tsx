"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children, exact = false }: { href: string; children: ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
        active ? "bg-accent-soft font-medium text-accent" : "text-fg/80 hover:bg-surface-2 hover:text-fg"
      }`}
    >
      {children}
    </Link>
  );
}
