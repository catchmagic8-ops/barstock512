import { useQuery } from "@tanstack/react-query";
import { getSettings, setSetting } from "@/lib/appSettings";

/** Global appearance settings key (JSON blob in app_settings). */
export const APP_APPEARANCE_KEY = "app_appearance";

export interface Appearance {
  /** Background image opacity (0.1 – 1) — "transparent" tła */
  bgOpacity: number;
  /** Background blur in px (0 – 20) */
  bgBlur: number;
  /** Glass strength of cards / tiles (0 – 0.35) */
  cardGlass: number;
  /** Corner radius in rem (0 – 1.5) */
  radius: number;
  /** Heading font family */
  headingFont: string;
}

export const DEFAULT_APPEARANCE: Appearance = {
  bgOpacity: 0.4,
  bgBlur: 3,
  cardGlass: 0.06,
  radius: 0.5,
  headingFont: "'Space Grotesk', sans-serif",
};

export const HEADING_FONTS: { label: string; value: string }[] = [
  { label: "Space Grotesk (domyślna)", value: "'Space Grotesk', sans-serif" },
  { label: "Playfair Display (elegancka)", value: "'Playfair Display', serif" },
  { label: "DM Sans (neutralna)", value: "'DM Sans', sans-serif" },
];

export function normalizeAppearance(raw: unknown): Appearance {
  const a = (raw ?? {}) as Partial<Appearance>;
  const clamp = (v: unknown, min: number, max: number, def: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
  return {
    bgOpacity: clamp(a.bgOpacity, 0.05, 1, DEFAULT_APPEARANCE.bgOpacity),
    bgBlur: clamp(a.bgBlur, 0, 20, DEFAULT_APPEARANCE.bgBlur),
    cardGlass: clamp(a.cardGlass, 0, 0.35, DEFAULT_APPEARANCE.cardGlass),
    radius: clamp(a.radius, 0, 1.5, DEFAULT_APPEARANCE.radius),
    headingFont:
      typeof a.headingFont === "string" && a.headingFont
        ? a.headingFont
        : DEFAULT_APPEARANCE.headingFont,
  };
}

export async function loadAppearance(): Promise<Appearance> {
  const s = await getSettings([APP_APPEARANCE_KEY]);
  const raw = s[APP_APPEARANCE_KEY];
  if (!raw) return DEFAULT_APPEARANCE;
  try {
    return normalizeAppearance(JSON.parse(raw));
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export async function saveAppearance(a: Appearance) {
  await setSetting(APP_APPEARANCE_KEY, JSON.stringify(normalizeAppearance(a)));
}

/** Applies the parts of the appearance that live in CSS variables. */
export function applyAppearance(a: Appearance) {
  const root = document.documentElement;
  root.style.setProperty("--radius", `${a.radius}rem`);
  root.style.setProperty("--font-heading", a.headingFont);
  root.style.setProperty("--tile-bg-from", `0 0% 100% / ${(a.cardGlass * 0.7).toFixed(3)}`);
  root.style.setProperty("--card-glass", a.cardGlass.toFixed(3));
}

export function useAppearance() {
  const { data } = useQuery({
    queryKey: ["app-settings", "appearance"],
    queryFn: loadAppearance,
    staleTime: 60_000,
  });
  return data ?? DEFAULT_APPEARANCE;
}
