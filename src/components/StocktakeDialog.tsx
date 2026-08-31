import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, ChevronDown, ChevronRight, ClipboardCheck, Download, Loader2, MapPin, Minus, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  CATEGORY_LABELS, groupByCountingLocation, isStockStale, UNASSIGNED_LOCATION, type InventoryItem,
} from "@/lib/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartment } from "@/contexts/DepartmentContext";
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
  const { isAdminFor } = useAuth();
  const { department } = useDepartment();
  const canSeeUnassigned = isAdminFor(department);

  const [scope, setScope] = useState<Scope>("stale");
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [pendingLocation, setPendingLocation] = useState<string | null>(null);

  // Sections follow the physical walking order through the venue
  const sections = useMemo(() => {
    const base = [...items].sort((a, b) => a.name.localeCompare(b.name, "pl"));
    const scoped =
      scope === "stale" ? base.filter(isStockStale)
        : scope === "flagged" ? base.filter((i) => i.needsRestock)
          : base;
    return groupByCountingLocation(scoped, canSeeUnassigned);
  }, [items, scope, canSeeUnassigned]);

  // Flat queue that respects the section order
  const queue = useMemo(
    () => sections.flatMap((s) => s.items.map((item) => ({ item, location: s.location }))),
    [sections]
  );

  const current = queue[index];
  const currentLocation = current?.location;

  const countedIn = (location: string) =>
    entries.filter((e) => queue.find((q) => q.item.id === e.item.id)?.location === location).length;

  const reset = () => {
    setStarted(false);
    setFinished(false);
    setIndex(0);
    setValue("");
    setEntries([]);
    setPendingLocation(null);
  };

  const close = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const advance = (nextEntries: Entry[]) => {
    setEntries(nextEntries);
    setValue("");
    const next = queue[index + 1];
    if (!next) {
      setFinished(true);
      return;
    }
    if (next.location !== queue[index].location) {
      setPendingLocation(next.location);
    }
    setIndex(index + 1);
  };

  const goNext = (entry?: Entry) => {
    advance(entry ? [...entries.filter((e) => e.item.id !== entry.item.id), entry] : entries);
  };

  const saveCurrent = async () => {
    if (!current || value.trim() === "") return;
    const qty = Number(value);
    if (Number.isNaN(qty)) return;
    setSaving(true);
    try {
      await onConfirm(current.item.id, qty);
      goNext({ item: current.item, qty });
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const head = "Lokalizacja;Pozycja;Kategoria;Jednostka;Magazyn;Stan policzony\n";
    const body = entries
      .map((e) => [
        queue.find((q) => q.item.id === e.item.id)?.location ?? "",
        e.item.name,
        CATEGORY_LABELS[e.item.category] ?? e.item.category,
        e.item.unit,
        e.item.storehouse ?? "",
        e.qty,
      ].join(";"))
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
              ? "Licz w kolejności obchodu lokalu — lokalizacja po lokalizacji."
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

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {sections.map((s) => {
                const isOpen = !collapsed[s.location];
                return (
                  <div
                    key={s.location}
                    className={cn(
                      "rounded-lg border bg-card/60",
                      s.unassigned ? "border-destructive/40" : "border-border"
                    )}
                  >
                    <button
                      onClick={() => setCollapsed((c) => ({ ...c, [s.location]: isOpen }))}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        <MapPin className={cn("h-3.5 w-3.5 shrink-0", s.unassigned ? "text-destructive" : "text-primary")} />
                        <span className={cn("truncate text-sm font-semibold", s.unassigned ? "text-destructive" : "text-foreground")}>
                          {s.unassigned ? UNASSIGNED_LOCATION : s.location}
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                        Sprawdzono {countedIn(s.location)} z {s.items.length}
                      </span>
                    </button>
                    {isOpen && (
                      <ul className="space-y-0.5 border-t border-border/50 px-3 py-2">
                        {s.items.map((it) => (
                          <li key={it.id} className="truncate text-xs text-foreground">
                            {it.name}
                            <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              {CATEGORY_LABELS[it.category] ?? it.category}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              Do policzenia: <span className="font-semibold text-foreground">{queue.length}</span> pozycji
            </p>
          </div>
        )}

        {started && !finished && pendingLocation && (
          <div className="space-y-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-4 text-center">
            <p className="text-sm font-semibold text-primary">Lokalizacja policzona</p>
            <p className="text-xs text-muted-foreground">
              Przejdź do następnej lokalizacji:
            </p>
            <p className="flex items-center justify-center gap-1.5 text-base font-semibold text-foreground">
              <MapPin className="h-4 w-4 text-primary" /> {pendingLocation}
            </p>
            <Button onClick={() => setPendingLocation(null)} className="gap-1.5">
              Kontynuuj <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {started && !finished && !pendingLocation && current && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <MapPin className="h-3.5 w-3.5" /> {currentLocation}
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Sprawdzono {countedIn(currentLocation!)} z {sections.find((s) => s.location === currentLocation)?.items.length ?? 0}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-card/60 px-3 py-3">
              <p className="text-base font-semibold text-foreground">{current.item.name}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABELS[current.item.category] ?? current.item.category}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {[current.item.subcategory, current.item.unit, current.item.storehouse].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ostatni znany stan: {current.item.qtyLeft != null ? `${current.item.qtyLeft} ${current.item.unit}` : "brak danych"}
              </p>
            </div>

            {canSeeUnassigned && (
              <div className="rounded-lg border border-border bg-card/40 px-3 py-2">
                <button
                  onClick={() => setEditLocations((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <span className="text-[11px] font-semibold text-foreground">Lokalizacje tego produktu</span>
                  <span className="text-[11px] text-primary">{editLocations ? "Zwiń" : "Zmień"}</span>
                </button>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Główna: {current.item.countingLocation ?? "brak"}
                  {(current.item.additionalLocations ?? []).length > 0
                    ? ` · dodatkowe: ${(current.item.additionalLocations ?? []).join(", ")}`
                    : ""}
                </p>
                {editLocations && (
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Główna lokalizacja</p>
                      <div className="flex flex-wrap gap-1.5">
                        {COUNTING_LOCATIONS.map((loc) => (
                          <button
                            key={loc}
                            disabled={savingLocations}
                            onClick={() => setLocations.mutate({ id: current.item.id, countingLocation: loc })}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                              current.item.countingLocation === loc
                                ? "border-primary/50 bg-primary/15 text-primary"
                                : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            )}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        Dodatkowe pomieszczenia (np. lodówka na barze i zaplecze)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {COUNTING_LOCATIONS.filter((l) => l !== current.item.countingLocation).map((loc) => {
                          const active = (current.item.additionalLocations ?? []).includes(loc);
                          return (
                            <button
                              key={loc}
                              disabled={savingLocations}
                              onClick={() => {
                                const cur = current.item.additionalLocations ?? [];
                                setLocations.mutate({
                                  id: current.item.id,
                                  additionalLocations: active ? cur.filter((l) => l !== loc) : [...cur, loc],
                                });
                              }}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                                active
                                  ? "border-primary/50 bg-primary/15 text-primary"
                                  : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              )}
                            >
                              {active ? "✓ " : "+ "}{loc}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              autoFocus
              placeholder={`Policzony stan (${current.item.unit})`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveCurrent()}
            />
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 flex-1 px-0"
                onClick={() => setValue(String(Math.max(0, (Number(value) || 0) - 1)))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-14 shrink-0 px-0 text-[11px]"
                onClick={() => setValue("0")}
              >
                0
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 flex-1 px-0"
                onClick={() => setValue(String((Number(value) || 0) + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
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
          {started && !finished && !pendingLocation && (
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
