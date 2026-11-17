"use client";

/**
 * An Apollo client for AEM Publish, called directly from the browser (Labs 08 + 09).
 * Render <AemApolloProvider> from a Client Component: typePolicies may contain functions,
 * which cannot be passed from Server Components.
 */
import { HttpLink, type TypePolicies } from "@apollo/client";
import { ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import type { ReactNode } from "react";
import { publicAemConfig } from "@/lib/aem/config";
import { ScopedApolloNextAppProvider } from "@/lib/apollo/scoped-provider";

export function makeAemClient(typePolicies: TypePolicies) {
  const { publishHost, endpoint } = publicAemConfig();
  return new ApolloClient({
    cache: new InMemoryCache({ typePolicies }),
    // Browser -> AEM Publish is cross-origin: it only works because Publish allows
    // Origin http://localhost:3000 (AEM: CORS OSGi config; mock: MOCK_AEM_CORS_ALLOWED_ORIGINS).
    link: new HttpLink({ uri: `${publishHost}${endpoint}` }),
  });
}

export function AemApolloProvider({ scope, typePolicies, children }: { scope: string; typePolicies: TypePolicies; children: ReactNode }) {
  return (
    <ScopedApolloNextAppProvider scope={scope} makeClient={() => makeAemClient(typePolicies)}>
      {children}
    </ScopedApolloNextAppProvider>
  );
}
