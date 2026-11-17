import type { FieldDefinition, ModelDefinition } from "./types";

/**
 * Content Fragment Models for the "wknd-shared" configuration.
 *
 * In real AEM these are created in Tools > General > Content Fragment Models and stored under
 * /conf/wknd-shared/settings/dam/cfm/models/<name>. AEM generates the GraphQL schema from them —
 * this mock does the same in ./schema.ts, so editing a model here changes the schema.
 */
export const models: ModelDefinition[] = [
  {
    name: "adventure",
    title: "Adventure",
    description: "A bookable WKND trip.",
    fields: [
      { name: "title", label: "Title", type: "single-line-text", required: true },
      { name: "slug", label: "Slug", type: "single-line-text", required: true, description: "Unique, URL friendly id" },
      { name: "description", label: "Description", type: "multi-line-text" },
      {
        name: "adventureType",
        label: "Adventure Type",
        type: "enumeration",
        options: ["Day Trip", "Overnight Trip", "Multi-day Trip"],
      },
      { name: "tripLength", label: "Trip Length", type: "single-line-text" },
      {
        name: "activity",
        label: "Activity",
        type: "enumeration",
        options: ["Camping", "Cycling", "Hiking", "Rock Climbing", "Skiing", "Social", "Surfing"],
      },
      { name: "groupSize", label: "Group Size", type: "number", numberType: "integer" },
      {
        name: "difficulty",
        label: "Difficulty",
        type: "enumeration",
        options: ["Beginner", "Intermediate", "Advanced", "Expert"],
      },
      { name: "price", label: "Price (USD)", type: "number", numberType: "fraction" },
      { name: "departureDate", label: "Next Departure", type: "date-time", flavor: "date" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "primaryImage", label: "Primary Image", type: "content-reference", accepts: ["image"] },
      { name: "gallery", label: "Gallery", type: "content-reference", accepts: ["image"], multiple: true },
      { name: "trailMap", label: "Trail Map", type: "content-reference", accepts: ["document"] },
      { name: "location", label: "Location", type: "fragment-reference", models: ["location"] },
      { name: "itinerary", label: "Itinerary", type: "multi-line-text" },
      { name: "gearList", label: "What to Bring", type: "multi-line-text" },
      { name: "tags", label: "Tags", type: "tags" },
    ],
  },
  {
    name: "location",
    title: "Location",
    description: "Where an adventure takes place.",
    fields: [
      { name: "name", label: "Name", type: "single-line-text", required: true },
      { name: "city", label: "City", type: "single-line-text" },
      { name: "country", label: "Country", type: "single-line-text" },
      { name: "countryCode", label: "Country Code", type: "single-line-text" },
      {
        name: "region",
        label: "Region",
        type: "enumeration",
        options: ["Asia", "Central America", "Europe", "North America", "Oceania", "South America"],
      },
      { name: "coordinates", label: "Coordinates", type: "json-object" },
    ],
  },
  {
    name: "author",
    title: "Author",
    description: "A WKND magazine contributor.",
    fields: [
      { name: "firstName", label: "First Name", type: "single-line-text", required: true },
      { name: "lastName", label: "Last Name", type: "single-line-text", required: true },
      { name: "occupation", label: "Occupation", type: "single-line-text" },
      { name: "profilePicture", label: "Profile Picture", type: "content-reference", accepts: ["image"] },
      { name: "bio", label: "Biography", type: "multi-line-text" },
      { name: "instagram", label: "Instagram Handle", type: "single-line-text" },
    ],
  },
  {
    name: "article",
    title: "Article",
    description: "A WKND magazine story.",
    fields: [
      { name: "title", label: "Title", type: "single-line-text", required: true },
      { name: "slug", label: "Slug", type: "single-line-text", required: true },
      { name: "excerpt", label: "Excerpt", type: "single-line-text" },
      { name: "featuredImage", label: "Featured Image", type: "content-reference", accepts: ["image"] },
      { name: "main", label: "Main", type: "multi-line-text" },
      { name: "authorFragment", label: "Author", type: "fragment-reference", models: ["author"] },
      {
        name: "relatedAdventures",
        label: "Related Adventures",
        type: "fragment-reference",
        models: ["adventure"],
        multiple: true,
      },
      { name: "publishDate", label: "Publish Date", type: "date-time", flavor: "datetime" },
      { name: "readingTimeMinutes", label: "Reading Time (min)", type: "number", numberType: "integer" },
      { name: "tags", label: "Tags", type: "tags" },
    ],
  },
];

export const modelPathPrefix = (configurationName: string) =>
  `/conf/${configurationName}/settings/dam/cfm/models`;

export function getModel(name: string): ModelDefinition {
  const model = models.find((candidate) => candidate.name === name);
  if (!model) throw new Error(`Unknown model "${name}"`);
  return model;
}

export function getField(model: ModelDefinition, fieldName: string): FieldDefinition | undefined {
  return model.fields.find((field) => field.name === fieldName);
}

/** adventure -> AdventureModel */
export function typeNameFor(modelName: string): string {
  return `${modelName.charAt(0).toUpperCase()}${modelName.slice(1)}Model`;
}
