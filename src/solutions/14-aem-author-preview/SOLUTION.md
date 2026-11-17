## Walkthrough

### One switch, two tiers

```ts
export function getAemTarget(preview: boolean): AemTarget {
  if (!preview) return { tier: "publish", host: publishHost, headers: {} };
  const token = process.env.AEM_AUTHOR_TOKEN;
  return { tier: "author", host: authorHost, headers: { Authorization: token ? `Bearer ${token}` : `Basic ${basic}` } };
}
```

Data functions take `preview` as an **argument** instead of reading `draftMode()` themselves. That keeps them testable (no request context needed) and lets cached functions include it in their cache key.

### The draft route

```ts
if (secret !== process.env.PREVIEW_SECRET) return new Response("Invalid preview secret", { status: 401 });
if (!slug) return new Response("Missing slug", { status: 400 });
const adventure = await getAdventureBySlug(slug, true);   // drafts only exist on Author
if (!adventure) return new Response(…, { status: 404 });
(await draftMode()).enable();
redirect(`${WORKSPACE}?slug=${encodeURIComponent(adventure.slug)}`);
```

- The shared secret is configured in AEM (the preview URL template) and in the app's env — never in client code.
- Validating the slug against Author and redirecting to *AEM's* slug prevents open redirects (`?slug=https://evil.example`).
- Exiting uses a Server Action (`POST`) — Next.js prefetches `<Link>`s, and a prefetched GET exit link would disable preview by accident.

### Why the browser can't preview

The probe shows the 401. Even with CORS allowed on Author, the browser would need credentials in the bundle. Server-side fetching keeps credentials on the server and also hides the Author host from visitors.

## Real-world notes

- **AEM as a Cloud Service auth.** Local development: a *Local Development Access Token* from the Developer Console (Bearer, ~24 h). Servers/CI: *Service Credentials* (a JSON file) exchanged for an IMS access token — `@adobe/aem-headless-client-nodejs` can do that exchange for you.
- **Preview tier.** AEMaaCS also has a *Preview* service (`preview-p…-e….adobeaemcloud.com`) that serves content published to preview — often used instead of Author for stakeholder previews.
- **Draft Mode is per browser** and global to the site: every cached page is bypassed while it's on. Keep the banner visible so editors know where they are.
