import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCheck, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { isStockStale, type InventoryItem } from "@/lib/inventory";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  deptLabel: string;
  onConfirm: (id: string, qtyLeft: number) => Promise<void>;
}

type Scope = "all" | "stale" | "flagged";

interface Entry {
  item: InventoryItem;
  qty: number;
}

export default function StocktakeDialog({ open, onOpenChange, items, deptLabel, onConfirm }: Props) {
  const [scope, setScope] = useState<Scope>("stale");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  const queue = useMemo(() => {
    const base = [...items].sort((a, b) => a.name.localeCompare(b.name, "pl"));
    if (scope === "stale") return base.filter(isStockStale);
    if (scope === "flagged") return base.filter((i) => i.needsRestock);
    return base;
  }, [items, scope]);

  const current = queue[index];

  const reset = () => {
    setStarted(false);
    setFinished(false);
    setIndex(0);
    setValue("");
    setEntries([]);
  };

  const close = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const goNext = (entry?: Entry) => {
    const nextEntries = entry ? [...entries.filter((e) => e.item.id !== entry.item.id), entry] : entries;
    setEntries(nextEntries);
    setValue("");
    if (index + 1 >= queue.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  };

  const saveCurrent = async () => {
    if (!current || value.trim() === "") return;
    const qty = Number(value);
    if (Number.isNaN(qty)) return;
    setSaving(true);
    try {
      await onConfirm(current.id, qty);
      goNext({ item: current, qty });
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const head = "Pozycja;Jednostka;Magazyn;Stan policzony\n";
    const body = entries
      .map((e) => [e.item.name, e.item.unit, e.item.storehouse ?? "", e.qty].join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + head + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inwentaryzacja-${deptLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" /> Tryb inwentaryzacji
          </DialogTitle>
          <DialogDescription>
            {!started
              ? "Przechodź pozycja po pozycji i potwierdzaj aktualny stan."
              : finished
                ? "Podsumowanie policzonych pozycji."
                : `Pozycja ${index + 1} z ${queue.length}`}
          </DialogDescription>
        </DialogHeader>

        {!started && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Zakres liczenia</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["stale", "Nieaktualne (7+ dni)"],
                ["flagged", "Tylko zgłoszone"],
                ["all", "Wszystkie"],
              ] as [Scope, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setScope(key)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors",
                    scope === key
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Do policzenia: <span className="font-semibold text-foreground">{queue.length}</span> pozycji
            </p>
          </div>
        )}

        {started && !finished && current && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card/60 px-3 py-3">
              <p className="text-base font-semibold text-foreground">{current.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {[current.subcategory, current.unit, current.storehouse].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ostatni znany stan: {current.qtyLeft != null ? `${current.qtyLeft} ${current.unit}` : "brak danych"}
              </p>
            </div>
            <Input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              autoFocus
              placeholder={`Policzony stan (${current.unit})`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveCurrent()}
            />
            <div className="flex gap-1.5">
              {["0", "1", "2", "5", "10"].map((v) => (
                <Button key={v} type="button" variant="outline" size="sm" className="h-8 flex-1 px-0 text-[11px]" onClick={() => setValue(v)}>
                  {v}
                </Button>
              ))}
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${((index + 1) / queue.length) * 100}%` }} />
            </div>
          </div>
        )}

        {finished && (
          <div className="space-y-2">
            <p className="text-sm text-foreground">
              Policzono <span className="font-semibold">{entries.length}</span> z {queue.length} pozycji.
            </p>
            <ul className="max-h-[45vh] space-y-1 overflow-y-auto pr-1">
              {entries.map((e) => (
                <li key={e.item.id} className="flex items-center justify-between rounded-md border border-border/60 px-2.5 py-1.5 text-xs">
                  <span className="truncate text-foreground">{e.item.name}</span>
                  <span className="ml-2 shrink-0 font-semibold text-foreground">
                    {e.qty} {e.item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter className="flex-row justify-end gap-2">
          {!started && (
            <>
              <Button variant="ghost" onClick={() => close(false)}>Anuluj</Button>
              <Button disabled={queue.length === 0} onClick={() => setStarted(true)} className="gap-1.5">
                Rozpocznij <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {started && !finished && (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => { setIndex(index - 1); setValue(""); }}
                className="gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Wstecz
              </Button>
              <Button variant="outline" size="sm" onClick={() => goNext()}>Pomiń</Button>
              <Button size="sm" onClick={saveCurrent} disabled={saving || value.trim() === ""} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Zapisz i dalej
              </Button>
            </>
          )}
          {finished && (
            <>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={entries.length === 0} className="gap-1.5">
                <Download className="h-4 w-4" /> Eksport CSV
              </Button>
              <Button size="sm" onClick={() => close(false)}>Zamknij</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
