import { param, type LabViewProps } from "@/lib/lab-view";
import { createMapping } from "./mapping";
import { ModelComponent } from "./ModelComponent";
import { applyUpdate, findByPath } from "./model";
import { SpaView } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
  return <SpaView api={{ createMapping, ModelComponent, findByPath, applyUpdate }} editor={param(searchParams, "editor") === "1"} />;
}
