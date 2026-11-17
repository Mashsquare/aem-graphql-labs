/**
 * Core types for the mock AEM backend.
 *
 * The vocabulary mirrors AEM as a Cloud Service:
 *  - Content Fragment Models live under /conf/<config>/settings/dam/cfm/models
 *  - Content Fragments live in the DAM under /content/dam/<site>/<locale>/...
 *  - Every fragment has a "master" variation plus optional named variations
 *  - Author sees working copies; Publish only sees what was replicated
 */

export type Tier = "author" | "publish";

/* -------------------------------------------------------------------------- */
/* Rich text (Multi line text field, "json" format)                            */
/* -------------------------------------------------------------------------- */

export type TextVariant = "bold" | "italic" | "underline";

export interface RichTextTextNode {
  nodeType: "text";
  value: string;
  format?: { variants: TextVariant[] };
}

export interface RichTextLinkNode {
  nodeType: "link";
  value: string;
  data: { href: string; target?: string };
}

/** An asset (image, PDF, ...) embedded in the rich text editor. */
export interface RichTextAssetReferenceNode {
  nodeType: "reference";
  data: { path: string; mimetype: string };
}

/** A content fragment linked from the rich text editor. */
export interface RichTextFragmentReferenceNode {
  nodeType: "reference";
  value: string;
  data: { href: string; type: "fragment" };
}

export interface RichTextBlockNode {
  nodeType: "paragraph" | "unordered-list" | "ordered-list" | "list-item";
  content: RichTextNode[];
}

export interface RichTextHeaderNode {
  nodeType: "header";
  style: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  content: RichTextNode[];
}

export type RichTextNode =
  | RichTextTextNode
  | RichTextLinkNode
  | RichTextAssetReferenceNode
  | RichTextFragmentReferenceNode
  | RichTextBlockNode
  | RichTextHeaderNode;

export interface RichText {
  /** Marker so the engine can tell rich text apart from JSON object fields. */
  __richText: true;
  nodes: RichTextNode[];
}

/* -------------------------------------------------------------------------- */
/* Content Fragment Models                                                     */
/* -------------------------------------------------------------------------- */

interface BaseField {
  name: string;
  label: string;
  required?: boolean;
  description?: string;
}

/** The data types offered by the AEM Content Fragment Model editor. */
export type FieldDefinition =
  | (BaseField & { type: "single-line-text"; multiple?: boolean })
  | (BaseField & { type: "multi-line-text" })
  | (BaseField & { type: "number"; numberType: "integer" | "fraction"; multiple?: boolean })
  | (BaseField & { type: "boolean" })
  | (BaseField & { type: "date-time"; flavor: "date" | "time" | "datetime" })
  | (BaseField & { type: "enumeration"; options: string[]; multiple?: boolean })
  | (BaseField & { type: "tags" })
  | (BaseField & { type: "content-reference"; multiple?: boolean; accepts: ("image" | "document" | "video")[] })
  | (BaseField & { type: "fragment-reference"; models: string[]; multiple?: boolean })
  | (BaseField & { type: "json-object" });

export interface ModelDefinition {
  /** Technical name, used to build GraphQL names: adventure -> AdventureModel, adventureList, ... */
  name: string;
  title: string;
  description: string;
  fields: FieldDefinition[];
}

/* -------------------------------------------------------------------------- */
/* Content Fragments                                                           */
/* -------------------------------------------------------------------------- */

export type FieldValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | RichText
  | Record<string, unknown>;

export type FragmentData = Record<string, FieldValue>;

export interface FragmentContent {
  master: FragmentData;
  /** Named variations only store the fields that differ from master. */
  variations: Record<string, Partial<FragmentData>>;
}

export interface ContentFragment {
  path: string;
  id: string;
  model: string;
  /** Fragment title as shown in the AEM Assets UI (not the "title" field). */
  title: string;
  description: string;
  /** cq:tags on the fragment itself, exposed as `_tags`. */
  tags: string[];
  created: string;
  lastModified: string;
  lastModifiedBy: string;
  /** The working copy that Author sees. */
  content: FragmentContent;
  /** The copy that was last replicated to Publish (null = never published / unpublished). */
  published: { content: FragmentContent; at: string; by: string } | null;
}

/* -------------------------------------------------------------------------- */
/* DAM assets                                                                  */
/* -------------------------------------------------------------------------- */

export type AssetKind = "image" | "document" | "video";

export interface Asset {
  path: string;
  id: string;
  kind: AssetKind;
  mimeType: string;
  title: string;
  /** Image dimensions (images only). */
  width?: number;
  height?: number;
  /** File size in bytes. */
  size: number;
  /** Placeholder rendering hint so every image looks different. */
  hue: number;
  scene?: "mountains" | "waves" | "city" | "forest" | "desert" | "snow" | "portrait";
}

/* -------------------------------------------------------------------------- */
/* Persisted queries                                                           */
/* -------------------------------------------------------------------------- */

export interface CacheControlConfig {
  "max-age"?: number;
}

export interface SurrogateControlConfig {
  "max-age"?: number;
  "stale-while-revalidate"?: number;
  "stale-if-error"?: number;
}

export interface PersistedQuery {
  configurationName: string;
  name: string;
  query: string;
  cacheControl?: CacheControlConfig;
  surrogateControl?: SurrogateControlConfig;
  /** Persisted queries are created on Author and must be replicated to Publish. */
  published: boolean;
  created: string;
  lastModified: string;
  origin: "seed" | "user";
}
