import type { Asset, FragmentData, RichText } from "../types";
import { DAM_ROOT, b, h, i, image, link, ol, p, pdf, rt, ul } from "./helpers";
import { fragment } from "./fragment";
import { locationPath } from "./locations";

type Activity = "Camping" | "Cycling" | "Hiking" | "Rock Climbing" | "Skiing" | "Social" | "Surfing";
type AdventureType = "Day Trip" | "Overnight Trip" | "Multi-day Trip";
type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

interface AdventureSeed {
  slug: string;
  title: string;
  activity: Activity;
  adventureType: AdventureType;
  tripLength: string;
  groupSize: number;
  difficulty: Difficulty;
  price: number;
  departureDate: string;
  location: string;
  scene: Asset["scene"];
  tags: string[];
  description: RichText;
  itinerary: RichText;
  gearList: RichText;
  featured?: boolean;
  gallery?: number;
  trailMap?: boolean;
  published?: boolean;
  lastModified?: string;
  variations?: Record<string, Partial<FragmentData>>;
}

export const adventurePath = (slug: string, locale = "en") => `${DAM_ROOT}/${locale}/adventures/${slug}/${slug}`;

function adventure(seed: AdventureSeed, locale = "en") {
  const folder = `${DAM_ROOT}/en/adventures/${seed.slug}`;
  const primaryImage = image(`${folder}/${seed.slug}-hero.jpg`, {
    title: seed.title,
    width: 2000,
    height: 1333,
    scene: seed.scene,
  });
  const gallery = Array.from({ length: seed.gallery ?? 0 }, (_, index) =>
    image(`${folder}/${seed.slug}-gallery-${index + 1}.jpg`, {
      title: `${seed.title} — photo ${index + 1}`,
      width: index % 2 === 0 ? 1600 : 1200,
      height: index % 2 === 0 ? 1067 : 1600,
      scene: seed.scene,
    }),
  );
  return fragment({
    path: adventurePath(seed.slug, locale),
    model: "adventure",
    title: seed.title,
    tags: seed.tags,
    published: seed.published,
    lastModified: seed.lastModified ?? "2026-04-18T10:15:00.000Z",
    lastModifiedBy: seed.published === false ? "jacob.wester@wknd.site" : "admin",
    master: {
      title: seed.title,
      slug: seed.slug,
      description: seed.description,
      adventureType: seed.adventureType,
      tripLength: seed.tripLength,
      activity: seed.activity,
      groupSize: seed.groupSize,
      difficulty: seed.difficulty,
      price: seed.price,
      departureDate: seed.departureDate,
      featured: seed.featured ?? false,
      primaryImage,
      gallery,
      trailMap: seed.trailMap ? pdf(`${folder}/${seed.slug}-trail-map.pdf`, `${seed.title} trail map`) : null,
      location: locationPath(seed.location),
      itinerary: seed.itinerary,
      gearList: seed.gearList,
      tags: seed.tags,
    },
    variations: seed.variations,
  });
}

const tag = {
  activity: (value: string) => `wknd-shared:activity/${value}`,
  region: (value: string) => `wknd-shared:region/${value}`,
  season: (value: string) => `wknd-shared:season/${value}`,
};

