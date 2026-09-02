import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Appearance,
  DEFAULT_APPEARANCE,
  HEADING_FONTS,
  applyAppearance,
  saveAppearance,
  useAppearance,
} from "@/lib/appearance";

export default function AppearanceSettings() {
  const qc = useQueryClient();
  const saved = useAppearance();
  const [draft, setDraft] = useState<Appearance>(saved);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(saved);
  }, [saved]);

  const update = (patch: Partial<Appearance>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    applyAppearance(next); // live preview
  };

  async function persist(next: Appearance) {
    setBusy(true);
    try {
      await saveAppearance(next);
      applyAppearance(next);
      await qc.invalidateQueries({ queryKey: ["app-settings"] });
      toast({ title: "Wygląd zapisany", description: "Zmiany widzą wszyscy użytkownicy." });
    } catch (e) {
      toast({
        title: "Błąd zapisu",
        description: e instanceof Error ? e.message : "Nieznany błąd",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Podstawowe elementy wyglądu aplikacji. Ustawienia są globalne — obowiązują na wszystkich
        kontach.
      </p>

      <div className="space-y-5 rounded-xl border border-border bg-card/60 p-4">
        <SliderRow
          label="Przezroczystość zdjęć w tle"
          hint="Im mniej, tym bardziej tło jest przygaszone"
          value={draft.bgOpacity}
          min={0.05}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => update({ bgOpacity: v })}
        />
        <SliderRow
          label="Rozmycie tła"
          hint="Efekt atmosferycznego rozmycia zdjęcia"
          value={draft.bgBlur}
          min={0}
          max={20}
          step={1}
          format={(v) => `${v} px`}
          onChange={(v) => update({ bgBlur: v })}
        />
        <SliderRow
          label="Przezroczystość kafelków (szkło)"
          hint="Siła efektu szkła na kartach i kafelkach"
          value={draft.cardGlass}
          min={0}
          max={0.35}
          step={0.01}
          format={(v) => `${Math.round((v / 0.35) * 100)}%`}
          onChange={(v) => update({ cardGlass: v })}
        />
        <SliderRow
          label="Zaokrąglenie narożników"
          hint="Promień narożników kart, przycisków i pól"
          value={draft.radius}
          min={0}
          max={1.5}
          step={0.05}
          format={(v) => `${v.toFixed(2)} rem`}
          onChange={(v) => update({ radius: v })}
        />

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Krój pisma nagłówków</Label>
          <Select value={draft.headingFont} onValueChange={(v) => update({ headingFont: v })}>
            <SelectTrigger className="sm:w-72">
              <SelectValue placeholder="Wybierz krój" />
            </SelectTrigger>
            <SelectContent>
              {HEADING_FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  <span style={{ fontFamily: f.value }}>{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Dotyczy tytułów i nagłówków sekcji w całej aplikacji.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-2" disabled={busy} onClick={() => persist(draft)}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Zapisz dla wszystkich
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          disabled={busy}
          onClick={() => {
            setDraft(DEFAULT_APPEARANCE);
            persist(DEFAULT_APPEARANCE);
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Przywróć domyślne
        </Button>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold">{label}</Label>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-mono text-muted-foreground">
          {format(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
