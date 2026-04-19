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
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium">Item</th>
              <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium hidden md:table-cell">Note</th>
              <th className="pb-2 sm:pb-3 font-medium text-right">Status</th>
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
                  <td className="py-2 sm:py-3 pr-2 sm:pr-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {flagged && (
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-warning animate-pulse-warning" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-foreground text-xs sm:text-sm block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {item.subcategory ? `${item.subcategory} · ${item.unit}` : item.unit}
                        </span>
                      </div>
                    </div>
                    {flagged && item.restockNote && (
                      <p className="mt-1 text-[11px] text-warning/90 italic md:hidden">
                        “{item.restockNote}”
                      </p>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 pr-2 sm:pr-4 hidden md:table-cell">
                    {flagged && item.restockNote ? (
                      <span className="text-xs text-warning/90 italic">“{item.restockNote}”</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-3 text-right">
                    {flagged ? (
                      <div className="flex justify-end gap-1.5">
                        <span className="hidden sm:inline-flex items-center rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                          NOTIFIED
                        </span>
                        {onClear && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
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
                        className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 px-2 sm:px-3 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                        onClick={() => {
                          setFlagging(item);
                          setNote("");
                        }}
                      >
                        <BellRing className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden sm:inline">Low Stock</span>
                        <span className="sm:hidden">Low</span>
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
        <DialogContent>
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
          <DialogFooter>
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
