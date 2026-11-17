import { todo } from "@/lib/todo";
import type { ErrorHandler, IslandHost, MountedIsland, MountFn, Registry } from "./types";

/**
 * Task 2 — find every `[data-react-component]` that is not mounted yet and mount the registered
 * React component on it with the props from `readProps`.
 *
 *  1. Select with "[data-react-component]:not([data-react-mounted])".
 *  2. Look the name up in `registry` — with Object.hasOwn: a page with data-react-component="constructor"
 *     must not find Object.prototype.constructor. Unknown name -> `onError(new Error(...), element)`, continue.
 *  3. `readProps(element, id => host.getElementById(id)?.textContent ?? null)`. A PropsError goes to `onError`, continue.
 *  4. `mount(element, <Component {...props} />)` (use createElement — this is a .ts file), then set
 *     `element.dataset.reactMounted = "true"` so a second call does not mount it twice.
 *  5. Return one MountedIsland per mounted element; its `unmount()` unmounts the React root AND clears the flag.
 *
 * One broken component must never stop the others: a page has many authored components.
 */
export function mountIslands(host: IslandHost, registry: Registry, mount: MountFn, onError: ErrorHandler = () => {}): MountedIsland[] {
  void host;
  void registry;
  void mount;
  void onError;
  return todo("implement mountIslands in islands.ts");
}
