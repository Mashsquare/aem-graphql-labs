import { param, type LabViewProps } from "@/lib/lab-view";
import { ArticleView } from "@/labs/10-aem-references-rich-text/ui";
import { getArticle, getArticleList } from "./queries";
import { RichText } from "./RichText";

export default function Solution({ searchParams }: LabViewProps) {
  return <ArticleView api={{ getArticleList, getArticle, RichText }} slug={param(searchParams, "slug")} />;
}
