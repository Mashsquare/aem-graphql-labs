import type { ReactNode } from "react";
import type { PriceTagProps } from "@/labs/16-htl-react-islands/PriceTag";

function formatAmount(amount: number | undefined, currency: string): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  if (amount === 0) return "Free"; // 0 is a price; `if (!amount)` would call it "missing"
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`; // Intl throws a RangeError for codes it does not know
  }
}

export function PriceTag({ amount, currency = "USD", sale = false, label }: PriceTagProps): ReactNode {
  return (
    <span className="price-tag">
      {typeof label === "string" && label ? <span className="price-tag__label">{label}</span> : null}{" "}
      <span className="price-tag__amount">{formatAmount(amount, currency)}</span>
      {sale === true ? (
        <>
          {" "}
          <span className="price-tag__badge">Sale</span>
        </>
      ) : null}
    </span>
  );
}
