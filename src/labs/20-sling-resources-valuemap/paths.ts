import { todo } from "@/lib/todo";

/**
 * Task 2 — repository paths.
 *
 * `normalizePath("/content//wknd/./us/../us/en/")` -> `"/content/wknd/us/en"`
 *   - empty segments (`//`) and `.` disappear, `..` removes the previous segment
 *   - no trailing slash, except the root itself: `"/"`
 *   - `null` when the path is not absolute (no leading `/`) or `..` would climb above the root
 *   - node names like `jcr:content` are ordinary segments
 */
export function normalizePath(path: string): string | null {
  void path;
  return todo("implement normalizePath");
}

/** `/a/b` -> `/a`, `/a` -> `/`, `/` -> `null` (the input is normalised first; invalid input -> `null`). */
export function getParentPath(path: string): string | null {
  void path;
  return todo("implement getParentPath");
}

/**
 * Resolve `relative` against `base`. An absolute `relative` ignores `base`.
 * `resolvePath("/content/wknd", "us/../fr")` -> `"/content/wknd/fr"`. Invalid result -> `null`.
 */
export function resolvePath(base: string, relative: string): string | null {
  void base;
  void relative;
  return todo("implement resolvePath");
}
