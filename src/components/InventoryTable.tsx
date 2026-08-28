import { useState } from "react";
import { AlertTriangle, BellRing, Check, Clock, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { formatFlaggedAt, formatRelative, isStockStale, STALE_STOCK_DAYS, type InventoryItem } from "@/lib/inventory";
import InventoryHistoryDialog from "@/components/InventoryHistoryDialog";
import { cn } from "@/lib/utils";

interface Props {
  items: InventoryItem[];
  onFlag: (id: string, note?: string, qtyLeft?: number | null, qtyToOrder?: number | null) => void;
  onClear?: (id: string) => void;
}

export default function InventoryTable({ items, onFlag, onClear }: Props) {
  const [flagging, setFlagging] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [note, setNote] = useState("");
  const [qtyLeft, setQtyLeft] = useState("");
  const [qtyToOrder, setQtyToOrder] = useState("");

  const openFlag = (item: InventoryItem) => {
    setFlagging(item);
    setNote("");
    setQtyLeft("");
    setQtyToOrder("");
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">Brak pozycji w tej kategorii</p>
      </div>
    );
  }

  const submitFlag = () => {
    if (!flagging) return;
    onFlag(
      flagging.id,
      note.trim() || undefined,
      qtyLeft.trim() === "" ? null : Number(qtyLeft),
      qtyToOrder.trim() === "" ? null : Number(qtyToOrder)
    );
    setFlagging(null);
    setNote("");
    setQtyLeft("");
    setQtyToOrder("");
  };

  return (
    <>
      {/* MOBILE: stacked card list — keeps the action button always visible */}
      <ul className="sm:hidden divide-y divide-border/50">
        {items.map((item) => {
          const flagged = item.needsRestock;
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center justify-between gap-2 py-2.5 px-1 transition-colors",
                flagged && "bg-warning/5"
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {flagged && (
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-warning animate-pulse-warning" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {[item.subcategory, item.unit, item.storehouse].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    stan: {item.qtyLeft != null ? `${item.qtyLeft} ${item.unit}` : "brak danych"}
                    {(item.stockConfirmedAt || item.flaggedAt || item.updatedAt) && (
                      <> · {formatRelative(item.stockConfirmedAt ?? item.flaggedAt ?? item.updatedAt!)}</>
                    )}
                  </p>
                  {isStockStale(item) && (
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                      <Clock className="h-3 w-3" /> nieaktualne
                    </span>
                  )}
                  {flagged && (item.qtyLeft != null || item.qtyToOrder != null) && (
                    <p className="mt-0.5 text-[11px] font-medium text-warning">
                      {item.qtyLeft != null && <>zostało: {item.qtyLeft}</>}
                      {item.qtyLeft != null && item.qtyToOrder != null && " · "}
                      {item.qtyToOrder != null && <>zamów: {item.qtyToOrder}</>}
                    </p>
                  )}
                  {flagged && item.restockNote && (
                    <p className="mt-0.5 text-[11px] text-warning/90 italic truncate">
                      "{item.restockNote}"
                    </p>
                  )}
                  {flagged && item.flaggedBy && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
                      zgłosił: {item.flaggedBy}
                      {item.flaggedAt && <> · {formatFlaggedAt(item.flaggedAt)}</>}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0">
                {flagged ? (
                  onClear ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-warning/40 text-warning"
                      onClick={() => onClear(item.id)}
                      title="Oznacz jako uzupełnione"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                      ZGŁOSZONO
                    </span>
                  )
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] gap-1 px-2.5 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                    onClick={() => openFlag(item)}
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    Niski stan
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* DESKTOP / TABLET (sm+): full table layout */}
      <div className="hidden sm:block overflow-x-auto -mx-1">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[19%]" />
            <col className="w-[27%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Pozycja</th>
              <th className="pb-3 pr-4 font-medium">Stan / aktualizacja</th>
              <th className="pb-3 pr-4 font-medium hidden md:table-cell">Notatka</th>
              <th className="pb-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const flagged = item.needsRestock;
              return (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    flagged && "bg-warning/5"
                  )}
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {flagged && (
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-warning animate-pulse-warning" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-foreground text-sm block truncate">
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {[item.subcategory, item.unit, item.storehouse].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {item.qtyLeft != null ? (
                      <span className={cn("text-sm font-semibold", flagged ? "text-warning" : "text-foreground")}>
                        {item.qtyLeft} {item.unit}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">brak danych</span>
                    )}
                    {(item.flaggedAt || item.updatedAt) && (
                      <span className="block text-[10px] text-muted-foreground">
                        {formatRelative(item.flaggedAt ?? item.updatedAt!)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    {flagged && (item.restockNote || item.qtyLeft != null || item.qtyToOrder != null) ? (
                      <span className="text-xs text-warning/90">
                        {(item.qtyLeft != null || item.qtyToOrder != null) && (
                          <span className="font-medium">
                            {item.qtyLeft != null && <>zostało: {item.qtyLeft}</>}
                            {item.qtyLeft != null && item.qtyToOrder != null && " · "}
                            {item.qtyToOrder != null && <>zamów: {item.qtyToOrder}</>}
                          </span>
                        )}
                        {item.restockNote && (
                          <span className="italic">
                            {(item.qtyLeft != null || item.qtyToOrder != null) && " — "}
                            "{item.restockNote}"
                          </span>
                        )}
                        {item.flaggedBy && (
                          <span className="block text-[10px] text-muted-foreground">
                            zgłosił: {item.flaggedBy}
                            {item.flaggedAt && <> · {formatFlaggedAt(item.flaggedAt)}</>}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {flagged ? (
                      <div className="flex justify-end gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                          ZGŁOSZONO
                        </span>
                        {onClear && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onClear(item.id)}
                            title="Oznacz jako uzupełnione"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 px-3 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                        onClick={() => openFlag(item)}
                      >
                        <BellRing className="h-3.5 w-3.5" />
                        Niski stan
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!flagging} onOpenChange={(o) => !o && setFlagging(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Zgłoś kierownikowi: niski stan</DialogTitle>
            <DialogDescription>
              {flagging?.name} — podaj ile zostało i ile zamówić.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Ile zostało {flagging?.unit ? `(${flagging.unit})` : ""}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="np. 1"
                  value={qtyLeft}
                  onChange={(e) => setQtyLeft(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && submitFlag()}
                />
                <div className="flex gap-1 pt-0.5">
                  {["0", "1", "2", "5"].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 px-0 text-[11px]"
                      onClick={() => setQtyLeft(v)}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Ile zamówić {flagging?.unit ? `(${flagging.unit})` : ""}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="np. 6"
                  value={qtyToOrder}
                  onChange={(e) => setQtyToOrder(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitFlag()}
                />
                <div className="flex gap-1 pt-0.5">
                  {["1", "2", "6", "12"].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 flex-1 px-0 text-[11px]"
                      onClick={() => setQtyToOrder(v)}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Input
              placeholder="Opcjonalna notatka…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitFlag()}
            />
          </div>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="ghost" onClick={() => setFlagging(null)}>Anuluj</Button>
            <Button onClick={submitFlag} className="gap-1.5">
              <BellRing className="h-4 w-4" /> Zgłoś
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
