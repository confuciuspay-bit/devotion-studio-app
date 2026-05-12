import { useEffect } from "react";
import { useApp } from "@/lib/store";

/**
 * Injects the merchant's brand color into the document as a CSS variable
 * (`--brand`) so merchant-facing surfaces can pick it up. Falls back to the
 * default Umbra primary when no brand color is set.
 */
export function MerchantBrand() {
  const brand = useApp((s) => s.merchant?.brandColor);

  useEffect(() => {
    const root = document.documentElement;
    if (brand) {
      root.style.setProperty("--brand", brand);
    } else {
      root.style.removeProperty("--brand");
    }
  }, [brand]);

  return null;
}
