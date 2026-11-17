import { GraphQLError } from "graphql";
import type { FieldDefinition, ModelDefinition } from "./types";
import { getField, getModel } from "./models";
import { isRichText, richTextFormats } from "./richtext";
import type { MockAemStore } from "./store";
import { resolveAssetPath, resolveFragmentPath, type FragmentView } from "./views";

/**
 * The filtering, sorting and paging semantics of AEM's Content Fragment GraphQL API.
 *
 *   filter: { price: { _logOp: AND, _expressions: [{ value: 1000, _operator: GREATER_EQUAL }] } }
 *
 * - Conditions on different fields are always combined with AND.
 * - `_logOp` (default AND) combines the expressions of ONE field.
 * - `_operator` defaults to EQUALS (strings/booleans), EQUAL (numbers) or AT (dates).
 * - Array fields use `_apply` (default AT_LEAST_ONCE) or `values` for an exact match.
 * - Fragment references are filtered by nesting the referenced model's filter; multi-value
 *   references use `{ _match: {...}, _apply: ALL | AT_LEAST_ONCE | ALL_OR_EMPTY }`.
 */

type Expression = {
  value?: unknown;
  values?: unknown[];
  _operator?: string;
  _ignoreCase?: boolean;
  _sensitiveness?: number;
  _apply?: "AT_LEAST_ONCE" | "ALL" | "ALL_OR_EMPTY";
};

type ScalarFilter = { _logOp?: "AND" | "OR"; _expressions: Expression[] };
type ArrayRefFilter = { _match?: Record<string, unknown>; _apply?: Expression["_apply"] };
export type ModelFilter = Record<string, unknown>;

type ValueKind = "string" | "id" | "number" | "boolean" | "date" | "time" | "calendar";

function compareScalar(kind: ValueKind, actual: unknown, expression: Expression): boolean {
  const expected = expression.value;
  const operator = expression._operator;

  if (kind === "string" || kind === "id") {
    if (actual === null || actual === undefined) {
      return operator === "EQUALS_NOT" || operator === "CONTAINS_NOT" ? expected !== null : expected === null || expected === undefined;
    }
    let a = String(actual);
    let b = expected === null || expected === undefined ? "" : String(expected);
    if (expression._ignoreCase) {
      a = a.toLowerCase();
      b = b.toLowerCase();
    }
    switch (operator ?? "EQUALS") {
      case "EQUALS":
        return a === b;
      case "EQUALS_NOT":
        return a !== b;
      case "CONTAINS":
        return a.includes(b);
      case "CONTAINS_NOT":
        return !a.includes(b);
      case "STARTS_WITH":
        return a.startsWith(b);
      default:
        throw new GraphQLError(`Unsupported operator ${operator} for String`);
    }
  }

  if (kind === "boolean") return actual === expected;

  if (kind === "number") {
    if (typeof actual !== "number" || typeof expected !== "number") return operator === "UNEQUAL";
    const tolerance = expression._sensitiveness ?? 0;
    switch (operator ?? "EQUAL") {
      case "EQUAL":
        return Math.abs(actual - expected) <= tolerance;
      case "UNEQUAL":
        return Math.abs(actual - expected) > tolerance;
      case "GREATER":
        return actual > expected;
      case "GREATER_EQUAL":
        return actual >= expected;
      case "LOWER":
        return actual < expected;
      case "LOWER_EQUAL":
        return actual <= expected;
      default:
        throw new GraphQLError(`Unsupported operator ${operator} for numbers`);
    }
  }

  // Dates, times and calendars
  if (typeof actual !== "string" || typeof expected !== "string") return operator === "NOT_AT";
  const toComparable = (value: string) => (kind === "time" ? value : Date.parse(value));
  const a = toComparable(actual);
  const b = toComparable(expected);
  if (typeof a === "number" && Number.isNaN(a)) return false;
  if (typeof b === "number" && Number.isNaN(b)) throw new GraphQLError(`Invalid date value "${expected}"`);
  switch (operator ?? "AT") {
    case "AT":
      return a === b;
    case "NOT_AT":
      return a !== b;
    case "BEFORE":
      return a < b;
    case "AT_OR_BEFORE":
      return a <= b;
    case "AFTER":
      return a > b;
    case "AT_OR_AFTER":
      return a >= b;
    default:
      throw new GraphQLError(`Unsupported operator ${operator} for dates`);
  }
}

