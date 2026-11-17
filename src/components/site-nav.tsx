import { labs, parts, type LabPart } from "@/lib/labs";
import { NavLink } from "./nav-link";

const order: LabPart[] = ["foundations", "clients", "aem", "classic", "sling"];

function LabList() {
  return (
    <nav aria-label="Labs" className="space-y-6">
      <div className="space-y-0.5">
        <NavLink href="/" exact>
          Overview
        </NavLink>
        <NavLink href="/aem">AEM GraphQL cheat sheet</NavLink>
        <NavLink href="/classic">Classic AEM cheat sheet</NavLink>
        <NavLink href="/tools">Client tooling guide</NavLink>
        <NavLink href="/mock-aem">The mock AEM backend</NavLink>
      </div>
      {order.map((part) => (
        <div key={part}>
          <p className="mb-1.5 px-2 text-[11px] font-semibold tracking-wider text-muted uppercase">{parts[part].title}</p>
          <div className="space-y-0.5">
            {labs
              .filter((lab) => lab.part === part)
              .map((lab) => (
                <NavLink key={lab.slug} href={`/labs/${lab.slug}`}>
                  <span className="mr-1.5 inline-block w-5 font-mono text-xs text-muted tabular-nums">
                    {String(lab.number).padStart(2, "0")}
                  </span>
                  {lab.title}
                </NavLink>
              ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function SiteNav() {
  return (
    <>
      <details className="border-b border-line px-4 py-3 lg:hidden">
        <summary className="cursor-pointer text-sm font-medium">Labs &amp; guides</summary>
        <div className="pt-3">
          <LabList />
        </div>
      </details>
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r border-line px-3 py-6 lg:block">
        <LabList />
      </aside>
    </>
  );
}
