import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

export type AccentId = "ember" | "amber" | "emerald" | "teal" | "indigo" | "violet";

export const ACCENTS: {
  id: AccentId;
  label: string;
  /** HSL triplet used for --primary / --brand in dark mode */
  dark: string;
  /** HSL triplet used in light mode (slightly darker for contrast) */
  light: string;
  /** preview swatch color */
  swatch: string;
}[] = [
  { id: "ember", label: "Miedziany", dark: "14 77% 56%", light: "14 77% 48%", swatch: "#e85d3a" },
  { id: "amber", label: "Złoty", dark: "38 85% 55%", light: "32 85% 42%", swatch: "#e8a33d" },
  { id: "emerald", label: "Zielony", dark: "152 55% 45%", light: "152 60% 33%", swatch: "#34a97b" },
  { id: "teal", label: "Morski", dark: "190 70% 45%", light: "192 75% 33%", swatch: "#22a3bd" },
  { id: "indigo", label: "Granatowy", dark: "225 65% 60%", light: "228 65% 48%", swatch: "#5b6ee0" },
  { id: "violet", label: "Fioletowy", dark: "280 55% 60%", light: "282 55% 47%", swatch: "#a061d8" },
];

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  accent: AccentId;
  setAccent: (a: AccentId) => void;
}

const ThemeContext = createContext<ThemeCtx | undefined>(undefined);
const STORAGE_KEY = "app-theme";
const ACCENT_KEY = "app-accent";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "dark";
  });
  const [accent, setAccentState] = useState<AccentId>(() => {
    if (typeof window === "undefined") return "ember";
    const saved = localStorage.getItem(ACCENT_KEY) as AccentId | null;
    return ACCENTS.some((a) => a.id === saved) ? (saved as AccentId) : "ember";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    const conf = ACCENTS.find((a) => a.id === accent) ?? ACCENTS[0];
    const hsl = theme === "light" ? conf.light : conf.dark;
    const [h, s] = hsl.split(" ");
    root.style.setProperty("--primary", hsl);
    root.style.setProperty("--ring", hsl);
    root.style.setProperty("--brand", hsl);
    root.style.setProperty("--sidebar-primary", hsl);
    root.style.setProperty("--sidebar-ring", hsl);
    root.style.setProperty("--accent", `${h} ${s} ${theme === "light" ? "50%" : "45%"}`);
    root.style.setProperty("--tile-bg-to", `${hsl} / ${theme === "light" ? "0.08" : "0.06"}`);
    root.style.setProperty("--tile-border", `${hsl} / ${theme === "light" ? "0.45" : "0.4"}`);
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent, theme]);

  const toggleTheme = () => setThemeState((p) => (p === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, setTheme: setThemeState, accent, setAccent: setAccentState }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
