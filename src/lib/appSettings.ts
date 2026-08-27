import { supabase } from "@/integrations/supabase/client";

/** Legacy keys (Bar 512) — kept so existing uploads stay visible. */
export const DEPT_TILE_IMAGE_KEY = "dept_bar512_tile_image";
export const DEPT_AMBIENT_IMAGE_KEY = "dept_bar512_ambient_image";

/** Global accent color (hex, e.g. "#e85d3a") shared by every user. */
export const APP_ACCENT_KEY = "app_accent_color";

export function tileImageKey(dept: string) {
  return dept === "bar512" ? DEPT_TILE_IMAGE_KEY : `dept_${dept}_tile_image`;
}

export function ambientImageKey(dept: string) {
  return dept === "bar512" ? DEPT_AMBIENT_IMAGE_KEY : `dept_${dept}_ambient_image`;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const { data, error } = await (supabase as any)
    .from("app_settings")
    .select("key,value")
    .in("key", keys);
  if (error) throw error;
  const out: Record<string, string> = {};
  for (const row of (data ?? []) as { key: string; value: string | null }[]) {
    if (row.value) out[row.key] = row.value;
  }
  return out;
}

export async function setSetting(key: string, value: string | null) {
  const { error } = await (supabase as any)
    .from("app_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw error;
}

/** Uploads an image to the public bucket and returns its public URL. */
export async function uploadAppImage(file: File, folder = "departments"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("recipe-images").upload(path, file, {
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  return supabase.storage.from("recipe-images").getPublicUrl(path).data.publicUrl;
}

/** Converts "#rrggbb" to an HSL triplet string usable in CSS variables. */
export function hexToHslTriplet(hex: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Darkens an HSL triplet's lightness by `amount` percentage points. */
export function darkenHsl(triplet: string, amount = 10): string {
  const [h, s, l] = triplet.split(" ");
  const light = Math.max(20, parseFloat(l) - amount);
  return `${h} ${s} ${light}%`;
}
