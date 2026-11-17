import { param, type LabViewProps } from "@/lib/lab-view";
import { SpaView } from "@/labs/18-spa-page-model/ui";
import { createMapping } from "./mapping";
import { ModelComponent } from "./ModelComponent";
import { applyUpdate, findByPath } from "./model";

export default function Solution({ searchParams }: LabViewProps) {
  return <SpaView api={{ createMapping, ModelComponent, findByPath, applyUpdate }} editor={param(searchParams, "editor") === "1"} />;
}
