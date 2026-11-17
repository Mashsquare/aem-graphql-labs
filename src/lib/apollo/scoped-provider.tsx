"use client";

import { ApolloNextAppProvider, type ApolloClient } from "@apollo/client-integration-nextjs";
import type { ReactNode } from "react";

/**
 * Training-app helper — NOT something you need in a real project.
 *
 * ApolloNextAppProvider keeps ONE client per browser tab (window[Symbol.for("ApolloClientSingleton")]).
 * That is exactly right for a real app, where you render the provider once in app/layout.tsx.
 * This repo hosts several independent "apps" (Rick and Morty, AEM, solutions, ...), so before the
 * provider looks up its singleton we drop a client that belongs to a different lab.
 */
const SINGLETON = Symbol.for("ApolloClientSingleton");
type Tagged = ApolloClient & { __labScope?: string };

function dropClientOfOtherScope(scope: string) {
  if (typeof window === "undefined") return;
  const store = window as unknown as Record<symbol, Tagged | undefined>;
  if (store[SINGLETON] && store[SINGLETON].__labScope !== scope) delete store[SINGLETON];
}

export function ScopedApolloNextAppProvider({
  scope,
  makeClient,
  children,
}: {
  scope: string;
  makeClient: () => ApolloClient;
  children: ReactNode;
}) {
  // Must run before ApolloNextAppProvider reads the singleton during this render.
  dropClientOfOtherScope(scope);
  return (
    <ApolloNextAppProvider
      makeClient={() => {
        const client = makeClient() as Tagged;
        client.__labScope = scope;
        return client;
      }}
    >
      {children}
    </ApolloNextAppProvider>
  );
}