const seeds: AdventureSeed[] = [
  {
    slug: "bali-surf-camp",
    title: "Bali Surf Camp",
    activity: "Surfing",
    adventureType: "Multi-day Trip",
    tripLength: "6 Days",
    groupSize: 6,
    difficulty: "Beginner",
    price: 1890,
    departureDate: "2026-11-14",
    location: "uluwatu-bali",
    scene: "waves",
    featured: true,
    gallery: 3,
    tags: [tag.activity("surfing"), tag.region("asia"), tag.season("summer")],
    description: rt(
      p("Six days of ", b("warm water, patient coaches and soft-top boards"), " on the reef breaks of Uluwatu."),
      p("No experience needed — by day three most guests are catching green waves on their own."),
    ),
    itinerary: rt(
      ol(
        [b("Day 1"), " — Arrival, board fitting and a sunset beach session"],
        [b("Day 2–4"), " — Two coached sessions a day, video review in the evening"],
        [b("Day 5"), " — Boat trip to a secret reef break"],
        [b("Day 6"), " — Free surf and farewell dinner"],
      ),
    ),
    gearList: rt(ul("Reef-safe sunscreen", "Rash guard", "Reef booties", "Waterproof phone pouch")),
    variations: {
      summer: {
        title: "Bali Surf Camp — Summer Swell",
        price: 1690,
        description: rt(
          p("Our ", b("summer swell"), " edition: same coaches, smaller groups and a ", i("10% early-bird discount"), "."),
        ),
      },
    },
  },
  {
    slug: "beervana-portland",
    title: "Beervana in Portland",
    activity: "Social",
    adventureType: "Day Trip",
    tripLength: "1 Day",
    groupSize: 12,
    difficulty: "Beginner",
    price: 149,
    departureDate: "2026-11-07",
    location: "portland-oregon",
    scene: "city",
    tags: [tag.activity("social"), tag.region("north-america")],
    description: rt(
      p("A walking tour of Portland's craft breweries with tasting flights, food carts and one very good pretzel."),
    ),
    itinerary: rt(ul("11:00 — Meet in the Pearl District", "13:00 — Food cart lunch", "15:00 — Brewery number four (we stop counting)")),
    gearList: rt(ul("Comfortable shoes", "Rain jacket — it's Portland")),
  },
  {
    slug: "climbing-new-zealand",
    title: "Climbing New Zealand",
    activity: "Rock Climbing",
    adventureType: "Multi-day Trip",
    tripLength: "10 Days",
    groupSize: 4,
    difficulty: "Advanced",
    price: 4950,
    departureDate: "2027-01-09",
    location: "wanaka-new-zealand",
    scene: "mountains",
    featured: true,
    gallery: 2,
    tags: [tag.activity("rock-climbing"), tag.region("oceania"), tag.season("summer")],
    description: rt(
      p("Ten days of schist crags and alpine granite around Wanaka with an ", b("IFMGA-certified guide"), "."),
      p("You should be leading 6a (5.10a) comfortably before you join this trip."),
    ),
    itinerary: rt(
      h(3, "Week one"),
      p("Single-pitch cragging at Hospital Flat and Riverside to dial in technique."),
      h(3, "Week two"),
      p("Multi-pitch objectives in Mount Aspiring National Park, weather permitting."),
    ),
    gearList: rt(ul("Harness, helmet and shoes", "Belay device with locking carabiner", "Approach shoes", "Layered clothing")),
  },
  {
    slug: "colorado-rock-climbing",
    title: "Colorado Rock Climbing",
    activity: "Rock Climbing",
    adventureType: "Overnight Trip",
    tripLength: "2 Days",
    groupSize: 6,
    difficulty: "Intermediate",
    price: 640,
    departureDate: "2027-04-17",
    location: "boulder-colorado",
    scene: "mountains",
    tags: [tag.activity("rock-climbing"), tag.region("north-america")],
    description: rt(p("A weekend of granite in Boulder Canyon with a night under the stars at a private campsite.")),
    itinerary: rt(ol("Saturday — Technique clinic and top-rope circuit", "Sunday — Your first multi-pitch route")),
    gearList: rt(ul("Climbing shoes", "Sleeping bag", "Headlamp")),
  },
  {
    slug: "cycling-southern-utah",
    title: "Cycling Southern Utah",
    activity: "Cycling",
    adventureType: "Multi-day Trip",
    tripLength: "4 Days",
    groupSize: 8,
    difficulty: "Intermediate",
    price: 1580,
    departureDate: "2027-03-21",
    location: "moab-utah",
    scene: "desert",
    trailMap: true,
    gallery: 2,
    tags: [tag.activity("cycling"), tag.region("north-america"), tag.season("spring")],
    description: rt(
      p("Red rock, slickrock and wide-open skies: four days of gravel and singletrack around Moab."),
      p("A support van carries your luggage, snacks and anyone who wants a break."),
    ),
    itinerary: rt(
      ol("Day 1 — Slickrock practice loop", "Day 2 — Gemini Bridges", "Day 3 — White Rim (part one)", "Day 4 — Dead Horse Point"),
    ),
    gearList: rt(ul("Padded shorts", "3 litres of water capacity", "Sunglasses", "Spare tube")),
  },
  {
    slug: "cycling-tuscany",
    title: "Cycling Tuscany",
    activity: "Cycling",
    adventureType: "Multi-day Trip",
    tripLength: "7 Days",
    groupSize: 10,
    difficulty: "Intermediate",
    price: 3290,
    departureDate: "2027-05-08",
    location: "siena-tuscany",
    scene: "forest",
    featured: true,
    gallery: 3,
    tags: [tag.activity("cycling"), tag.region("europe"), tag.season("summer")],
    description: rt(
      p("Rolling white roads, cypress-lined climbs and long lunches through the ", i("Val d'Orcia"), "."),
      p("Expect 50–80 km a day with an e-bike option for every stage."),
    ),
    itinerary: rt(
      ol("Siena to Buonconvento", "Montalcino loop", "Pienza and the Crete Senesi", "Rest day with cooking class", "Montepulciano", "Bagno Vignoni", "Return to Siena"),
    ),
    gearList: rt(ul("Cycling shoes and pedals (we provide the bike)", "Helmet", "Light rain shell")),
    variations: {
      summer: {
        title: "Cycling Tuscany — Golden Hour Edition",
        price: 3490,
        description: rt(p("Early starts and evening rides to beat the summer heat, with ", b("sunset aperitivo"), " every night.")),
      },
    },
  },
  {
    slug: "downhill-skiing-wyoming",
    title: "Downhill Skiing Wyoming",
    activity: "Skiing",
    adventureType: "Multi-day Trip",
    tripLength: "5 Days",
    groupSize: 8,
    difficulty: "Advanced",
    price: 2650,
    departureDate: "2027-01-23",
    location: "jackson-hole-wyoming",
    scene: "snow",
    tags: [tag.activity("skiing"), tag.region("north-america"), tag.season("winter")],
    description: rt(p("Steep groomers, legendary chutes and a guide who knows where the powder stashes are.")),
    itinerary: rt(ul("3 guided days", "1 avalanche awareness clinic", "1 free day")),
    gearList: rt(ul("Skis or board (rentals available)", "Helmet and goggles", "Avalanche transceiver (provided)")),
    variations: {
      winter: {
        title: "Downhill Skiing Wyoming — Powder Week",
        price: 2890,
      },
    },
  },
  {
    slug: "gastronomic-marais-tour",
    title: "Gastronomic Marais Tour",
    activity: "Social",
    adventureType: "Day Trip",
    tripLength: "1 Day",
    groupSize: 10,
    difficulty: "Beginner",
    price: 210,
    departureDate: "2026-12-05",
    location: "le-marais-paris",
    scene: "city",
    tags: [tag.activity("social"), tag.region("europe")],
    description: rt(
      p("Falafel, fromage and the best ", i("pain au chocolat"), " in Paris — a walking food tour through Le Marais."),
    ),
    itinerary: rt(ul("Morning market", "Cheese cellar tasting", "Lunch on Rue des Rosiers", "Chocolate workshop")),
    gearList: rt(ul("An appetite")),
  },
  {
    slug: "napa-wine-tasting",
    title: "Napa Wine Tasting",
    activity: "Social",
    adventureType: "Day Trip",
    tripLength: "1 Day",
    groupSize: 14,
    difficulty: "Beginner",
    price: 260,
    departureDate: "2026-11-21",
    location: "napa-valley",
    scene: "forest",
    tags: [tag.activity("social"), tag.region("north-america")],
    description: rt(p("Four family-run wineries, a picnic lunch among the vines and a driver so you don't need one.")),
    itinerary: rt(ol("Pick-up in Napa", "Two tastings", "Vineyard picnic", "Two more tastings", "Drop-off")),
    gearList: rt(ul("Valid photo ID (21+)", "Sun hat")),
  },
  {
    slug: "riverside-camping-australia",
    title: "Riverside Camping in Australia",
    activity: "Camping",
    adventureType: "Overnight Trip",
    tripLength: "3 Days",
    groupSize: 12,
    difficulty: "Beginner",
    price: 720,
    departureDate: "2026-12-12",
    location: "murray-river-australia",
    scene: "forest",
    tags: [tag.activity("camping"), tag.region("oceania"), tag.season("summer")],
    description: rt(p("Canoe by day, campfire by night: three slow days on the Murray River under southern skies.")),
    itinerary: rt(ol("Paddle to the first sandbar camp", "Bird-watching and river swim", "Paddle out and farewell barbecue")),
    gearList: rt(ul("Sleeping bag", "Insect repellent", "Quick-dry clothes"), p("Tents and canoes are ", b("included"), ".")),
  },
  {
    slug: "ski-touring-mont-blanc",
    title: "Ski Touring Mont Blanc",
    activity: "Skiing",
    adventureType: "Multi-day Trip",
    tripLength: "6 Days",
    groupSize: 6,
    difficulty: "Expert",
    price: 3890,
    departureDate: "2027-02-20",
    location: "chamonix-mont-blanc",
    scene: "snow",
    featured: true,
    gallery: 2,
    trailMap: true,
    tags: [tag.activity("skiing"), tag.region("europe"), tag.season("winter")],
    description: rt(
      p("Hut-to-hut ski touring on the classic routes around the Mont Blanc massif."),
      p(b("Requirements:"), " confident off-piste skiing and 1,200 m of climbing per day."),
    ),
    itinerary: rt(
      h(3, "Route"),
      p("Chamonix → Argentière hut → Trient hut → Champex. See the ", link("https://www.chamonix.com", "Chamonix tourist office", "_blank"), " for conditions."),
    ),
    gearList: rt(ul("Touring skis, skins, crampons", "Avalanche kit (transceiver, shovel, probe)", "Hut sleeping liner")),
    variations: {
      winter: {
        title: "Ski Touring Mont Blanc — Deep Winter",
        price: 4190,
        tripLength: "7 Days",
      },
    },
  },
  {
    slug: "surf-camp-costa-rica",
    title: "Surf Camp in Costa Rica",
    activity: "Surfing",
    adventureType: "Multi-day Trip",
    tripLength: "7 Days",
    groupSize: 8,
    difficulty: "Beginner",
    price: 2190,
    departureDate: "2027-02-06",
    location: "nosara-costa-rica",
    scene: "waves",
    gallery: 2,
    tags: [tag.activity("surfing"), tag.region("central-america"), tag.season("summer")],
    description: rt(p("Consistent beach breaks, yoga at sunrise and howler monkeys as your alarm clock in Nosara.")),
    itinerary: rt(ul("Daily surf lessons", "Sunrise yoga", "Waterfall hike", "Turtle-watching evening")),
    gearList: rt(ul("Swimwear", "Reef-safe sunscreen", "Light rain jacket")),
    variations: {
      summer: {
        title: "Surf Camp in Costa Rica — Green Season",
        price: 1890,
      },
    },
  },
  {
    slug: "tahoe-skiing",
    title: "Tahoe Skiing",
    activity: "Skiing",
    adventureType: "Overnight Trip",
    tripLength: "3 Days",
    groupSize: 10,
    difficulty: "Intermediate",
    price: 1240,
    departureDate: "2027-01-02",
    location: "lake-tahoe",
    scene: "snow",
    tags: [tag.activity("skiing"), tag.region("north-america"), tag.season("winter")],
    description: rt(p("Bluebird days and lake views from every chairlift — a long weekend at Lake Tahoe.")),
    itinerary: rt(ul("Day 1 — Heavenly", "Day 2 — Palisades", "Day 3 — Your pick")),
    gearList: rt(ul("Ski clothing", "Goggles", "Lift pass (included)")),
  },
  {
    slug: "west-coast-cycling",
    title: "West Coast Cycling",
    activity: "Cycling",
    adventureType: "Multi-day Trip",
    tripLength: "9 Days",
    groupSize: 12,
    difficulty: "Advanced",
    price: 2980,
    departureDate: "2027-06-12",
    location: "big-sur-california",
    scene: "waves",
    trailMap: true,
    tags: [tag.activity("cycling"), tag.region("north-america"), tag.season("summer")],
    description: rt(p("Highway 1 from San Francisco to Santa Barbara: 750 km of coastline, cliffs and tailwinds.")),
    itinerary: rt(p("Nine stages averaging 85 km, with two optional century days.")),
    gearList: rt(ul("Road bike (rentals available)", "Lights front and rear", "Windproof vest")),
  },
  {
    slug: "whistler-mountain-biking",
    title: "Whistler Mountain Biking",
    activity: "Cycling",
    adventureType: "Multi-day Trip",
    tripLength: "4 Days",
    groupSize: 8,
    difficulty: "Advanced",
    price: 1790,
    departureDate: "2027-07-03",
    location: "whistler-bc",
    scene: "forest",
    tags: [tag.activity("cycling"), tag.region("north-america"), tag.season("summer")],
    description: rt(p("Lift-accessed flow trails, drops and berms in the Whistler Mountain Bike Park.")),
    itinerary: rt(ul("Skills day", "Bike park laps", "Backcountry enduro ride", "Free ride day")),
    gearList: rt(ul("Full-face helmet", "Knee pads", "Gloves")),
  },
  {
    slug: "yosemite-backpacking",
    title: "Yosemite Backpacking",
    activity: "Hiking",
    adventureType: "Multi-day Trip",
    tripLength: "5 Days",
    groupSize: 8,
    difficulty: "Intermediate",
    price: 1350,
    departureDate: "2027-06-26",
    location: "yosemite-valley",
    scene: "mountains",
    trailMap: true,
    gallery: 2,
    tags: [tag.activity("hiking"), tag.region("north-america"), tag.season("summer")],
    description: rt(p("Granite domes, alpine lakes and waterfalls on a five-day loop through the high country.")),
    itinerary: rt(ol("Tuolumne Meadows", "Cathedral Lakes", "Sunrise High Sierra Camp", "Clouds Rest", "Half Dome views and exit")),
    gearList: rt(ul("40–50 litre backpack", "Bear canister (provided)", "Water filter")),
  },
  // --- Drafts: only visible on Author until someone replicates them -------------------------
  {
    slug: "iceland-northern-lights-trek",
    title: "Iceland Northern Lights Trek",
    activity: "Hiking",
    adventureType: "Multi-day Trip",
    tripLength: "6 Days",
    groupSize: 10,
    difficulty: "Intermediate",
    price: 3450,
    departureDate: "2027-02-27",
    location: "thingvellir-iceland",
    scene: "snow",
    published: false,
    lastModified: "2026-10-20T16:42:00.000Z",
    tags: [tag.activity("hiking"), tag.region("europe"), tag.season("winter")],
    description: rt(p(b("DRAFT"), " — Lava fields by day, auroras by night. Copy still being reviewed by legal.")),
    itinerary: rt(p("TBD")),
    gearList: rt(ul("Insulated boots", "Microspikes")),
  },
  {
    slug: "patagonia-glacier-expedition",
    title: "Patagonia Glacier Expedition",
    activity: "Hiking",
    adventureType: "Multi-day Trip",
    tripLength: "12 Days",
    groupSize: 6,
    difficulty: "Expert",
    price: 6900,
    departureDate: "2027-11-15",
    location: "el-chalten-argentina",
    scene: "mountains",
    published: false,
    lastModified: "2026-10-21T08:10:00.000Z",
    tags: [tag.activity("hiking"), tag.region("south-america")],
    description: rt(p(b("DRAFT"), " — Ice-cap traverse below Cerro Fitz Roy. Pricing not final.")),
    itinerary: rt(p("TBD")),
    gearList: rt(ul("Mountaineering boots", "Glacier glasses")),
  },
];

