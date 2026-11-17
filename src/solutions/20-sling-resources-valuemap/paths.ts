export function normalizePath(path: string): string | null {
  if (!path.startsWith("/")) return null;
  const out: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (out.length === 0) return null; // above the root
      out.pop();
    } else {
      out.push(segment);
    }
  }
  return "/" + out.join("/");
}

export function getParentPath(path: string): string | null {
  const normal = normalizePath(path);
  if (normal === null || normal === "/") return null;
  const index = normal.lastIndexOf("/");
  return index === 0 ? "/" : normal.slice(0, index);
}

export function resolvePath(base: string, relative: string): string | null {
  return normalizePath(relative.startsWith("/") ? relative : `${base}/${relative}`);
}
