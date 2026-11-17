import { param, type LabViewProps } from "@/lib/lab-view";
import { getArticle, getArticleList } from "./queries";
import { RichText } from "./RichText";
import { ArticleView } from "./ui";

export default function Exercise({ searchParams }: LabViewProps) {
  return <ArticleView api={{ getArticleList, getArticle, RichText }} slug={param(searchParams, "slug")} />;
}
