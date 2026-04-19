import { useState } from "react";
import { AlertTriangle, BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import type { InventoryItem } from "@/lib/inventory";
import { cn } from "@/lib/utils";

interface Props {
  items: InventoryItem[];
  onFlag: (id: string, note?: string) => void;
  onClear?: (id: string) => void;
}

export default function InventoryTable({ items, onFlag, onClear }: Props) {
  const [flagging, setFlagging] = useState<InventoryItem | null>(null);
  const [note, setNote] = useState("");

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">No items in this category</p>
      </div>
    );
  }

  const submitFlag = () => {
    if (!flagging) return;
    onFlag(flagging.id, note.trim() || undefined);
    setFlagging(null);
    setNote("");
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
                    {item.subcategory ? `${item.subcategory} · ${item.unit}` : item.unit}
                  </p>
                  {flagged && item.restockNote && (
                    <p className="mt-0.5 text-[11px] text-warning/90 italic truncate">
                      "{item.restockNote}"
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
                      title="Mark as restocked"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                      NOTIFIED
                    </span>
                  )
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] gap-1 px-2.5 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                    onClick={() => {
                      setFlagging(item);
                      setNote("");
                    }}
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    Low
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
            <col className="w-[45%]" />
            <col className="w-[35%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Item</th>
              <th className="pb-3 pr-4 font-medium hidden md:table-cell">Note</th>
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
                          {item.subcategory ? `${item.subcategory} · ${item.unit}` : item.unit}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    {flagged && item.restockNote ? (
                      <span className="text-xs text-warning/90 italic">"{item.restockNote}"</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {flagged ? (
                      <div className="flex justify-end gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                          NOTIFIED
                        </span>
                        {onClear && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onClear(item.id)}
                            title="Mark as restocked"
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
                        onClick={() => {
                          setFlagging(item);
                          setNote("");
                        }}
                      >
                        <BellRing className="h-3.5 w-3.5" />
                        Low Stock
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
            <DialogTitle>Notify manager: low stock</DialogTitle>
            <DialogDescription>
              {flagging?.name} — add an optional note (e.g. "almost empty", "1 left").
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Optional note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && submitFlag()}
          />
          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="ghost" onClick={() => setFlagging(null)}>Cancel</Button>
            <Button onClick={submitFlag} className="gap-1.5">
              <BellRing className="h-4 w-4" /> Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
