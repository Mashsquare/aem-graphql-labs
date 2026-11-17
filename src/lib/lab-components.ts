import type { ComponentType } from "react";
import type { LabViewProps } from "./lab-view";

type Loader = () => Promise<{ default: ComponentType<LabViewProps> }>;

/** What the "Your workspace" tab renders: src/labs/<slug>/Exercise.tsx */
export const exerciseLoaders: Record<string, Loader> = {
  "01-graphql-over-http": () => import("@/labs/01-graphql-over-http/Exercise"),
  "02-variables-fragments-directives": () => import("@/labs/02-variables-fragments-directives/Exercise"),
  "03-apollo-client": () => import("@/labs/03-apollo-client/Exercise"),
  "04-urql": () => import("@/labs/04-urql/Exercise"),
  "05-tanstack-query": () => import("@/labs/05-tanstack-query/Exercise"),
  "06-graphql-codegen": () => import("@/labs/06-graphql-codegen/Exercise"),
  "07-aem-first-query": () => import("@/labs/07-aem-first-query/Exercise"),
  "08-aem-filtering-sorting": () => import("@/labs/08-aem-filtering-sorting/Exercise"),
  "09-aem-pagination": () => import("@/labs/09-aem-pagination/Exercise"),
  "10-aem-references-rich-text": () => import("@/labs/10-aem-references-rich-text/Exercise"),
  "11-aem-persisted-queries": () => import("@/labs/11-aem-persisted-queries/Exercise"),
  "12-aem-variations-locales": () => import("@/labs/12-aem-variations-locales/Exercise"),
  "13-aem-images": () => import("@/labs/13-aem-images/Exercise"),
  "14-aem-author-preview": () => import("@/labs/14-aem-author-preview/Exercise"),
  "15-aem-capstone": () => import("@/labs/15-aem-capstone/Exercise"),
  "16-htl-react-islands": () => import("@/labs/16-htl-react-islands/Exercise"),
  "17-sling-model-json": () => import("@/labs/17-sling-model-json/Exercise"),
  "18-spa-page-model": () => import("@/labs/18-spa-page-model/Exercise"),
  "19-hybrid-page": () => import("@/labs/19-hybrid-page/Exercise"),
  "20-sling-resources-valuemap": () => import("@/labs/20-sling-resources-valuemap/Exercise"),
  "21-sling-model-adaptto": () => import("@/labs/21-sling-model-adaptto/Exercise"),
  "22-sling-models-components": () => import("@/labs/22-sling-models-components/Exercise"),
  "23-sling-exporter-delegation": () => import("@/labs/23-sling-exporter-delegation/Exercise"),
};

/** What the "Solution (live)" tab renders: src/solutions/<slug>/Solution.tsx */
export const solutionLoaders: Record<string, Loader> = {
  "01-graphql-over-http": () => import("@/solutions/01-graphql-over-http/Solution"),
  "02-variables-fragments-directives": () => import("@/solutions/02-variables-fragments-directives/Solution"),
  "03-apollo-client": () => import("@/solutions/03-apollo-client/Solution"),
  "04-urql": () => import("@/solutions/04-urql/Solution"),
  "05-tanstack-query": () => import("@/solutions/05-tanstack-query/Solution"),
  "06-graphql-codegen": () => import("@/solutions/06-graphql-codegen/Solution"),
  "07-aem-first-query": () => import("@/solutions/07-aem-first-query/Solution"),
  "08-aem-filtering-sorting": () => import("@/solutions/08-aem-filtering-sorting/Solution"),
  "09-aem-pagination": () => import("@/solutions/09-aem-pagination/Solution"),
  "10-aem-references-rich-text": () => import("@/solutions/10-aem-references-rich-text/Solution"),
  "11-aem-persisted-queries": () => import("@/solutions/11-aem-persisted-queries/Solution"),
  "12-aem-variations-locales": () => import("@/solutions/12-aem-variations-locales/Solution"),
  "13-aem-images": () => import("@/solutions/13-aem-images/Solution"),
  "14-aem-author-preview": () => import("@/solutions/14-aem-author-preview/Solution"),
  "15-aem-capstone": () => import("@/solutions/15-aem-capstone/Solution"),
  "16-htl-react-islands": () => import("@/solutions/16-htl-react-islands/Solution"),
  "17-sling-model-json": () => import("@/solutions/17-sling-model-json/Solution"),
  "18-spa-page-model": () => import("@/solutions/18-spa-page-model/Solution"),
  "19-hybrid-page": () => import("@/solutions/19-hybrid-page/Solution"),
  "20-sling-resources-valuemap": () => import("@/solutions/20-sling-resources-valuemap/Solution"),
  "21-sling-model-adaptto": () => import("@/solutions/21-sling-model-adaptto/Solution"),
  "22-sling-models-components": () => import("@/solutions/22-sling-models-components/Solution"),
  "23-sling-exporter-delegation": () => import("@/solutions/23-sling-exporter-delegation/Solution"),
};
