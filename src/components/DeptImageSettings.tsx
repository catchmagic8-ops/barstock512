import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import bar512Tile from "@/assets/dept-bar512.jpg";
import bar512Ambient from "@/assets/ambient-bar512.jpg";
import {
  ambientImageKey,
  getSettings,
  setSetting,
  tileImageKey,
  uploadAppImage,
} from "@/lib/appSettings";

const DEPTS = [
  {
    id: "bar512",
    label: "Bar 512",
    tile: bar512Tile,
    ambient: bar512Ambient,
  },
];

const KEYS = DEPTS.flatMap((d) => [tileImageKey(d.id), ambientImageKey(d.id)]);

export default function DeptImageSettings() {
  const qc = useQueryClient();
  const { data: settings = {} } = useQuery({
    queryKey: ["app-settings", "dept-images"],
    queryFn: () => getSettings(KEYS),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["app-settings"] });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Zdjęcia zapisują się globalnie — zmiany widzą wszyscy użytkownicy.
      </p>
      {DEPTS.map((d) => (
        <div key={d.id} className="space-y-3">
          <p className="font-heading text-sm font-bold uppercase tracking-wide text-primary">
            {d.label}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ImageSlot
              settingKey={tileImageKey(d.id)}
              label="Kafelek departamentu"
              hint="Zdjęcie widoczne na kafelku"
              fallback={d.tile}
              current={settings[tileImageKey(d.id)]}
              onDone={refresh}
            />
            <ImageSlot
              settingKey={ambientImageKey(d.id)}
              label="Tło strony"
              hint="Zdjęcie w tle (rozmyte)"
              fallback={d.ambient}
              current={settings[ambientImageKey(d.id)]}
              onDone={refresh}
            />
          </div>
        </div>
      ))}
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
      toast({ title: "Zdjęcie zaktualizowane" });
      onDone();
    } catch (e) {
      toast({
        title: "Błąd zapisu",
        description: e instanceof Error ? e.message : "Nieznany błąd",
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
      toast({ title: "Przywrócono domyślne zdjęcie" });
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
          <Upload className="h-3.5 w-3.5" /> Zmień
        </Button>
        {current && (
          <Button size="sm" variant="ghost" className="gap-2" disabled={busy} onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" /> Domyślne
          </Button>
        )}
      </div>
    </div>
  );
}
