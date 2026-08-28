import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCENTS, useTheme } from "@/contexts/ThemeContext";

export default function PersonalAccentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { accentHex, personalAccentHex, setPersonalAccentHex, globalAccentHex } = useTheme();
  const [draft, setDraft] = useState(accentHex);

  const norm = (v: string) => v.toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-popover/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Mój kolor akcentu</DialogTitle>
          <DialogDescription>
            Ustaw własny kolor aplikacji. Zapisuje się tylko dla Ciebie i zostaje, dopóki go nie
            zmienisz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {ACCENTS.map((a) => {
              const active = norm(a.swatch) === norm(accentHex);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    setPersonalAccentHex(a.swatch);
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
                  setPersonalAccentHex(e.target.value);
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
              <Button size="sm" variant="outline" onClick={() => setPersonalAccentHex(draft)}>
                Zastosuj
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {personalAccentHex
                ? `Twój kolor: ${personalAccentHex}`
                : `Używasz koloru globalnego: ${globalAccentHex}`}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2"
              disabled={!personalAccentHex}
              onClick={() => {
                setPersonalAccentHex(null);
                setDraft(globalAccentHex);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Domyślny
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
