/**
 * Types for AEM's page model JSON — what `<page>.model.json` (Sling Model Exporter / SPA Editor)
 * returns. Labs 17–19 work with these.
 *
 * Every node carries `:type` (the resource type), most carry `:path` (where it lives in the
 * repository), and containers carry their children in `:items` with the order in `:itemsOrder`.
 */
export interface ModelNode {
  ":type": string;
  id?: string;
  ":path"?: string;
  ":items"?: Record<string, ModelNode>;
  ":itemsOrder"?: string[];
  gridClassNames?: string;
  columnClassNames?: Record<string, string>;
  /** Whatever the component's Sling Model exports. */
  [property: string]: unknown;
}

export interface PageModel extends ModelNode {
  ":hierarchyType": "page";
  title: string;
  description?: string;
  templateName?: string;
}

/** Core Components "Image" export. */
export interface ImageModel extends ModelNode {
  src: string;
  /** e.g. /content/.../image.coreimg{.width}.jpeg/1730000000000/<uuid>/hero.jpg */
  srcUriTemplate: string;
  alt: string;
  title?: string;
  widths?: number[];
  lazyEnabled?: boolean;
  width?: number;
  height?: number;
}

export interface TeaserAction {
  id: string;
  title: string;
  url: string;
}

/** Core Components "Teaser" export. `description` is rich text HTML. */
export interface TeaserModel extends ModelNode {
  title: string;
  titleType: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  description: string;
  linkURL: string;
  actionsEnabled: boolean;
  actions: TeaserAction[];
  image: Pick<ImageModel, "src" | "srcUriTemplate" | "alt" | "widths">;
}

/** Core Components "Text" export. With `richText: true`, `text` is HTML. */
export interface TextModel extends ModelNode {
  text: string;
  richText: boolean;
}

export interface TitleModel extends ModelNode {
  text: string;
  type: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}
