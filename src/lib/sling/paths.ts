/**
 * Repository path helpers (the part of `org.apache.sling.api.resource.ResourceUtil` you use daily).
 * Paths are absolute, `/`-separated; node names may contain `:` (`jcr:content`).
 */

/**
 * Canonical form of an absolute path: `//` and `.` collapse, `..` goes up, no trailing slash
 * (except the root `/`). Returns `null` when the input is not absolute or `..` climbs above the root.
 *
 *   normalizePath("/content//wknd/./us/../us/en/") === "/content/wknd/us/en"
 */
export function normalizePath(path: string): string | null {
  if (!path.startsWith("/")) return null;
  const out: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (out.length === 0) return null;
      out.pop();
    } else {
      out.push(segment);
    }
  }
  return "/" + out.join("/");
}

/** `/a/b` -> `/a`, `/a` -> `/`, `/` -> null. The input is normalised first. */
export function getParentPath(path: string): string | null {
  const normal = normalizePath(path);
  if (normal === null || normal === "/") return null;
  const index = normal.lastIndexOf("/");
  return index === 0 ? "/" : normal.slice(0, index);
}

/** Absolute `relative` wins; otherwise it is resolved against `base`. `null` when the result is invalid. */
export function resolvePath(base: string, relative: string): string | null {
  return normalizePath(relative.startsWith("/") ? relative : `${base}/${relative}`);
}
