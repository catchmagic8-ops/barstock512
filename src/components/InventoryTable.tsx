import { Minus, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InventoryItem } from "@/lib/inventory";
import { cn } from "@/lib/utils";

interface Props {
  items: InventoryItem[];
  onUse: (id: string, qty?: number) => void;
}

export default function InventoryTable({ items, onUse }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">No items in this category</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium">Item</th>
            <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-center">Stock</th>
            <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-center hidden sm:table-cell">Min</th>
            <th className="pb-2 sm:pb-3 pr-2 sm:pr-4 font-medium text-center hidden sm:table-cell">Used</th>
            <th className="pb-2 sm:pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isLow = item.quantity <= item.minStock;
            const isEmpty = item.quantity === 0;

            return (
              <tr
                key={item.id}
                className={cn(
                  "border-b border-border/50 transition-colors",
                  isEmpty && "bg-destructive/5",
                  isLow && !isEmpty && "bg-warning/5"
                )}
              >
                <td className="py-2 sm:py-3 pr-2 sm:pr-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {isLow && (
                      <AlertTriangle
                        className={cn(
                          "h-3.5 w-3.5 flex-shrink-0",
                          isEmpty ? "text-destructive animate-pulse-warning" : "text-warning"
                        )}
                      />
                    )}
                    <div className="min-w-0">
                      <span className="font-medium text-foreground text-xs sm:text-sm block truncate">{item.name}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">{item.unit}</span>
                    </div>
                  </div>
                </td>
                <td className="py-2 sm:py-3 pr-2 sm:pr-4 text-center">
                  <span
                    className={cn(
                      "inline-block min-w-[2rem] sm:min-w-[2.5rem] rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 font-heading font-bold text-xs sm:text-sm",
                      isEmpty
                        ? "bg-destructive/20 text-destructive"
                        : isLow
                        ? "bg-warning/20 text-warning"
                        : "bg-secondary text-foreground"
                    )}
                  >
                    {item.quantity}
                  </span>
                </td>
                <td className="py-2 sm:py-3 pr-2 sm:pr-4 text-center text-muted-foreground hidden sm:table-cell">{item.minStock}</td>
                <td className="py-2 sm:py-3 pr-2 sm:pr-4 text-center hidden sm:table-cell">
                  <span className={cn("font-medium", (item.usedThisShift ?? 0) > 0 ? "text-primary" : "text-muted-foreground")}>
                    {item.usedThisShift ?? 0}
                  </span>
                </td>
                <td className="py-2 sm:py-3 text-right">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => onUse(item.id, 1)}
                    disabled={item.quantity === 0}
                  >
                    <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
