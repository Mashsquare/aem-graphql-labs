import { createElement } from "react";
import type { ErrorHandler, IslandHost, MountedIsland, MountFn, Registry } from "@/labs/16-htl-react-islands/types";
import { readProps } from "./props";

const SELECTOR = "[data-react-component]:not([data-react-mounted])";

export function mountIslands(host: IslandHost, registry: Registry, mount: MountFn, onError: ErrorHandler = () => {}): MountedIsland[] {
  const mounted: MountedIsland[] = [];
  // Snapshot first: a live NodeList would change while we set attributes.
  for (const element of Array.from(host.querySelectorAll(SELECTOR))) {
    const name = element.dataset.reactComponent ?? "";
    // hasOwn, not `registry[name]`: "constructor" and "toString" exist on every object.
    if (!Object.hasOwn(registry, name)) {
      onError(new Error(`No React component registered for "${name}"`), element);
      continue;
    }
    try {
      const props = readProps(element, (id) => host.getElementById(id)?.textContent ?? null);
      const root = mount(element, createElement(registry[name], props));
      element.dataset.reactMounted = "true";
      mounted.push({
        name,
        element,
        props,
        unmount() {
          root.unmount();
          delete element.dataset.reactMounted;
        },
      });
    } catch (error) {
      onError(error as Error, element);
    }
  }
  return mounted;
}
