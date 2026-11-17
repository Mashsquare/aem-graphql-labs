/**
 * Hand-written TypeScript for AEM's filter grammar (Lab 06 shows how to generate these instead).
 *
 *   filter: { price: { _logOp: AND, _expressions: [{ value: 2000, _operator: LOWER_EQUAL }] } }
 */

export type LogOp = "AND" | "OR";
export type ArrayMode = "AT_LEAST_ONCE" | "ALL" | "ALL_OR_EMPTY";

export type StringOperator = "EQUALS" | "EQUALS_NOT" | "CONTAINS" | "CONTAINS_NOT";
export type IDOperator = "EQUALS" | "EQUALS_NOT" | "STARTS_WITH";
/** Numbers use EQUAL / UNEQUAL — not EQUALS like strings. */
export type NumberOperator = "EQUAL" | "UNEQUAL" | "GREATER" | "GREATER_EQUAL" | "LOWER" | "LOWER_EQUAL";
export type CalendarOperator = "AT" | "NOT_AT" | "BEFORE" | "AT_OR_BEFORE" | "AFTER" | "AT_OR_AFTER";

export interface Filter<TExpression> {
  _logOp?: LogOp;
  _expressions: TExpression[];
}

export type StringFilter = Filter<{ value?: string | null; _operator?: StringOperator; _ignoreCase?: boolean }>;
export type IDFilter = Filter<{ value?: string | null; _operator?: IDOperator; _ignoreCase?: boolean }>;
export type IntFilter = Filter<{ value?: number | null; _operator?: NumberOperator }>;
export type FloatFilter = Filter<{ value?: number | null; _operator?: NumberOperator; _sensitiveness?: number }>;
export type BooleanFilter = Filter<{ value?: boolean | null; _operator?: "EQUALS" }>;
export type DateFilter = Filter<{ value?: string | null; _operator?: CalendarOperator }>;
export type StringArrayFilter = Filter<{
  value?: string | null;
  values?: string[];
  _operator?: StringOperator;
  _ignoreCase?: boolean;
  _apply?: ArrayMode;
}>;

export interface LocationModelFilter {
  _path?: IDFilter;
  name?: StringFilter;
  city?: StringFilter;
  country?: StringFilter;
  countryCode?: StringFilter;
  region?: StringFilter;
}

export interface AdventureModelFilter {
  _path?: IDFilter;
  _variation?: StringFilter;
  title?: StringFilter;
  slug?: StringFilter;
  description?: StringFilter;
  adventureType?: StringFilter;
  tripLength?: StringFilter;
  activity?: StringFilter;
  groupSize?: IntFilter;
  difficulty?: StringFilter;
  price?: FloatFilter;
  departureDate?: DateFilter;
  featured?: BooleanFilter;
  tags?: StringArrayFilter;
  /** Single fragment reference: nest the referenced model's filter. */
  location?: LocationModelFilter;
}
