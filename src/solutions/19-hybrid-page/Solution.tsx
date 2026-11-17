import { param, type LabViewProps } from "@/lib/lab-view";
import { HybridPageView } from "@/labs/19-hybrid-page/ui";
import { mergeCardProps } from "./card";
import { loadHybridPage } from "./page";

export default function Solution({ searchParams }: LabViewProps) {
  return <HybridPageView api={{ loadHybridPage, mergeCardProps }} editor={param(searchParams, "editor") === "1"} />;
}
