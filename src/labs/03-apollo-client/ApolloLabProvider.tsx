"use client";

import type { ReactNode } from "react";
import { ScopedApolloNextAppProvider } from "@/lib/apollo/scoped-provider";
import { makeClient } from "./apollo";

/**
 * Provided. In a real Next.js app this is simply
 *
 *   <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>
 *
 * rendered ONCE around {children} in app/layout.tsx. The training app hosts several independent
 * Apollo "apps", so it uses a scoped variant — see src/lib/apollo/scoped-provider.tsx.
 */
export function ApolloLabProvider({ children }: { children: ReactNode }) {
  return (
    <ScopedApolloNextAppProvider scope="lab-03" makeClient={makeClient}>
      {children}
    </ScopedApolloNextAppProvider>
  );
}
