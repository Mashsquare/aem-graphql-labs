import { todo } from "@/lib/todo";
import type { ModelNode } from "@/lib/aem/page-model";

/**
 * Task 2 — the children of a container, in the order the author arranged them.
 *
 * `:items` is an object keyed by node name; its key order is NOT the author's order — `:itemsOrder` is.
 *   - follow `:itemsOrder`; skip names that are not in `:items` (a stale order list must not crash the page)
 *   - items that are in `:items` but not in `:itemsOrder` are not part of the container: ignore them
 *   - no `:itemsOrder` but `:items`: use the key order of `:items`
 *   - neither: an empty array
 */
export function childrenOf(model: ModelNode): { key: string; model: ModelNode }[] {
  void model;
  return todo("implement childrenOf in model.ts");
}

/**
 * Task 4a — find the node whose `:path` equals `cqPath` (e.g. ".../featured/jcr:content/root/container/title"),
 * searching `root` and everything below it through `:items`. undefined when there is none.
 */
export function findByPath(root: ModelNode, cqPath: string): ModelNode | undefined {
  void root;
  void cqPath;
  return todo("implement findByPath in model.ts");
}

/**
 * Task 4b — the page editor tells the front end "the component at <cqPath> changed" and sends that
 * component's new model. Return a NEW page model with that node replaced. Do not mutate the input.
 *
 * Structural sharing: only the ancestors of the replaced node are copied; every other branch keeps its
 * object identity (that is what lets React skip re-rendering them). If nothing matches, return `root` itself.
 */
export function applyUpdate(root: ModelNode, cqPath: string, replacement: ModelNode): ModelNode {
  void root;
  void cqPath;
  void replacement;
  return todo("implement applyUpdate in model.ts");
}
