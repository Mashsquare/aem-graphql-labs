import type { AdventureModelFilter } from "@/lib/aem/filter-types";
import type { AdventureSearchCriteria, AdventureSortKey } from "@/labs/08-aem-filtering-sorting/types";

export function buildAdventureFilter(criteria: AdventureSearchCriteria): AdventureModelFilter {
  const filter: AdventureModelFilter = {};

  if (criteria.search?.trim()) {
    filter.title = { _expressions: [{ value: criteria.search.trim(), _operator: "CONTAINS", _ignoreCase: true }] };
  }
  if (criteria.activities.length) {
    // Several expressions on ONE field, combined with OR. (Different fields are always ANDed.)
    filter.activity = { _logOp: "OR", _expressions: criteria.activities.map((value) => ({ value })) };
  }
  if (criteria.difficulty) {
    // _operator defaults to EQUALS for strings.
    filter.difficulty = { _expressions: [{ value: criteria.difficulty }] };
  }
  if (criteria.maxPrice !== undefined) {
    filter.price = { _expressions: [{ value: criteria.maxPrice, _operator: "LOWER_EQUAL" }] };
  }
  if (criteria.minGroupSize !== undefined) {
    filter.groupSize = { _expressions: [{ value: criteria.minGroupSize, _operator: "GREATER_EQUAL" }] };
  }
  if (criteria.country) {
    // `location` is a fragment reference: nest the LocationModel filter.
    filter.location = { country: { _expressions: [{ value: criteria.country }] } };
  }
  if (criteria.departureAfter) {
    filter.departureDate = { _expressions: [{ value: criteria.departureAfter, _operator: "AT_OR_AFTER" }] };
  }
  return filter;
}

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
