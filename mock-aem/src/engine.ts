import {
  buildSchema,
  execute,
  getNamedType,
  getNullableType,
  getOperationAST,
  GraphQLError,
  type GraphQLFieldResolver,
  GraphQLObjectType,
  type GraphQLSchema,
  GraphQLUnionType,
  isInputObjectType,
  isListType,
  parse,
  typeFromAST,
  validate,
} from "graphql";
import type { Asset, FieldDefinition, ModelDefinition, RichText, Tier } from "./types";
import { dynamicUrl, type AssetTransformInput } from "./assets";
import { modelPathPrefix, models, typeNameFor } from "./models";
import { isRichText, richTextFormats } from "./richtext";
import { generateSdl } from "./schema";
import type { MockAemStore } from "./store";
import { collectReferences, decodeCursor, encodeCursor, matchesFilter, parseSort, sortViews, type ModelFilter } from "./query";
import {
  allVariationViews,
  resolveAssetPath,
  resolveFragmentPath,
  viewOf,
  type AssetView,
  type FragmentView,
  type ReferenceView,
  type ResolveScope,
} from "./views";

export interface RequestContext {
  tier: Tier;
  store: MockAemStore;
  configurationName: string;
  origins: { author: string; publish: string };
}

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown> | null;
  operationName?: string | null;
}

/** graphql-java (which AEM uses) tags each error with a classification. */
export interface FormattedError {
  message: string;
  locations?: readonly { line: number; column: number }[];
  path?: readonly (string | number)[];
  extensions: { classification: "InvalidSyntax" | "ValidationError" | "DataFetchingException" };
}

export interface GraphQLResponse {
  errors?: FormattedError[];
  data?: unknown;
}

interface CollectionArgs {
  filter?: ModelFilter | null;
  _locale?: string | null;
  variation?: string | null;
  sort?: string | null;
  includeVariations?: boolean | null;
  _assetTransform?: AssetTransformInput | null;
}

const assetTypeName = (asset: Asset) =>
  asset.kind === "image" ? "ImageRef" : asset.kind === "video" ? "MultimediaRef" : "DocumentRef";

const localeOf = (path: string) => /^\/content\/dam\/[^/]+\/([^/]+)\//.exec(path)?.[1]?.toLowerCase();

function scopeFrom(ctx: RequestContext, args: CollectionArgs): ResolveScope {
  return {
    tier: ctx.tier,
    variation: args.variation ?? undefined,
    transform: args._assetTransform ?? undefined,
  };
}

function collectViews(ctx: RequestContext, model: ModelDefinition, args: CollectionArgs): FragmentView[] {
  if (args.includeVariations && args.filter?._variation) {
    throw new GraphQLError("includeVariations cannot be combined with a _variation filter.");
  }
  const scope = scopeFrom(ctx, args);
  const locale = args._locale?.toLowerCase();
  const views = ctx.store.fragmentsOfModel(model.name).flatMap((fragment) => {
    if (locale && localeOf(fragment.path) !== locale) return [];
    const content = ctx.store.contentFor(fragment, ctx.tier);
    if (!content) return [];
    return args.includeVariations ? allVariationViews(fragment, content, scope) : [viewOf(fragment, content, scope.variation, scope)];
  });
  const filtered = views.filter((view) => matchesFilter(ctx.store, view, model, args.filter));
  return sortViews(ctx.store, filtered, parseSort(args.sort, model));
}

function resolveModelField(view: FragmentView, field: FieldDefinition, ctx: RequestContext): unknown {
  const raw = view.values[field.name];
  switch (field.type) {
    case "multi-line-text":
      return isRichText(raw) ? raw : null;
    case "content-reference":
      if (field.multiple) {
        return (Array.isArray(raw) ? raw : []).map((path) => resolveAssetPath(ctx.store, path, view.scope)).filter(Boolean);
      }
      return resolveAssetPath(ctx.store, raw, view.scope);
    case "fragment-reference":
      if (field.multiple) {
        return (Array.isArray(raw) ? raw : []).map((path) => resolveFragmentPath(ctx.store, path, view.scope)).filter(Boolean);
      }
      return resolveFragmentPath(ctx.store, raw, view.scope);
    case "tags":
      return raw ?? [];
    default:
      return raw ?? null;
  }
}

