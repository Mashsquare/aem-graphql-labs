/** Props every lab Exercise / Solution component receives from the workspace page. */
export interface LabViewProps {
  searchParams: Record<string, string | string[] | undefined>;
}

/** First value of a search param (?a=1&a=2 -> "1"). */
export function param(searchParams: LabViewProps["searchParams"], name: string): string | undefined {
  const value = searchParams[name];
  return Array.isArray(value) ? value[0] : value;
}
