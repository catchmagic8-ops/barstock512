import { supabase } from "@/integrations/supabase/client";

export const DEPT_TILE_IMAGE_KEY = "dept_bar512_tile_image";
export const DEPT_AMBIENT_IMAGE_KEY = "dept_bar512_ambient_image";

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
