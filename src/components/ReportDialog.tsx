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
  { value: "full", label: "Full report" },
  { value: "low", label: "Low stock only" },
];

const SORT_OPTIONS: { value: ReportSort; label: string }[] = [
  { value: "storehouse", label: "Storehouse" },
  { value: "category", label: "Category" },
  { value: "name", label: "Name" },
  { value: "qty-left", label: "Qty left (lowest first)" },
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
      toast({ title: "Raport downloaded" });
    } catch (e) {
      console.error("Report download failed", e);
      toast({ title: "Couldn't generate the PDF", variant: "destructive" });
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
      toast({ title: "Couldn't generate the PDF", variant: "destructive" });
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
            Preview the low stock list, choose how to sort it, then download or print.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Report type</p>
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
            <p className="text-xs font-medium text-muted-foreground">Sort low stock by</p>
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
              Preview — low stock ({flagged.length})
            </p>
            {flagged.length === 0 ? (
              <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                No items flagged for restock.
              </p>
            ) : (
              <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border/60 bg-muted/20 p-1.5">
                {flagged.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between gap-2 rounded bg-background/40 px-2 py-1.5 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0 text-warning" />
                      <span className="truncate font-medium text-foreground">{it.name}</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {[
                        it.storehouse,
                        it.qtyLeft != null ? `${it.qtyLeft} left` : null,
                        it.qtyToOrder != null ? `order ${it.qtyToOrder}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={handlePreview} className="gap-1.5">
            <Printer className="h-4 w-4" /> Preview &amp; Print
          </Button>
          <Button onClick={handleDownload} className="gap-1.5">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </DialogContent>

      <Dialog open={!!previewUrl} onOpenChange={(o) => { if (!o) closePreview(); }}>
        <DialogContent className="flex h-[85vh] max-w-[calc(100vw-2rem)] flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Raport preview</DialogTitle>
            <DialogDescription>
              Review the PDF below, then print it or go back to change the options.
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <iframe
              ref={previewFrameRef}
              src={previewUrl}
              title="Raport PDF preview"
              className="min-h-0 w-full flex-1 rounded-md border border-border/60 bg-muted/20"
            />
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={closePreview}>
              Back
            </Button>
            <Button onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
