import type { FieldDefinition, ModelDefinition } from "./types";
import { models, typeNameFor } from "./models";

/**
 * Generates the GraphQL SDL for a Sites configuration from its Content Fragment Models — the same
 * job AEM does whenever a model is enabled or changed. Naming follows AEM:
 *
 *   model "adventure"  ->  type AdventureModel
 *                          adventureByPath(_path: ...)   : AdventureModelResult!
 *                          adventureList(filter: ...)    : AdventureModelResults!
 *                          adventurePaginated(first: ...): AdventureModelConnection!
 */

const doc = (text: string | undefined) => (text ? `  """${text.replace(/"""/g, "'''")}"""\n` : "");

export function outputType(field: FieldDefinition): string {
  const list = (type: string, multiple?: boolean) => (multiple ? `[${type}]` : type);
  switch (field.type) {
    case "single-line-text":
      return list("String", field.multiple);
    case "multi-line-text":
      return "MultiFormatString";
    case "number":
      return list(field.numberType === "integer" ? "Int" : "Float", field.multiple);
    case "boolean":
      return "Boolean";
    case "date-time":
      return field.flavor === "date" ? "Date" : field.flavor === "time" ? "Time" : "Calendar";
    case "enumeration":
      return list("String", field.multiple);
    case "tags":
      return "[String]";
    case "content-reference":
      return list("Reference", field.multiple);
    case "fragment-reference":
      return list(field.models.length === 1 ? typeNameFor(field.models[0]) : "AllFragmentModels", field.multiple);
    case "json-object":
      return "JSON";
  }
}

/** The filter input type for a field, or null when AEM does not support filtering on it. */
export function filterType(field: FieldDefinition): string | null {
  const scalar = (type: string, multiple?: boolean) => (multiple ? `${type}ArrayFilter` : `${type}Filter`);
  switch (field.type) {
    case "single-line-text":
    case "enumeration":
      return scalar("String", field.multiple);
    case "multi-line-text":
      return "StringFilter";
    case "number":
      return scalar(field.numberType === "integer" ? "Int" : "Float", field.multiple);
    case "boolean":
      return "BooleanFilter";
    case "date-time":
      return field.flavor === "date" ? "DateFilter" : field.flavor === "time" ? "TimeFilter" : "CalendarFilter";
    case "tags":
      return "StringArrayFilter";
    case "content-reference":
      return scalar("String", field.multiple);
    case "fragment-reference":
      if (field.models.length !== 1) return null;
      return field.multiple ? `${typeNameFor(field.models[0])}ArrayFilter` : `${typeNameFor(field.models[0])}Filter`;
    case "json-object":
      return null;
  }
}

const commonArgs = `_locale: String, variation: String, sort: String, includeVariations: Boolean, _assetTransform: AssetTransform`;

function modelSdl(model: ModelDefinition): string {
  const type = typeNameFor(model.name);
  const fields = model.fields
    .map((field) => `${doc(field.description ? `${field.label} — ${field.description}` : field.label)}  ${field.name}: ${outputType(field)}`)
    .join("\n");
  const filters = model.fields
    .map((field) => {
      const filter = filterType(field);
      return filter ? `  ${field.name}: ${filter}` : null;
    })
    .filter(Boolean)
    .join("\n");

  return `
"""${model.title}: ${model.description} (Content Fragment Model /conf/wknd-shared/settings/dam/cfm/models/${model.name})"""
type ${type} {
  """Repository path of the fragment. Use it as the identifier."""
  _path: ID!
  """UUID of the fragment. Survives moves and renames."""
  _id: ID!
  """Name of the variation that was returned ("master" when none/fallback)."""
  _variation: String
  """Names of all variations of this fragment (master is not included)."""
  _variations: [String]!
  _model: ModelInfo!
  _metadata: TypedMetaData!
  """cq:tags assigned to the fragment."""
  _tags: [String]
${fields}
}

type ${type}Result {
  item: ${type}
  _references: [Reference]!
}

type ${type}Results {
  items: [${type}]!
  _references: [Reference]!
}

type ${type}Edge {
  cursor: String!
  node: ${type}!
}

type ${type}Connection {
  edges: [${type}Edge]!
  pageInfo: PageInfo!
}

input ${type}Filter {
  _path: IDFilter
  _variation: StringFilter
${filters}
}

input ${type}ArrayFilter {
  _match: ${type}Filter
  _apply: ArrayMode
}`;
}

