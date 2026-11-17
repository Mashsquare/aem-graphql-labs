/**
 * TypeScript shapes for the parts of AEM's GraphQL schema that every model shares.
 * (Lab 06 shows how to generate these from the schema instead of writing them by hand.)
 */

export interface GraphQLErrorShape {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<TData> {
  data?: TData | null;
  errors?: GraphQLErrorShape[];
}

export interface ImageRef {
  __typename?: "ImageRef";
  _path: string;
  /** Relative! Prefix with the AEM Publish origin. */
  _dynamicUrl?: string | null;
  _publishUrl?: string;
  _authorUrl?: string;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface DocumentRef {
  __typename?: "DocumentRef";
  _path: string;
  _publishUrl?: string;
  format?: string | null;
  size?: number | null;
}

/* Multi line text fields ---------------------------------------------------------------- */

export type RichTextVariant = "bold" | "italic" | "underline";

export type RichTextNode =
  | { nodeType: "text"; value: string; format?: { variants: RichTextVariant[] } }
  | { nodeType: "link"; value: string; data: { href: string; target?: string } }
  | { nodeType: "reference"; data: { path: string; mimetype: string } }
  | { nodeType: "reference"; value: string; data: { href: string; type: "fragment" } }
  | { nodeType: "paragraph" | "unordered-list" | "ordered-list" | "list-item"; content: RichTextNode[] }
  | { nodeType: "header"; style: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; content: RichTextNode[] };

export interface MultiFormatString {
  html?: string | null;
  plaintext?: string | null;
  markdown?: string | null;
  json?: RichTextNode[] | null;
}

/* Results ------------------------------------------------------------------------------- */

export interface ListResult<TItem> {
  items: TItem[];
}

export interface PageInfo {
  endCursor: string | null;
  hasNextPage: boolean;
  startCursor?: string | null;
  hasPreviousPage?: boolean;
}

export interface Connection<TNode> {
  edges: { cursor: string; node: TNode }[];
  pageInfo: PageInfo;
}
