import { useEffect } from "react";
import { applyAppearance, useAppearance } from "@/lib/appearance";

/** Applies the global appearance settings as CSS variables for every user. */
export default function AppearanceSync() {
  const appearance = useAppearance();
  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);
  return null;
}
