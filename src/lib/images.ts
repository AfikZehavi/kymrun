import heroBottle from "@/assets/hero-bottle.jpg";
import wineBottle from "@/assets/wine-bottle.jpg";
import ginBottle from "@/assets/gin-bottle.jpg";
import champagneBottle from "@/assets/champagne-bottle.jpg";
import cognacBottle from "@/assets/cognac-bottle.jpg";
import vodkaBottle from "@/assets/vodka-bottle.jpg";
import giftSet from "@/assets/gift-set.jpg";

export const assetImages: Record<string, string> = {
  "hero-bottle": heroBottle,
  "wine-bottle": wineBottle,
  "gin-bottle": ginBottle,
  "champagne-bottle": champagneBottle,
  "cognac-bottle": cognacBottle,
  "vodka-bottle": vodkaBottle,
  "gift-set": giftSet,
};

/** Accepts an asset key, an absolute URL or a data URL. */
export function resolveImage(value: string | null | undefined): string {
  if (!value) return heroBottle;
  return assetImages[value] ?? value;
}
