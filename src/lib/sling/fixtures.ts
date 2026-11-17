import { createRepository } from "./repository";
import type { JcrJson } from "./types";

/**
 * A miniature AEM repository — what CRXDE Lite would show you under /apps, /libs and /content.
 * Values are deliberately "as authors leave them": numbers stored as strings, checkboxes stored as
 * "true"/"yes", multi-values, missing fields. (Dialogs usually write real booleans and numbers; imports,
 * migrations and hand-edited nodes do not.)
 */
export const repositoryJson: JcrJson = {
  libs: {
    core: {
      wcm: {
        components: {
          page: { v3: { page: { "jcr:title": "Page (Core)" } } },
          container: { v1: { container: { "jcr:title": "Container (Core)" } } },
          teaser: { v2: { teaser: { "jcr:title": "Teaser (Core)" } } },
          title: { v3: { title: { "jcr:title": "Title (Core)" } } },
          text: { v2: { text: { "jcr:title": "Text (Core)" } } },
          image: { v3: { image: { "jcr:title": "Image (Core)" } } },
        },
      },
    },
  },
  apps: {
    wknd: {
      components: {
        page: { "sling:resourceSuperType": "core/wcm/components/page/v3/page" },
        container: { "sling:resourceSuperType": "core/wcm/components/container/v1/container" },
        teaser: { "sling:resourceSuperType": "core/wcm/components/teaser/v2/teaser" },
        "featured-teaser": { "sling:resourceSuperType": "wknd/components/teaser" },
        title: { "sling:resourceSuperType": "core/wcm/components/title/v3/title" },
        text: { "sling:resourceSuperType": "core/wcm/components/text/v2/text" },
        image: { "sling:resourceSuperType": "core/wcm/components/image/v3/image" },
        pricetag: {},
        breadcrumb: {},
        navigation: {},
        // A broken project: two components that name each other as super type. Resolvers must not loop forever.
        "loop-a": { "sling:resourceSuperType": "wknd/components/loop-b" },
        "loop-b": { "sling:resourceSuperType": "wknd/components/loop-a" },
      },
    },
  },
  content: {
    wknd: {
      us: {
        en: {
          "jcr:primaryType": "cq:Page",
          "jcr:content": {
            "jcr:primaryType": "cq:PageContent",
            "sling:resourceType": "wknd/components/page",
            "jcr:title": "WKND — Live your adventure",
            footerText: "© WKND Adventures",
            showSearch: "true",
            root: {
              "sling:resourceType": "wknd/components/container",
              container: {
                "sling:resourceType": "wknd/components/container",
                hero: {
                  "sling:resourceType": "wknd/components/teaser",
                  "jcr:title": "Live your adventure",
                  "jcr:description": "<p>Surf, ski, climb and cycle. <b>New trips every month.</b></p>",
                  titleType: "h1",
                  linkURL: "/content/wknd/us/en/adventures.html",
                  actionsEnabled: "true",
                  image: {
                    "sling:resourceType": "wknd/components/image",
                    fileReference: "/content/dam/wknd/en/adventures/bali-surf-camp/bali-surf-camp-hero.jpg",
                    alt: "Surfer on a wave in Bali",
                    widths: ["320", "800", "1200"],
                  },
                  actions: {
                    item0: { text: "Browse adventures", link: "/content/wknd/us/en/adventures.html" },
                    item1: { text: "Surf forecast", link: "https://www.surf-forecast.com" },
                  },
                },
                "no-title-teaser": {
                  "sling:resourceType": "wknd/components/teaser",
                  "jcr:description": "<p>An author forgot the title.</p>",
                },
                "featured-hero": {
                  "sling:resourceType": "wknd/components/featured-teaser",
                  "jcr:title": "Featured: Bali Surf Camp",
                  "jcr:description": "<p>Our most booked trip.</p>",
                  linkURL: "/content/wknd/us/en/adventures/bali-surf-camp.html",
                },
                intro: {
                  "sling:resourceType": "wknd/components/text",
                  text: "<p>Welcome to <b>WKND</b>.</p>",
                  textIsRich: true,
                },
                heading: {
                  "sling:resourceType": "wknd/components/title",
                  "jcr:title": "Featured adventures",
                  type: "h2",
                },
                // A node whose component has no model — exporters must skip it, not crash.
                spacer: { "sling:resourceType": "wknd/components/spacer" },
                "price-early": {
                  "sling:resourceType": "wknd/components/pricetag",
                  amount: "1450",
                  currency: "EUR",
                  sale: true,
                  label: "Early bird",
                },
                "price-string-sale": { "sling:resourceType": "wknd/components/pricetag", amount: 99.5, sale: "true" },
                "price-broken": { "sling:resourceType": "wknd/components/pricetag", amount: "abc", sale: "yes" },
                "price-empty": { "sling:resourceType": "wknd/components/pricetag" },
                navigation: { "sling:resourceType": "wknd/components/navigation", navigationRoot: "/content/wknd/us/en", structureDepth: "2" },
                breadcrumb: { "sling:resourceType": "wknd/components/breadcrumb" },
                loop: { "sling:resourceType": "wknd/components/loop-a" },
              },
            },
          },
          adventures: {
            "jcr:primaryType": "cq:Page",
            "jcr:content": { "jcr:primaryType": "cq:PageContent", "sling:resourceType": "wknd/components/page", "jcr:title": "Adventures" },
            "bali-surf-camp": {
              "jcr:primaryType": "cq:Page",
              "jcr:content": {
                "jcr:primaryType": "cq:PageContent",
                "sling:resourceType": "wknd/components/page",
                "jcr:title": "Bali Surf Camp",
                navTitle: "Bali",
                "cq:tags": ["wknd:activity/surfing", "wknd:activity/camping"],
                "cq:lastModified": "2026-09-02T09:30:00.000Z",
              },
            },
            "tahoe-ski-trip": {
              "jcr:primaryType": "cq:Page",
              "jcr:content": {
                "jcr:primaryType": "cq:PageContent",
                "sling:resourceType": "wknd/components/page",
                "jcr:title": "Tahoe Ski Trip",
                hideInNav: true,
              },
            },
          },
          about: {
            "jcr:primaryType": "cq:Page",
            "jcr:content": {
              "jcr:primaryType": "cq:PageContent",
              "sling:resourceType": "wknd/components/page",
              "jcr:title": "About us",
              footerText: "© WKND — About",
            },
          },
          "secret-draft": {
            "jcr:primaryType": "cq:Page",
            "jcr:content": { "jcr:primaryType": "cq:PageContent", "sling:resourceType": "wknd/components/page", "jcr:title": "Secret draft", hideInNav: "true" },
          },
        },
      },
    },
  },
};

export const SITE_ROOT = "/content/wknd/us/en";
export const HERO = `${SITE_ROOT}/jcr:content/root/container/hero`;
export const CONTAINER = `${SITE_ROOT}/jcr:content/root/container`;

/** A fresh resolver over the fixture repository. */
export const createFixtureResolver = () => createRepository(repositoryJson);

/** The OSGi services Lab 21–23 models can inject with `@OSGiService`. */
export const fixtureServices = {
  /** `Externalizer`-like: repository path -> public URL of the Next.js site. */
  externalizer: {
    publishLink(path: string): string {
      const route = path.replace(/^\/content\/wknd\/us\/en/, "").replace(/\.html$/, "");
      return route === "" ? "/" : route;
    },
  },
  /** `TagManager`-like: tag id -> display title. */
  tagManager: {
    title(tagId: string): string {
      const leaf = tagId.slice(tagId.lastIndexOf("/") + 1);
      return leaf.charAt(0).toUpperCase() + leaf.slice(1);
    },
  },
};
