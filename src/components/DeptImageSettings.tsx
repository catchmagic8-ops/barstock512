import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import bar512Tile from "@/assets/dept-bar512.jpg";
import bar512Ambient from "@/assets/ambient-bar512.jpg";
import {
  DEPT_AMBIENT_IMAGE_KEY,
  DEPT_TILE_IMAGE_KEY,
  getSettings,
  setSetting,
  uploadAppImage,
} from "@/lib/appSettings";

const KEYS = [DEPT_TILE_IMAGE_KEY, DEPT_AMBIENT_IMAGE_KEY];

export default function DeptImageSettings() {
  const qc = useQueryClient();
  const { data: settings = {} } = useQuery({
    queryKey: ["app-settings", "dept-images"],
    queryFn: () => getSettings(KEYS),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["app-settings", "dept-images"] });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ImageSlot
        settingKey={DEPT_TILE_IMAGE_KEY}
        label="Kafelek Bar 512"
        hint="Zdjecie widoczne na kafelku departamentu"
        fallback={bar512Tile}
        current={settings[DEPT_TILE_IMAGE_KEY]}
        onDone={refresh}
      />
      <ImageSlot
        settingKey={DEPT_AMBIENT_IMAGE_KEY}
        label="Tlo strony departamentow"
        hint="Zdjecie w tle (rozmyte)"
        fallback={bar512Ambient}
        current={settings[DEPT_AMBIENT_IMAGE_KEY]}
        onDone={refresh}
      />
    </div>
  );
}

function ImageSlot({
  settingKey,
  label,
  hint,
  fallback,
  current,
  onDone,
}: {
  settingKey: string;
  label: string;
  hint: string;
  fallback: string;
  current?: string;
  onDone: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const url = await uploadAppImage(file);
      await setSetting(settingKey, url);
      toast({ title: "Zdjecie zaktualizowane" });
      onDone();
    } catch (e) {
      toast({
        title: "Blad zapisu",
        description: e instanceof Error ? e.message : "Nieznany blad",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function reset() {
    setBusy(true);
    try {
      await setSetting(settingKey, null);
      toast({ title: "Przywrocono domyslne zdjecie" });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card/60 p-3">
      <div className="mb-2">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="relative mb-3 aspect-video overflow-hidden rounded-lg bg-muted">
        <img src={current || fallback} alt={label} className="h-full w-full object-cover" />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-2" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" /> Zmien
        </Button>
        {current && (
          <Button size="sm" variant="ghost" className="gap-2" disabled={busy} onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" /> Domyslne
          </Button>
        )}
      </div>
    </div>
  );
}
