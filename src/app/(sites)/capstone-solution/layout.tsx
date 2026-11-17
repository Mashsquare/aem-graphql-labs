import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WkndShell } from "@/labs/15-aem-capstone/ui";

// The WKND site is "its own" website: don't append the labs' " · AEM GraphQL Labs" suffix.
export const metadata: Metadata = { title: { template: "%s", default: "WKND Adventures" } };

export default function CapstoneSolutionLayout({ children }: { children: ReactNode }) {
  return (
    <WkndShell basePath="/capstone-solution/adventures" label="Reference solution">
      {children}
    </WkndShell>
  );
}
