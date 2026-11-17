import { editorLink, labFilePath, type LabModule } from "@/lib/lab-files";

export function FileList({ module, slug, files }: { module: LabModule; slug: string; files: string[] }) {
  return (
    <ul className="space-y-1">
      {files.map((file) => {
        const absolute = labFilePath(module, slug, file);
        return (
          <li key={file}>
            <a href={editorLink(absolute)} className="font-mono text-sm text-accent hover:underline" title="Open in VS Code">
              src/{module}/{slug}/{file}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
