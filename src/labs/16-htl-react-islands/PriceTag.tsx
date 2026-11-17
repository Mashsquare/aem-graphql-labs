import type { ReactNode } from "react";
import { todo } from "@/lib/todo";

export interface PriceTagProps {
  amount?: number;
  currency?: string;
  sale?: boolean;
  label?: string;
}

/**
 * Task 3 — the React side of `wknd/components/pricetag`. The props arrive from HTL via readProps:
 *
 *   <span class="price-tag">
 *     <span class="price-tag__label">{label}</span>      only when label is a non-empty string
 *     {" "}<span class="price-tag__amount">$1,450</span>
 *     {" "}<span class="price-tag__badge">Sale</span>    only when sale === true
 *   </span>
 *
 * The amount: whole units, en-US formatting, `currency` defaults to "USD".
 *   amount 0                       -> "Free"   (0 is a real price, not "missing")
 *   amount not a finite number     -> "—"
 *   currency that Intl rejects     -> no crash: fall back to `${amount} ${currency}`   (authors type free text)
 */
export function PriceTag(props: PriceTagProps): ReactNode {
  void props;
  return todo("implement PriceTag in PriceTag.tsx");
}