function metadataFor(view: FragmentView, ctx: RequestContext) {
  const fragment = view.fragment;
  const lastModified = ctx.tier === "publish" ? (fragment.published?.at ?? fragment.lastModified) : fragment.lastModified;
  return {
    stringMetadata: [
      { name: "title", value: fragment.title },
      { name: "description", value: fragment.description },
      { name: "cq:lastModifiedBy", value: fragment.lastModifiedBy },
      { name: "cq:model", value: `${modelPathPrefix(ctx.configurationName)}/${fragment.model}` },
    ],
    stringArrayMetadata: [{ name: "cq:tags", value: fragment.tags }],
    intMetadata: [],
    intArrayMetadata: [],
    floatMetadata: [],
    floatArrayMetadata: [],
    booleanMetadata: [],
    booleanArrayMetadata: [],
    calendarMetadata: [
      { name: "jcr:created", value: fragment.created },
      { name: "cq:lastModified", value: lastModified },
      ...(fragment.published ? [{ name: "cq:lastReplicated", value: fragment.published.at }] : []),
    ],
    calendarArrayMetadata: [],
  };
}

type Resolver = GraphQLFieldResolver<unknown, RequestContext, Record<string, unknown>>;

function setResolvers(schema: GraphQLSchema, typeName: string, resolvers: Record<string, Resolver>) {
  const type = schema.getType(typeName);
  if (!(type instanceof GraphQLObjectType)) throw new Error(`${typeName} is not an object type`);
  const fields = type.getFields();
  for (const [name, resolve] of Object.entries(resolvers)) {
    if (!fields[name]) throw new Error(`${typeName}.${name} does not exist`);
    fields[name].resolve = resolve;
  }
}

export function createSchema(): GraphQLSchema {
  const schema = buildSchema(generateSdl());
  const query: Record<string, Resolver> = {};

  for (const model of models) {
    const typeName = typeNameFor(model.name);

    query[`${model.name}ByPath`] = (_root, rawArgs, ctx) => {
      const args = rawArgs as unknown as { _path: string } & CollectionArgs;
      const fragment = ctx.store.fragments.get(args._path);
      if (!fragment || fragment.model !== model.name) return { item: null };
      const content = ctx.store.contentFor(fragment, ctx.tier);
      const scope = scopeFrom(ctx, args);
      return { item: content ? viewOf(fragment, content, scope.variation, scope) : null };
    };

    query[`${model.name}List`] = (_root, rawArgs, ctx) => {
      const args = rawArgs as CollectionArgs & { offset?: number | null; limit?: number | null };
      const views = collectViews(ctx, model, args);
      const offset = args.offset ?? 0;
      if (offset < 0) throw new GraphQLError("offset must be >= 0");
      if (args.limit !== null && args.limit !== undefined && args.limit < 0) throw new GraphQLError("limit must be >= 0");
      return { items: views.slice(offset, args.limit === null || args.limit === undefined ? undefined : offset + args.limit) };
    };

    query[`${model.name}Paginated`] = (_root, rawArgs, ctx) => {
      const args = rawArgs as CollectionArgs & { first?: number | null; after?: string | null };
      const first = args.first ?? 50;
      if (first < 0 || first > 100) throw new GraphQLError(`"first" must be between 0 and 100 (got ${first}).`);
      const views = collectViews(ctx, model, args);
      const start = args.after ? decodeCursor(args.after) + 1 : 0;
      const page = views.slice(start, start + first);
      const edges = page.map((node, index) => ({ cursor: encodeCursor(start + index, node), node }));
      return {
        edges,
        pageInfo: {
          startCursor: edges[0]?.cursor ?? null,
          endCursor: edges.at(-1)?.cursor ?? null,
          hasNextPage: start + page.length < views.length,
          hasPreviousPage: start > 0,
        },
      };
    };

    const fieldResolvers: Record<string, Resolver> = {
      _path: (view) => (view as FragmentView).fragment.path,
      _id: (view) => (view as FragmentView).fragment.id,
      _variation: (view) => (view as FragmentView).variation,
      _variations: (view, _args, ctx) =>
        Object.keys(ctx.store.contentFor((view as FragmentView).fragment, ctx.tier)?.variations ?? {}),
      _model: () => ({ _path: `${modelPathPrefix("wknd-shared")}/${model.name}`, title: model.title }),
      _metadata: (view, _args, ctx) => metadataFor(view as FragmentView, ctx),
      _tags: (view) => (view as FragmentView).fragment.tags,
    };
    for (const field of model.fields) {
      fieldResolvers[field.name] = (view, _args, ctx) => resolveModelField(view as FragmentView, field, ctx);
    }
    setResolvers(schema, typeName, fieldResolvers);
    setResolvers(schema, `${typeName}Result`, {
      _references: (parent, _args, ctx) => collectReferences(ctx.store, [(parent as { item: FragmentView | null }).item]),
    });
    setResolvers(schema, `${typeName}Results`, {
      _references: (parent, _args, ctx) => collectReferences(ctx.store, (parent as { items: FragmentView[] }).items),
    });
  }
  setResolvers(schema, "Query", query);

  const assetResolvers: Record<string, Resolver> = {
    _path: (ref) => (ref as AssetView).asset.path,
    _authorUrl: (ref, _args, ctx) => `${ctx.origins.author}${(ref as AssetView).asset.path}`,
    _publishUrl: (ref, _args, ctx) => `${ctx.origins.publish}${(ref as AssetView).asset.path}`,
  };
  setResolvers(schema, "ImageRef", {
    ...assetResolvers,
    _dynamicUrl: (ref) => dynamicUrl((ref as AssetView).asset, (ref as AssetView).scope.transform),
    mimeType: (ref) => (ref as AssetView).asset.mimeType,
    width: (ref) => (ref as AssetView).asset.width ?? null,
    height: (ref) => (ref as AssetView).asset.height ?? null,
  });
  for (const typeName of ["DocumentRef", "MultimediaRef", "ArchiveRef"]) {
    setResolvers(schema, typeName, {
      ...assetResolvers,
      format: (ref) => (ref as AssetView).asset.mimeType,
      size: (ref) => (ref as AssetView).asset.size,
    });
  }

  setResolvers(schema, "MultiFormatString", {
    html: (value) => richTextFormats.html(value as RichText),
    plaintext: (value) => richTextFormats.plaintext(value as RichText),
    markdown: (value) => richTextFormats.markdown(value as RichText),
    json: (value) => richTextFormats.json(value as RichText),
  });

  const resolveType = (value: unknown) => {
    const ref = value as ReferenceView;
    return ref.kind === "asset" ? assetTypeName(ref.asset) : typeNameFor(ref.fragment.model);
  };
  (schema.getType("Reference") as GraphQLUnionType).resolveType = resolveType;
  (schema.getType("AllFragmentModels") as GraphQLUnionType).resolveType = resolveType;

  return schema;
}

