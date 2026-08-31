import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  buildReport, sortFlagged, type ReportScope, type ReportSort,
} from "@/lib/generateReport";
import type { InventoryItem } from "@/lib/inventory";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  deptLabel: string;
}

const SCOPE_OPTIONS: { value: ReportScope; label: string }[] = [
  { value: "full", label: "Pełny raport" },
  { value: "low", label: "Tylko niski stan" },
];

const SORT_OPTIONS: { value: ReportSort; label: string }[] = [
  { value: "storehouse", label: "Magazyn" },
  { value: "category", label: "Kategoria" },
  { value: "name", label: "Nazwa" },
  { value: "qty-left", label: "Ilość pozostała (od najmniejszej)" },
];

export default function ReportDialog({ open, onOpenChange, items, deptLabel }: Props) {
  const [scope, setScope] = useState<ReportScope>("full");
  const [sortBy, setSortBy] = useState<ReportSort>("storehouse");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const flagged = useMemo(
    () => sortFlagged(items.filter((i) => i.needsRestock), sortBy),
    [items, sortBy]
  );

  const build = () => buildReport(items, { scope, sortBy, deptLabel });

  const makeBlobUrl = () => {
    const blob = build().output("blob");
    return URL.createObjectURL(blob);
  };

  const handleDownload = () => {
    try {
      const url = makeBlobUrl();
      const a = document.createElement("a");
      a.href = url;
      a.download = `raport-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast({ title: "Raport pobrany" });
    } catch (e) {
      console.error("Report download failed", e);
      toast({ title: "Nie udało się wygenerować pliku PDF", variant: "destructive" });
    }
  };

  // window.open(blobUrl) gets blocked / opens blank tabs, so instead show the
  // PDF in an in-app preview dialog and print from the embedded frame.
  const handlePreview = () => {
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(makeBlobUrl());
    } catch (e) {
      console.error("Report preview failed", e);
      toast({ title: "Nie udało się wygenerować pliku PDF", variant: "destructive" });
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handlePrint = () => {
    const win = previewFrameRef.current?.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raport</DialogTitle>
          <DialogDescription>
            Przejrzyj listę niskich stanów, wybierz sposób sortowania, a następnie pobierz lub wydrukuj.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Typ raportu</p>
            <div className="flex flex-wrap gap-1.5">
              {SCOPE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setScope(o.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all",
                    scope === o.value
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Sortuj niskie stany według</p>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setSortBy(o.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-all",
                    sortBy === o.value
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Podgląd — niski stan ({flagged.length}) · w kolejności obchodu lokalu
            </p>
            {flagged.length === 0 ? (
              <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                Brak pozycji zgłoszonych do uzupełnienia.
              </p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {sections.map((s, si) => {
                  const isOpen = !collapsed[s.location];
                  const checked = s.items.filter((i) => i.qtyLeft != null).length;
                  const done = checked === s.items.length;
                  const next = sections[si + 1];
                  return (
                    <div
                      key={s.location}
                      className={cn(
                        "rounded-lg border bg-muted/20",
                        s.unassigned ? "border-destructive/40" : "border-border/60"
                      )}
                    >
                      <button
                        onClick={() => setCollapsed((c) => ({ ...c, [s.location]: isOpen }))}
                        className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                          <MapPin className={cn("h-3.5 w-3.5 shrink-0", s.unassigned ? "text-destructive" : "text-primary")} />
                          <span className={cn("truncate text-xs font-semibold", s.unassigned ? "text-destructive" : "text-foreground")}>
                            {s.unassigned ? UNASSIGNED_LOCATION : s.location}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                          Sprawdzono {checked} z {s.items.length}
                        </span>
                      </button>
                      {isOpen && (
                        <ul className="space-y-1 border-t border-border/50 p-1.5">
                          {s.items.map((it) => (
                            <li
                              key={it.id}
                              className="flex items-center justify-between gap-2 rounded bg-background/40 px-2 py-1.5 text-xs"
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0 text-warning" />
                                <div className="min-w-0">
                                  <span className="block truncate font-medium text-foreground">{it.name}</span>
                                  <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                                    {CATEGORY_LABELS[it.category] ?? it.category}
                                  </span>
                                </div>
                              </div>
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                {[
                                  it.storehouse,
                                  it.qtyLeft != null ? `zostało: ${it.qtyLeft}` : null,
                                  it.qtyToOrder != null ? `zamów: ${it.qtyToOrder}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </li>
                          ))}
                          {done && next && (
                            <button
                              onClick={() => {
                                setCollapsed((c) => ({ ...c, [s.location]: true, [next.location]: false }));
                              }}
                              className="flex w-full items-center justify-center gap-1.5 rounded border border-primary/40 bg-primary/10 px-2 py-1.5 text-[11px] font-semibold text-primary"
                            >
                              Przejdź do następnej lokalizacji: {next.unassigned ? UNASSIGNED_LOCATION : next.location}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={handlePreview} className="gap-1.5">
            <Printer className="h-4 w-4" /> Podgląd i drukuj
          </Button>
          <Button onClick={handleDownload} className="gap-1.5">
            <Download className="h-4 w-4" /> Pobierz PDF
          </Button>
        </div>
      </DialogContent>

      <Dialog open={!!previewUrl} onOpenChange={(o) => { if (!o) closePreview(); }}>
        <DialogContent className="flex h-[85vh] max-w-[calc(100vw-2rem)] flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Podgląd raportu</DialogTitle>
            <DialogDescription>
              Przejrzyj plik PDF poniżej, a następnie wydrukuj go lub wróć, aby zmienić opcje.
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <iframe
              ref={previewFrameRef}
              src={previewUrl}
              title="Podgląd pliku PDF raportu"
              className="min-h-0 w-full flex-1 rounded-md border border-border/60 bg-muted/20"
            />
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={closePreview}>
              Wstecz
            </Button>
            <Button onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" /> Drukuj
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