/** German language copies (/content/dam/wknd-shared/de/...), as produced by AEM translation projects. */
const germanCopies: Record<string, Partial<AdventureSeed>> = {
  "bali-surf-camp": {
    title: "Surfcamp auf Bali",
    description: rt(p("Sechs Tage ", b("warmes Wasser, geduldige Coaches und Softboards"), " an den Riffbreaks von Uluwatu.")),
    tripLength: "6 Tage",
    variations: { summer: { title: "Surfcamp auf Bali — Sommer-Swell", price: 1690 } },
  },
  "cycling-tuscany": {
    title: "Radfahren in der Toskana",
    description: rt(p("Weiße Schotterstraßen, Zypressen und lange Mittagspausen im ", i("Val d'Orcia"), ".")),
    tripLength: "7 Tage",
    variations: {},
  },
  "ski-touring-mont-blanc": {
    title: "Skitouren am Mont Blanc",
    description: rt(p("Hüttentouren auf den Klassikern rund um das Mont-Blanc-Massiv.")),
    tripLength: "6 Tage",
    variations: {},
  },
  "napa-wine-tasting": {
    title: "Weinprobe im Napa Valley",
    description: rt(p("Vier Familienweingüter, ein Picknick zwischen den Reben und ein Fahrer inklusive.")),
    tripLength: "1 Tag",
    variations: {},
  },
};

export const adventures = [
  ...seeds.map((seed) => adventure(seed)),
  ...Object.entries(germanCopies).map(([slug, overrides]) => {
    const seed = seeds.find((candidate) => candidate.slug === slug)!;
    return adventure({ ...seed, ...overrides, lastModified: "2026-05-02T12:00:00.000Z" }, "de");
  }),
];
