/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AdventureModelFilter = {
  _path?: IdFilter | null | undefined;
  _variation?: StringFilter | null | undefined;
  activity?: StringFilter | null | undefined;
  adventureType?: StringFilter | null | undefined;
  departureDate?: DateFilter | null | undefined;
  description?: StringFilter | null | undefined;
  difficulty?: StringFilter | null | undefined;
  featured?: BooleanFilter | null | undefined;
  gallery?: StringArrayFilter | null | undefined;
  gearList?: StringFilter | null | undefined;
  groupSize?: IntFilter | null | undefined;
  itinerary?: StringFilter | null | undefined;
  location?: LocationModelFilter | null | undefined;
  price?: FloatFilter | null | undefined;
  primaryImage?: StringFilter | null | undefined;
  slug?: StringFilter | null | undefined;
  tags?: StringArrayFilter | null | undefined;
  title?: StringFilter | null | undefined;
  trailMap?: StringFilter | null | undefined;
  tripLength?: StringFilter | null | undefined;
};

export type ArrayMode =
  /** Every element must match and the array must not be empty. */
  | 'ALL'
  /** Every element must match, or the array is empty. */
  | 'ALL_OR_EMPTY'
  /** At least one array element must match (default). */
  | 'AT_LEAST_ONCE';

export type BooleanFilter = {
  _expressions: Array<BooleanFilterExpression | null | undefined>;
  _logOp?: LogOp | null | undefined;
};

export type BooleanFilterExpression = {
  _operator?: BooleanOperator | null | undefined;
  value?: boolean | null | undefined;
};

export type BooleanOperator =
  | 'EQUALS';

export type CalendarOperator =
  | 'AFTER'
  | 'AT'
  | 'AT_OR_AFTER'
  | 'AT_OR_BEFORE'
  | 'BEFORE'
  | 'NOT_AT';

export type DateFilter = {
  _expressions: Array<DateFilterExpression | null | undefined>;
  _logOp?: LogOp | null | undefined;
};

export type DateFilterExpression = {
  _operator?: CalendarOperator | null | undefined;
  value?: string | null | undefined;
};

export type FloatFilter = {
  _expressions: Array<FloatFilterExpression | null | undefined>;
  _logOp?: LogOp | null | undefined;
};

export type FloatFilterExpression = {
  _operator?: FloatOperator | null | undefined;
  _sensitiveness?: number | null | undefined;
  value?: number | null | undefined;
};

/** Note: numbers use EQUAL/UNEQUAL — not EQUALS like strings. */
export type FloatOperator =
  | 'EQUAL'
  | 'GREATER'
  | 'GREATER_EQUAL'
  | 'LOWER'
  | 'LOWER_EQUAL'
  | 'UNEQUAL';

export type IdFilter = {
  _expressions: Array<IdFilterExpression | null | undefined>;
  _logOp?: LogOp | null | undefined;
};

export type IdFilterExpression = {
  _ignoreCase?: boolean | null | undefined;
  _operator?: IdOperator | null | undefined;
  value?: string | number | null | undefined;
};

export type IdOperator =
  | 'EQUALS'
  | 'EQUALS_NOT'
  | 'STARTS_WITH';

export type IntFilter = {
  _expressions: Array<IntFilterExpression | null | undefined>;
  _logOp?: LogOp | null | undefined;
};

export type IntFilterExpression = {
  _operator?: IntOperator | null | undefined;
  value?: number | null | undefined;
};

/** Note: numbers use EQUAL/UNEQUAL — not EQUALS like strings. */
export type IntOperator =
  | 'EQUAL'
  | 'GREATER'
  | 'GREATER_EQUAL'
  | 'LOWER'
  | 'LOWER_EQUAL'
  | 'UNEQUAL';

export type LocationModelFilter = {
  _path?: IdFilter | null | undefined;
  _variation?: StringFilter | null | undefined;
  city?: StringFilter | null | undefined;
  country?: StringFilter | null | undefined;
  countryCode?: StringFilter | null | undefined;
  name?: StringFilter | null | undefined;
  region?: StringFilter | null | undefined;
};

export type LogOp =
  | 'AND'
  | 'OR';

export type StringArrayFilter = {
  _expressions: Array<StringArrayFilterExpression | null | undefined>;
  _logOp?: LogOp | null | undefined;
};

export type StringArrayFilterExpression = {
  _apply?: ArrayMode | null | undefined;
  _ignoreCase?: boolean | null | undefined;
  _operator?: StringOperator | null | undefined;
  value?: string | null | undefined;
  /** Matches when the array equals exactly these values (order does not matter). */
  values?: Array<string | null | undefined> | null | undefined;
};

export type StringFilter = {
  _expressions: Array<StringFilterExpression | null | undefined>;
  _logOp?: LogOp | null | undefined;
};

export type StringFilterExpression = {
  _ignoreCase?: boolean | null | undefined;
  _operator?: StringOperator | null | undefined;
  value?: string | null | undefined;
};

export type StringOperator =
  | 'CONTAINS'
  | 'CONTAINS_NOT'
  | 'EQUALS'
  | 'EQUALS_NOT';

export type AdventureTeaserFragment = { _path: string, title: string | null, slug: string | null, activity: string | null, difficulty: string | null, price: number | null, tripLength: string | null, primaryImage:
    | { __typename: 'AdventureModel' }
    | { __typename: 'ArchiveRef' }
    | { __typename: 'ArticleModel' }
    | { __typename: 'AuthorModel' }
    | { __typename: 'DocumentRef' }
    | { __typename: 'ImageRef', _dynamicUrl: string | null, width: number | null, height: number | null }
    | { __typename: 'LocationModel' }
    | { __typename: 'MultimediaRef' }
   | null } & { ' $fragmentName'?: 'AdventureTeaserFragment' };

export type AdventureTeasersQueryVariables = Exact<{
  filter?: AdventureModelFilter | null | undefined;
  locale?: string | null | undefined;
}>;


export type AdventureTeasersQuery = { adventureList: { items: Array<{ ' $fragmentRefs'?: { 'AdventureTeaserFragment': AdventureTeaserFragment } } | null> } };

export const AdventureTeaserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdventureTeaser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdventureModel"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_path"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"activity"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"tripLength"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRef"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_dynamicUrl"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}}]}}]} as unknown as DocumentNode<AdventureTeaserFragment, unknown>;
export const AdventureTeasersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdventureTeasers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AdventureModelFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"locale"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":{"kind":"StringValue","value":"en","block":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adventureList"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"_locale"},"value":{"kind":"Variable","name":{"kind":"Name","value":"locale"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"StringValue","value":"title ASC","block":false}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdventureTeaser"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdventureTeaser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdventureModel"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_path"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"slug"}},{"kind":"Field","name":{"kind":"Name","value":"activity"}},{"kind":"Field","name":{"kind":"Name","value":"difficulty"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"tripLength"}},{"kind":"Field","name":{"kind":"Name","value":"primaryImage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageRef"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_dynamicUrl"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}}]}}]}}]}}]} as unknown as DocumentNode<AdventureTeasersQuery, AdventureTeasersQueryVariables>;