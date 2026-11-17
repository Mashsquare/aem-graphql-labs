import { todo } from "@/lib/todo";
import type { Adventure, AuthoredCard, CardViewModel } from "./types";

/**
 * Task 3 — combine the two sources: the AUTHORED options (page model) and the CONTENT (fragment).
 *
 *   fragment null/undefined          -> null   (nothing to show; the caller decides what that means)
 *   title                            <- fragment.title
 *   href                             <- `/adventures/${fragment.slug}`
 *   meta                             <- [activity, difficulty] without the missing ones, joined with " · " ("" if none)
 *   layout                           <- "compact" only when authored.layout === "compact", otherwise "full"
 *   price                            <- fragment.price, but ONLY when authored.showPrice === true and the price is a number
 *   image                            <- null without primaryImage._dynamicUrl, else
 *                                       { src: aemImageUrl(_dynamicUrl, { width: layout === "compact" ? 480 : 960 }), width, height }
 *                                       (aemImageUrl comes from "@/lib/aem/image")
 *
 * `showPrice` is a dialog checkbox: unchecked arrives as `false` OR as a missing property (Lab 16!).
 */
export function mergeCardProps(authored: AuthoredCard, fragment: Adventure | null | undefined): CardViewModel | null {
  void authored;
  void fragment;
  return todo("implement mergeCardProps in card.ts");
}
