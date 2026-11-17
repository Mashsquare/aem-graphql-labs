import fs from "node:fs";
import path from "node:path";

export type LabModule = "labs" | "solutions";

// turbopackIgnore: these reads only serve the training UI; don't trace the whole project for deployment.
export function labFilePath(module: LabModule, slug: string, file: string): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "src", module, slug, file);
}

export function readLabFile(module: LabModule, slug: string, file: string): string | null {
  const absolute = labFilePath(module, slug, file);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : null;
}

export function readProjectFile(relative: string): string | null {
  const absolute = path.join(/*turbopackIgnore: true*/ process.cwd(), relative);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : null;
}

/** vscode://file/... opens the file in VS Code (most editors register a similar handler). */
export function editorLink(absolutePath: string): string {
  return `vscode://file/${absolutePath.replace(/\\/g, "/")}`;
}

export function relativeToProject(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath).replace(/\\/g, "/");
}
