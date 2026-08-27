import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { ACCENTS, useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AccentPicker() {
  const { accentHex, setAccentHex, savingAccent } = useTheme();
  const [draft, setDraft] = useState(accentHex);

  const norm = (v: string) => v.toLowerCase();

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Kolor akcentu aplikacji (przyciski, ikony, podświetlenia). Zmiana zapisuje się globalnie —
        widzą ją wszyscy użytkownicy.
      </p>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {ACCENTS.map((a) => {
          const active = norm(a.swatch) === norm(accentHex);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setAccentHex(a.swatch);
                setDraft(a.swatch);
              }}
              title={a.label}
              aria-pressed={active}
              className={`flex flex-col items-center gap-2 rounded-lg border p-2 transition-colors ${
                active ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60"
              }`}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: a.swatch }}
              >
                {active && <Check className="h-4 w-4 text-primary-foreground" />}
              </span>
              <span className="text-[11px] text-muted-foreground">{a.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card/60 p-3">
        <p className="text-sm font-semibold">Własny kolor</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(draft) ? draft : accentHex}
            onChange={(e) => {
              setDraft(e.target.value);
              setAccentHex(e.target.value);
            }}
            aria-label="Koło kolorów"
            className="h-12 w-16 cursor-pointer rounded-lg border border-border bg-transparent p-1"
          />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="#e85d3a"
            className="w-32 font-mono"
          />
          <Button size="sm" variant="outline" onClick={() => setAccentHex(draft)}>
            Zastosuj
          </Button>
          {savingAccent && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> zapisywanie…
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Aktualnie: {accentHex}</p>
      </div>
    </div>
  );
}
