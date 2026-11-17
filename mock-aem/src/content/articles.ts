import type { FragmentData, RichText } from "../types";
import { DAM_ROOT, b, fragmentLink, h, i, image, inlineImage, link, ol, p, rt, ul } from "./helpers";
import { fragment } from "./fragment";
import { adventurePath } from "./adventures";
import { authorPath } from "./authors";

interface ArticleSeed {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  related: string[];
  publishDate: string;
  readingTimeMinutes: number;
  tags: string[];
  scene: "mountains" | "waves" | "city" | "forest" | "desert" | "snow";
  main: (assets: { inline: string }) => RichText;
  published?: boolean;
  variations?: Record<string, Partial<FragmentData>>;
}

export const articlePath = (slug: string, locale = "en") => `${DAM_ROOT}/${locale}/magazine/${slug}/${slug}`;

function article(seed: ArticleSeed, locale = "en") {
  const folder = `${DAM_ROOT}/en/magazine/${seed.slug}`;
  const featuredImage = image(`${folder}/${seed.slug}-featured.jpg`, {
    title: seed.title,
    width: 2400,
    height: 1350,
    scene: seed.scene,
  });
  const inline = image(`${folder}/${seed.slug}-inline.jpg`, {
    title: `${seed.title} (inline)`,
    width: 1200,
    height: 800,
    scene: seed.scene,
  });
  return fragment({
    path: articlePath(seed.slug, locale),
    model: "article",
    title: seed.title,
    tags: seed.tags,
    published: seed.published,
    lastModified: seed.publishDate,
    master: {
      title: seed.title,
      slug: seed.slug,
      excerpt: seed.excerpt,
      featuredImage,
      main: seed.main({ inline }),
      authorFragment: authorPath(seed.author),
      relatedAdventures: seed.related.map((slug) => adventurePath(slug)),
      publishDate: seed.publishDate,
      readingTimeMinutes: seed.readingTimeMinutes,
      tags: seed.tags,
    },
    variations: seed.variations,
  });
}

