"use client";

import type { ReactNode } from "react";
import { ScopedApolloNextAppProvider } from "@/lib/apollo/scoped-provider";
import { makeClient } from "./apollo";

export function ApolloLabProvider({ children }: { children: ReactNode }) {
  return (
    <ScopedApolloNextAppProvider scope="solution-03" makeClient={makeClient}>
      {children}
    </ScopedApolloNextAppProvider>
  );
}