function combine(filter: ScalarFilter, test: (expression: Expression) => boolean): boolean {
  const expressions = filter._expressions ?? [];
  if (expressions.length === 0) return true;
  return filter._logOp === "OR" ? expressions.some(test) : expressions.every(test);
}

function matchesArray(values: unknown[], expression: Expression, test: (value: unknown) => boolean): boolean {
  if (expression.values) {
    const expected = expression.values.map(String).sort();
    const actual = values.map(String).sort();
    return expected.length === actual.length && expected.every((value, index) => value === actual[index]);
  }
  switch (expression._apply ?? "AT_LEAST_ONCE") {
    case "ALL":
      return values.length > 0 && values.every(test);
    case "ALL_OR_EMPTY":
      return values.every(test);
    default:
      return values.some(test);
  }
}

function kindOf(field: FieldDefinition): ValueKind {
  switch (field.type) {
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date-time":
      return field.flavor === "date" ? "date" : field.flavor === "time" ? "time" : "calendar";
    default:
      return "string";
  }
}

export function matchesFilter(store: MockAemStore, view: FragmentView, model: ModelDefinition, filter: ModelFilter | null | undefined): boolean {
  if (!filter) return true;
  for (const [key, condition] of Object.entries(filter)) {
    if (condition === null || condition === undefined) continue;

    if (key === "_path" || key === "_variation") {
      const actual = key === "_path" ? view.fragment.path : view.variation;
      const kind: ValueKind = key === "_path" ? "id" : "string";
      if (!combine(condition as ScalarFilter, (expression) => compareScalar(kind, actual, expression))) return false;
      continue;
    }

    const field = getField(model, key);
    if (!field) throw new GraphQLError(`Unknown filter field "${key}" on ${model.title}`);
    const raw = view.values[field.name];

    if (field.type === "fragment-reference") {
      const targetModel = getModel(field.models[0]);
      if (field.multiple) {
        const arrayFilter = condition as ArrayRefFilter;
        const referenced = (Array.isArray(raw) ? raw : [])
          .map((path) => resolveFragmentPath(store, path, view.scope))
          .filter((ref): ref is FragmentView => ref !== null);
        const test = (ref: unknown) => matchesFilter(store, ref as FragmentView, targetModel, arrayFilter._match);
        if (!matchesArray(referenced, { _apply: arrayFilter._apply }, test)) return false;
      } else {
        const referenced = resolveFragmentPath(store, raw, view.scope);
        if (!referenced || !matchesFilter(store, referenced, targetModel, condition as ModelFilter)) return false;
      }
      continue;
    }

    const value = field.type === "multi-line-text" && isRichText(raw) ? richTextFormats.plaintext(raw) : raw;
    const kind = kindOf(field);
    const isArray = field.type === "tags" || ("multiple" in field && field.multiple === true);
    const ok = combine(condition as ScalarFilter, (expression) =>
      isArray
        ? matchesArray(Array.isArray(value) ? value : [], expression, (element) => compareScalar(kind, element, expression))
        : compareScalar(kind, value, expression),
    );
    if (!ok) return false;
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/* Sorting: sort: "price DESC, title" — nested: "location.country"             */
/* -------------------------------------------------------------------------- */

interface SortKey {
  path: string[];
  direction: 1 | -1;
}

const SORTABLE = new Set(["single-line-text", "number", "boolean", "date-time", "enumeration"]);

export function parseSort(sort: string | null | undefined, model: ModelDefinition): SortKey[] {
  if (!sort?.trim()) return [];
  return sort.split(",").map((part) => {
    const [fieldPath, rawDirection, ...rest] = part.trim().split(/\s+/);
    const direction = (rawDirection ?? "ASC").toUpperCase();
    if (rest.length || (direction !== "ASC" && direction !== "DESC")) {
      throw new GraphQLError(`Invalid sort expression "${part.trim()}". Use "<field> [ASC|DESC]".`);
    }
    const segments = fieldPath.split(".");
    let current = model;
    segments.forEach((segment, index) => {
      if (segment === "_path" && index === segments.length - 1) return;
      const field = getField(current, segment);
      const last = index === segments.length - 1;
      if (!field) throw new GraphQLError(`Cannot sort by "${fieldPath}": field "${segment}" does not exist on ${current.title}.`);
      if (!last) {
        if (field.type !== "fragment-reference" || field.multiple || field.models.length !== 1) {
          throw new GraphQLError(`Cannot sort by "${fieldPath}": "${segment}" is not a single fragment reference.`);
        }
        current = getModel(field.models[0]);
      } else if (!SORTABLE.has(field.type) || ("multiple" in field && field.multiple)) {
        throw new GraphQLError(`Cannot sort by "${fieldPath}": ${field.type} fields are not sortable.`);
      }
    });
    return { path: segments, direction: direction === "DESC" ? -1 : 1 };
  });
}

function sortValue(store: MockAemStore, view: FragmentView | null, path: string[]): unknown {
  if (!view) return null;
  const [head, ...tail] = path;
  if (head === "_path") return view.fragment.path;
  const value = view.values[head];
  if (tail.length === 0) return value;
  return sortValue(store, resolveFragmentPath(store, value, view.scope), tail);
}

export function sortViews(store: MockAemStore, views: FragmentView[], keys: SortKey[]): FragmentView[] {
  const collator = new Intl.Collator("en", { sensitivity: "base" });
  return [...views].sort((left, right) => {
    for (const key of keys) {
      const a = sortValue(store, left, key.path);
      const b = sortValue(store, right, key.path);
      if (a === b) continue;
      // Empty values always go last.
      if (a === null || a === undefined) return 1;
      if (b === null || b === undefined) return -1;
      const result =
        typeof a === "number" && typeof b === "number"
          ? a - b
          : typeof a === "boolean" && typeof b === "boolean"
            ? Number(a) - Number(b)
            : collator.compare(String(a), String(b));
      if (result !== 0) return result * key.direction;
    }
    // Stable default order: repository path, master before variations.
    const byPath = left.fragment.path.localeCompare(right.fragment.path);
    if (byPath !== 0) return byPath;
    if (left.variation === "master") return -1;
    if (right.variation === "master") return 1;
    return left.variation.localeCompare(right.variation);
  });
}

/* -------------------------------------------------------------------------- */
/* Cursors                                                                     */
/* -------------------------------------------------------------------------- */

export const encodeCursor = (index: number, view: FragmentView) =>
  Buffer.from(JSON.stringify({ i: index, p: view.fragment.path, v: view.variation })).toString("base64url");

export function decodeCursor(cursor: string): number {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { i?: unknown };
    if (typeof decoded.i === "number") return decoded.i;
  } catch {
    // fall through
  }
  throw new GraphQLError(`Invalid cursor "${cursor}". Use the endCursor value from pageInfo.`);
}

/* -------------------------------------------------------------------------- */
/* _references                                                                 */
/* -------------------------------------------------------------------------- */

export function collectReferences(store: MockAemStore, views: (FragmentView | null)[]) {
  const seen = new Set<string>();
  const result: (FragmentView | ReturnType<typeof resolveAssetPath>)[] = [];
  const add = (key: string, value: FragmentView | ReturnType<typeof resolveAssetPath>) => {
    if (!value || seen.has(key)) return;
    seen.add(key);
    result.push(value);
  };

  for (const view of views) {
    if (!view) continue;
    const model = getModel(view.fragment.model);
    for (const field of model.fields) {
      const raw = view.values[field.name];
      const values = Array.isArray(raw) ? raw : [raw];
      if (field.type === "content-reference") {
        for (const path of values) add(`asset:${path}`, resolveAssetPath(store, path, view.scope));
      } else if (field.type === "fragment-reference") {
        for (const path of values) add(`fragment:${path}`, resolveFragmentPath(store, path, view.scope));
      } else if (field.type === "multi-line-text" && isRichText(raw)) {
        const visit = (nodes: typeof raw.nodes) => {
          for (const node of nodes) {
            if (node.nodeType === "reference") {
              if ("path" in node.data) add(`asset:${node.data.path}`, resolveAssetPath(store, node.data.path, view.scope));
              else add(`fragment:${node.data.href}`, resolveFragmentPath(store, node.data.href, view.scope));
            }
            if ("content" in node) visit(node.content);
          }
        };
        visit(raw.nodes);
      }
    }
  }
  return result;
}