const seeds: ArticleSeed[] = [
  {
    slug: "the-surfers-guide-to-bali",
    title: "The Surfer's Guide to Bali",
    excerpt: "Where to paddle out, when to go and what nobody tells you about reef cuts.",
    author: "stacey-roswells",
    related: ["bali-surf-camp", "surf-camp-costa-rica"],
    publishDate: "2026-03-14T08:00:00.000Z",
    readingTimeMinutes: 7,
    tags: ["wknd-shared:activity/surfing", "wknd-shared:region/asia"],
    scene: "waves",
    main: ({ inline }) =>
      rt(
        p("Bali has a wave for everyone, but ", b("not every wave is for everyone"), ". Here is how to pick."),
        h(2, "When to go"),
        p("The dry season (April–October) brings offshore winds to the west coast. The wet season flips that to the east."),
        inlineImage(inline),
        h(2, "Spots by level"),
        ul(
          [b("Beginner:"), " Kuta Beach and Batu Bolong"],
          [b("Intermediate:"), " Balangan and Dreamland"],
          [b("Advanced:"), " Uluwatu and Padang Padang"],
        ),
        p(
          "Want a coach? Join our ",
          fragmentLink(adventurePath("bali-surf-camp"), "Bali Surf Camp"),
          " — beginners welcome. Tide tables: ",
          link("https://www.surf-forecast.com", "surf-forecast.com", "_blank"),
          ".",
        ),
      ),
    variations: {
      teaser: {
        title: "Bali in 60 seconds",
        main: rt(p("Dry season, west coast, ", b("start at Kuta"), ". That's it — go surf.")),
      },
    },
  },
  {
    slug: "ski-touring-for-beginners",
    title: "Ski Touring for Beginners",
    excerpt: "Skins, transitions and why the uphill is the best part.",
    author: "jacob-wester",
    related: ["ski-touring-mont-blanc", "downhill-skiing-wyoming", "tahoe-skiing"],
    publishDate: "2026-01-20T08:00:00.000Z",
    readingTimeMinutes: 9,
    tags: ["wknd-shared:activity/skiing", "wknd-shared:season/winter"],
    scene: "snow",
    main: ({ inline }) =>
      rt(
        p("Ski touring is skiing ", i("without the lift queue"), ". You walk up, you ski down, you earn every turn."),
        h(2, "The kit"),
        ol("Touring bindings that free your heel", "Climbing skins", "Avalanche transceiver, shovel and probe"),
        inlineImage(inline),
        h(2, "Your first tour"),
        p(
          "Start on a groomed piste with a resort that allows uphill traffic. When you are ready for huts and glaciers, look at ",
          fragmentLink(adventurePath("ski-touring-mont-blanc"), "Ski Touring Mont Blanc"),
          ".",
        ),
      ),
    variations: {
      teaser: {
        title: "Ski touring, explained in one breath",
        main: rt(p("Walk up with skins, ski down, repeat. ", b("Always carry avalanche gear."))),
      },
    },
  },
  {
    slug: "cycling-tuscany-slow-travel",
    title: "Cycling Tuscany the Slow Way",
    excerpt: "Why 60 km a day and a three-hour lunch is the right pace.",
    author: "ian-provo",
    related: ["cycling-tuscany"],
    publishDate: "2026-05-30T08:00:00.000Z",
    readingTimeMinutes: 6,
    tags: ["wknd-shared:activity/cycling", "wknd-shared:region/europe"],
    scene: "forest",
    main: ({ inline }) =>
      rt(
        p("Tuscany punishes hurry. The climbs are short and steep, the descents are white gravel and the lunches are long."),
        inlineImage(inline),
        h(2, "Three rules"),
        ol("Ride in the morning", "Eat what the farmer eats", "Never skip the gelato stop"),
        p("Ride it with us: ", fragmentLink(adventurePath("cycling-tuscany"), "Cycling Tuscany"), "."),
      ),
  },
  {
    slug: "ten-tips-for-your-first-climb",
    title: "Ten Tips for Your First Outdoor Climb",
    excerpt: "From gym plastic to real rock without the drama.",
    author: "jacob-wester",
    related: ["colorado-rock-climbing", "climbing-new-zealand"],
    publishDate: "2026-04-11T08:00:00.000Z",
    readingTimeMinutes: 8,
    tags: ["wknd-shared:activity/rock-climbing"],
    scene: "mountains",
    main: ({ inline }) =>
      rt(
        p("Outdoor rock is not a bigger climbing gym. Grades feel harder, holds are hidden and ", b("there is no padded floor"), "."),
        ol(
          "Go with a guide or an experienced friend",
          "Double-check knots and buckles — every time",
          "Wear a helmet",
          "Learn to clean an anchor before your first trip",
          "Start two grades below your gym level",
        ),
        inlineImage(inline),
        p("Our ", fragmentLink(adventurePath("colorado-rock-climbing"), "Colorado weekend"), " is designed exactly for this step."),
      ),
  },
  {
    slug: "eating-your-way-through-le-marais",
    title: "Eating Your Way Through Le Marais",
    excerpt: "A falafel, a fromagerie and a chocolatier walk into a neighbourhood…",
    author: "kumar-selvaraj",
    related: ["gastronomic-marais-tour"],
    publishDate: "2026-06-21T08:00:00.000Z",
    readingTimeMinutes: 5,
    tags: ["wknd-shared:activity/social", "wknd-shared:region/europe"],
    scene: "city",
    main: ({ inline }) =>
      rt(
        p("Le Marais is the best square kilometre in Paris to be hungry in."),
        h(2, "Don't miss"),
        ul("Falafel on Rue des Rosiers", "The Saturday market at Enfants Rouges", "Hot chocolate thick enough to stand a spoon in"),
        inlineImage(inline),
        p("Book the ", fragmentLink(adventurePath("gastronomic-marais-tour"), "Gastronomic Marais Tour"), " and let us do the queuing."),
      ),
  },
  {
    slug: "camping-under-southern-skies",
    title: "Camping Under Southern Skies",
    excerpt: "Notes from three nights on the Murray River.",
    author: "sofia-sjoberg",
    related: ["riverside-camping-australia"],
    publishDate: "2026-07-08T08:00:00.000Z",
    readingTimeMinutes: 6,
    tags: ["wknd-shared:activity/camping", "wknd-shared:region/oceania"],
    scene: "forest",
    main: ({ inline }) =>
      rt(
        p("The Milky Way over the Murray is so bright it casts shadows. I did not expect to cry about a sky."),
        inlineImage(inline),
        p("Photographers: bring a tripod and ", i("turn your headlamp to red"), "."),
      ),
  },
  {
    slug: "packing-light-the-wknd-way",
    title: "Packing Light the WKND Way",
    excerpt: "Everything you need for five days fits in 40 litres. Really.",
    author: "sofia-sjoberg",
    related: ["yosemite-backpacking", "west-coast-cycling"],
    publishDate: "2026-08-19T08:00:00.000Z",
    readingTimeMinutes: 4,
    tags: ["wknd-shared:topic/gear"],
    scene: "mountains",
    main: ({ inline }) =>
      rt(
        h(2, "The 3-layer rule"),
        p("A base layer, an insulating layer and a shell. ", b("Cotton stays at home.")),
        inlineImage(inline),
        ul("One pair of shoes you trust", "A tiny first-aid kit", "A headlamp, always"),
      ),
  },
  {
    slug: "chasing-auroras-in-iceland",
    title: "Chasing Auroras in Iceland",
    excerpt: "DRAFT — waiting for photos from the January scouting trip.",
    author: "sofia-sjoberg",
    related: ["iceland-northern-lights-trek"],
    publishDate: "2026-10-30T08:00:00.000Z",
    readingTimeMinutes: 5,
    tags: ["wknd-shared:region/europe", "wknd-shared:season/winter"],
    scene: "snow",
    published: false,
    main: () => rt(p(b("TODO:"), " write the intro once the scouting photos are in.")),
  },
];

const germanCopies: Record<string, Partial<ArticleSeed>> = {
  "the-surfers-guide-to-bali": {
    title: "Der Surf-Guide für Bali",
    excerpt: "Wo du paddeln solltest, wann du fahren solltest und was dir niemand über Riffschnitte erzählt.",
    main: () => rt(p("Bali hat für jeden eine Welle — aber ", b("nicht jede Welle ist für jeden"), ".")),
    variations: {},
  },
  "ski-touring-for-beginners": {
    title: "Skitouren für Einsteiger",
    excerpt: "Felle, Spitzkehren und warum der Aufstieg das Beste ist.",
    main: () => rt(p("Skitouren sind Skifahren ", i("ohne Liftschlange"), ".")),
    variations: {},
  },
};

export const articles = [
  ...seeds.map((seed) => article(seed)),
  ...Object.entries(germanCopies).map(([slug, overrides]) => {
    const seed = seeds.find((candidate) => candidate.slug === slug)!;
    return article({ ...seed, ...overrides }, "de");
  }),
];