function queryFieldsSdl(model: ModelDefinition): string {
  const type = typeNameFor(model.name);
  return `
  """Get a single ${model.title} fragment by its repository path."""
  ${model.name}ByPath(_path: String!, variation: String, _assetTransform: AssetTransform): ${type}Result!
  """List ${model.title} fragments (offset based paging)."""
  ${model.name}List(filter: ${type}Filter, ${commonArgs}, offset: Int, limit: Int): ${type}Results!
  """List ${model.title} fragments (cursor based paging, first defaults to 50, max 100)."""
  ${model.name}Paginated(filter: ${type}Filter, ${commonArgs}, first: Int, after: String): ${type}Connection!`;
}

const filterInputs = (name: string, valueType: string, operatorEnum: string, extra = "") => `
input ${name}Filter {
  _logOp: LogOp
  _expressions: [${name}FilterExpression]!
}

input ${name}FilterExpression {
  value: ${valueType}
  _operator: ${operatorEnum}${extra}
}

input ${name}ArrayFilter {
  _logOp: LogOp
  _expressions: [${name}ArrayFilterExpression]!
}

input ${name}ArrayFilterExpression {
  value: ${valueType}
  """Matches when the array equals exactly these values (order does not matter)."""
  values: [${valueType}]
  _operator: ${operatorEnum}
  _apply: ArrayMode${extra}
}`;

