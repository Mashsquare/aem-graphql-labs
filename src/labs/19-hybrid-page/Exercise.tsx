import { param, type LabViewProps } from "@/lib/lab-view";
import { mergeCardProps } from "./card";
import { loadHybridPage } from "./page";
import { HybridPageView } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
  return <HybridPageView api={{ loadHybridPage, mergeCardProps }} editor={param(searchParams, "editor") === "1"} />;
}
