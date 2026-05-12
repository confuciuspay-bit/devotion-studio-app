import { useEffect, useState } from "react";

/**
 * Returns true once the component has mounted on the client.
 * Use to gate rendering of values that differ between SSR and client
 * (Date.now()-derived strings, persisted store state, locale formatting).
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