const baseSdl = `
"""Free-form JSON (JSON Object fields, rich text json format)."""
scalar JSON
"""Date and time in ISO-8601 (Date and Time field, flavor "Date and time")."""
scalar Calendar
"""Date in ISO-8601, e.g. 2026-11-14 (Date and Time field, flavor "Date")."""
scalar Date
"""Time in ISO-8601, e.g. 14:30:00 (Date and Time field, flavor "Time")."""
scalar Time

enum LogOp {
  AND
  OR
}

enum ArrayMode {
  """At least one array element must match (default)."""
  AT_LEAST_ONCE
  """Every element must match and the array must not be empty."""
  ALL
  """Every element must match, or the array is empty."""
  ALL_OR_EMPTY
}

enum StringOperator {
  EQUALS
  EQUALS_NOT
  CONTAINS
  CONTAINS_NOT
}

enum IDOperator {
  EQUALS
  EQUALS_NOT
  STARTS_WITH
}

"""Note: numbers use EQUAL/UNEQUAL — not EQUALS like strings."""
enum IntOperator {
  EQUAL
  UNEQUAL
  GREATER
  GREATER_EQUAL
  LOWER
  LOWER_EQUAL
}

"""Note: numbers use EQUAL/UNEQUAL — not EQUALS like strings."""
enum FloatOperator {
  EQUAL
  UNEQUAL
  GREATER
  GREATER_EQUAL
  LOWER
  LOWER_EQUAL
}

enum BooleanOperator {
  EQUALS
}

enum CalendarOperator {
  AT
  NOT_AT
  BEFORE
  AT_OR_BEFORE
  AFTER
  AT_OR_AFTER
}
${filterInputs("String", "String", "StringOperator", "\n  _ignoreCase: Boolean")}
${filterInputs("ID", "ID", "IDOperator", "\n  _ignoreCase: Boolean")}
${filterInputs("Int", "Int", "IntOperator")}
${filterInputs("Float", "Float", "FloatOperator", "\n  _sensitiveness: Float")}
${filterInputs("Boolean", "Boolean", "BooleanOperator")}
${filterInputs("Date", "Date", "CalendarOperator")}
${filterInputs("Time", "Time", "CalendarOperator")}
${filterInputs("Calendar", "Calendar", "CalendarOperator")}

"""Web-optimized image delivery parameters, applied to every _dynamicUrl in the result."""
input AssetTransform {
  format: AssetTransformFormat
  seoName: String
  crop: AssetTransformCrop
  size: AssetTransformSize
  rotation: AssetTransformRotation
  flip: AssetTransformFlip
  """1-100"""
  quality: Int
  width: Int
  preferWebp: Boolean
}

enum AssetTransformFormat {
  GIF
  PNG
  PNG8
  JPG
  PJPG
  BJPG
  WEBP
  WEBPLL
  WEBPLY
}

input AssetTransformCrop {
  xOrigin: Int!
  yOrigin: Int!
  width: Int
  height: Int
}

input AssetTransformSize {
  width: Int
  height: Int
}

enum AssetTransformRotation {
  R90
  R180
  R270
}

enum AssetTransformFlip {
  HORIZONTAL
  VERTICAL
  HORIZONTAL_AND_VERTICAL
}

"""A DAM image referenced from a Content Reference field or inline in rich text."""
type ImageRef {
  _path: ID!
  _authorUrl: String!
  _publishUrl: String!
  """Web-optimized delivery URL WITHOUT the host — prefix it with your AEM Publish origin."""
  _dynamicUrl: String
  mimeType: String
  width: Int
  height: Int
}

"""A DAM document (PDF, Office, ...)."""
type DocumentRef {
  _path: ID!
  _authorUrl: String!
  _publishUrl: String!
  format: String
  size: Int
}

"""A DAM video or audio asset."""
type MultimediaRef {
  _path: ID!
  _authorUrl: String!
  _publishUrl: String!
  format: String
  size: Int
}

"""A DAM archive (zip, ...)."""
type ArchiveRef {
  _path: ID!
  _authorUrl: String!
  _publishUrl: String!
  format: String
  size: Int
}

type ModelInfo {
  _path: ID!
  title: String!
}

type StringMetadata { name: String! value: String }
type StringArrayMetadata { name: String! value: [String] }
type IntMetadata { name: String! value: Int }
type IntArrayMetadata { name: String! value: [Int] }
type FloatMetadata { name: String! value: Float }
type FloatArrayMetadata { name: String! value: [Float] }
type BooleanMetadata { name: String! value: Boolean }
type BooleanArrayMetadata { name: String! value: [Boolean] }
type CalendarMetadata { name: String! value: Calendar }
type CalendarArrayMetadata { name: String! value: [Calendar] }

type TypedMetaData {
  stringMetadata: [StringMetadata]!
  stringArrayMetadata: [StringArrayMetadata]!
  intMetadata: [IntMetadata]!
  intArrayMetadata: [IntArrayMetadata]!
  floatMetadata: [FloatMetadata]!
  floatArrayMetadata: [FloatArrayMetadata]!
  booleanMetadata: [BooleanMetadata]!
  booleanArrayMetadata: [BooleanArrayMetadata]!
  calendarMetadata: [CalendarMetadata]!
  calendarArrayMetadata: [CalendarArrayMetadata]!
}

"""A Multi line text field, available in four formats."""
type MultiFormatString {
  html: String
  plaintext: String
  markdown: String
  """Structured rich text: an array of nodes with nodeType, content, value, format and data."""
  json: JSON
}

type PageInfo {
  startCursor: String
  endCursor: String
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}
`;

export function generateSdl(): string {
  const modelTypes = models.map((model) => typeNameFor(model.name));
  return [
    baseSdl.trim(),
    `"""Anything a Content Reference field or _references can point to."""\nunion Reference = ImageRef | DocumentRef | MultimediaRef | ArchiveRef | ${modelTypes.join(" | ")}`,
    `"""Any Content Fragment Model of this configuration."""\nunion AllFragmentModels = ${modelTypes.join(" | ")}`,
    ...models.map(modelSdl),
    `type Query {${models.map(queryFieldsSdl).join("\n")}\n}`,
  ].join("\n\n");
}
