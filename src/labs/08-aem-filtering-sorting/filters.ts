import type { AdventureModelFilter } from "@/lib/aem/filter-types";
import { todo } from "@/lib/todo";
import type { AdventureSearchCriteria, AdventureSortKey } from "./types";

/**
 * Task 1 — translate the search form into an AEM filter object.
 *
 * Rules (only add a key when the criterion is set):
 *   search         -> title CONTAINS search, case-insensitive
 *   activities     -> activity EQUALS any of them  (one field, several expressions, _logOp OR)
 *   difficulty     -> difficulty EQUALS
 *   maxPrice       -> price LOWER_EQUAL            (numbers: EQUAL/LOWER_EQUAL/…, not EQUALS!)
 *   minGroupSize   -> groupSize GREATER_EQUAL
 *   country        -> location.country EQUALS     (nested filter on a fragment reference)
 *   departureAfter -> departureDate AT_OR_AFTER
 */
export function buildAdventureFilter(criteria: AdventureSearchCriteria): AdventureModelFilter {
  void criteria;

  const filter: AdventureModelFilter = {};
  if(criteria.search?.trim()){
    filter.title = {_expressions: [{value: criteria.search.trim(), _operator: "CONTAINS", _ignoreCase: true}]};
  }
  if(criteria.activities.length){
    filter.activity = {
      _logOp: "OR", 
      _expressions: criteria.activities.map(value=> ({value}))
  }
}
if(criteria.difficulty?.trim()){
  filter.difficulty = {_expressions: [{value: criteria.difficulty}]};
}
if(criteria.maxPrice){
  filter.price = {_expressions: [{value: criteria.maxPrice, _operator:"LOWER_EQUAL"}]};
}
if(criteria.minGroupSize){
  filter.groupSize = {_expressions:[{value: criteria.minGroupSize, _operator:"GREATER_EQUAL"}]};
}
 if (criteria.country) {
    filter.location = { country: { _expressions: [{ value: criteria.country }] } };
  }
if(criteria.departureAfter?.trim()){
  filter.departureDate = {_expressions:[{value: criteria.departureAfter, _operator:"AT_OR_AFTER"}]};
}
  return filter;
}

/**
 * Task 2 — AEM sorts with a string: "field [ASC|DESC], field2 [ASC|DESC]".
 *   title      -> "title ASC"
 *   price-asc  -> "price ASC, title ASC"
 *   price-desc -> "price DESC, title ASC"
 *   departure  -> "departureDate ASC"
 */


const SORTS: Record<AdventureSortKey, string> = {
  title: "title ASC",
  // A secondary key makes the order stable when prices are equal.
  "price-asc": "price ASC, title ASC",
  "price-desc": "price DESC, title ASC",
  departure: "departureDate ASC",
};

export function buildSort(key: AdventureSortKey): string {
  return SORTS[key];
}
