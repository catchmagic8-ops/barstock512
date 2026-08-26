import { Check } from "lucide-react";
import { ACCENTS, useTheme } from "@/contexts/ThemeContext";

export default function AccentPicker() {
  const { accent, setAccent } = useTheme();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Wybierz kolor akcentu aplikacji (przyciski, ikony, podświetlenia).
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {ACCENTS.map((a) => {
          const active = a.id === accent;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccent(a.id)}
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
    </div>
  );
}