function formatError(error: GraphQLError, classification: FormattedError["extensions"]["classification"]): FormattedError {
  return {
    message: error.message,
    ...(error.locations ? { locations: error.locations } : {}),
    ...(error.path ? { path: error.path } : {}),
    extensions: { classification },
  };
}

export async function runGraphQL(schema: GraphQLSchema, request: GraphQLRequest, ctx: RequestContext): Promise<GraphQLResponse> {
  if (typeof request.query !== "string" || !request.query.trim()) {
    return { errors: [{ message: "Missing query", extensions: { classification: "InvalidSyntax" } }] };
  }
  let document;
  try {
    document = parse(request.query);
  } catch (error) {
    return { errors: [formatError(error as GraphQLError, "InvalidSyntax")] };
  }
  const validationErrors = validate(schema, document);
  if (validationErrors.length > 0) {
    return { errors: validationErrors.map((error) => formatError(error, "ValidationError")) };
  }
  const result = await execute({
    schema,
    document,
    variableValues: request.variables ?? undefined,
    operationName: request.operationName ?? undefined,
    contextValue: ctx,
  });
  if (!result.errors) return { data: result.data };
  // No data at all means the request was rejected before execution (e.g. bad variables).
  const classification = result.data === undefined ? "ValidationError" : "DataFetchingException";
  return { errors: result.errors.map((error) => formatError(error, classification)), data: result.data };
}

/**
 * Persisted query variables arrive as strings in the URL (;name=value). AEM coerces them using
 * the variable definitions of the stored query — numbers, booleans and JSON for objects/lists.
 */
export function coerceMatrixVariables(schema: GraphQLSchema, query: string, raw: Record<string, string>): Record<string, unknown> {
  const operation = getOperationAST(parse(query));
  const variables: Record<string, unknown> = {};
  for (const definition of operation?.variableDefinitions ?? []) {
    const name = definition.variable.name.value;
    if (!(name in raw)) continue;
    const value = raw[name];
    const type = typeFromAST(schema, definition.type as never);
    const nullable = type ? getNullableType(type) : undefined;
    if (nullable && (isListType(nullable) || isInputObjectType(nullable))) {
      try {
        variables[name] = JSON.parse(value);
      } catch {
        variables[name] = value;
      }
      continue;
    }
    const scalar = nullable ? getNamedType(nullable).name : "String";
    if (scalar === "Int" || scalar === "Float") variables[name] = value.trim() === "" ? value : Number(value);
    else if (scalar === "Boolean") variables[name] = value === "true" ? true : value === "false" ? false : value;
    else variables[name] = value;
  }
  return variables;
}
