import { DAM_ROOT } from "./helpers";
import { fragment } from "./fragment";

type Region = "Asia" | "Central America" | "Europe" | "North America" | "Oceania" | "South America";

const location = (
  slug: string,
  name: string,
  city: string,
  country: string,
  countryCode: string,
  region: Region,
  lat: number,
  lng: number,
  published = true,
) =>
  fragment({
    path: `${DAM_ROOT}/en/locations/${slug}`,
    model: "location",
    title: name,
    lastModified: "2026-01-12T09:30:00.000Z",
    published,
    master: { name, city, country, countryCode, region, coordinates: { lat, lng } },
  });

export const locationPath = (slug: string) => `${DAM_ROOT}/en/locations/${slug}`;

export const locations = [
  location("uluwatu-bali", "Uluwatu", "Uluwatu", "Indonesia", "ID", "Asia", -8.8291, 115.0849),
  location("portland-oregon", "Portland", "Portland", "United States", "US", "North America", 45.5152, -122.6784),
  location("wanaka-new-zealand", "Wanaka", "Wanaka", "New Zealand", "NZ", "Oceania", -44.7032, 169.1321),
  location("boulder-colorado", "Boulder Canyon", "Boulder", "United States", "US", "North America", 40.015, -105.2705),
  location("moab-utah", "Moab", "Moab", "United States", "US", "North America", 38.5733, -109.5498),
  location("siena-tuscany", "Val d'Orcia", "Siena", "Italy", "IT", "Europe", 43.3188, 11.3308),
  location("jackson-hole-wyoming", "Jackson Hole", "Jackson", "United States", "US", "North America", 43.4799, -110.7624),
  location("le-marais-paris", "Le Marais", "Paris", "France", "FR", "Europe", 48.859, 2.3622),
  location("napa-valley", "Napa Valley", "Napa", "United States", "US", "North America", 38.2975, -122.2869),
  location("murray-river-australia", "Murray River", "Albury", "Australia", "AU", "Oceania", -36.0737, 146.9135),
  location("chamonix-mont-blanc", "Chamonix-Mont-Blanc", "Chamonix", "France", "FR", "Europe", 45.9237, 6.8694),
  location("nosara-costa-rica", "Playa Guiones", "Nosara", "Costa Rica", "CR", "Central America", 9.942, -85.6655),
  location("lake-tahoe", "Lake Tahoe", "South Lake Tahoe", "United States", "US", "North America", 38.9399, -119.9772),
  location("big-sur-california", "Big Sur", "Big Sur", "United States", "US", "North America", 36.2704, -121.8081),
  location("whistler-bc", "Whistler", "Whistler", "Canada", "CA", "North America", 50.1163, -122.9574),
  location("yosemite-valley", "Yosemite Valley", "Yosemite", "United States", "US", "North America", 37.7456, -119.5936),
  location("thingvellir-iceland", "Þingvellir", "Reykjavík", "Iceland", "IS", "Europe", 64.2559, -21.1295),
  location("el-chalten-argentina", "El Chaltén", "El Chaltén", "Argentina", "AR", "South America", -49.3315, -72.8863),
];
