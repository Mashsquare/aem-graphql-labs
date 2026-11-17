import { todo } from "@/lib/todo";

/**
 * Task 4 — authors type URLs into dialog fields. Before you put one in an `href`, make sure it cannot
 * run script. React escapes text, but it does NOT block `href="javascript:..."`.
 *
 * Return the trimmed value when it is
 *   - relative: starts with "/", "#" or "?" (and is not a scheme in disguise),
 *   - or uses http:, https:, mailto: or tel:
 * and `undefined` for everything else: javascript:, data:, vbscript:, non-strings, empty strings...
 *
 * Browsers ignore tabs, newlines and control characters inside a scheme, so "java\tscript:alert(1)" and
 * "  JavaScript:alert(1)" must be rejected too. (Remove them before you look at the scheme.)
 */
export function safeHref(value: unknown): string | undefined {
  void value;
  return todo("implement safeHref in links.ts");
}
