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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Item</th>
            <th className="pb-3 pr-4 font-medium text-center">Stock</th>
            <th className="pb-3 pr-4 font-medium text-center">Min</th>
            <th className="pb-3 pr-4 font-medium text-center">Used</th>
            <th className="pb-3 font-medium text-right">Actions</th>
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
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {isLow && (
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          isEmpty ? "text-destructive animate-pulse-warning" : "text-warning"
                        )}
                      />
                    )}
                    <div>
                      <span className="font-medium text-foreground">{item.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{item.unit}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-center">
                  <span
                    className={cn(
                      "inline-block min-w-[2.5rem] rounded-md px-2 py-1 font-heading font-bold",
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
                <td className="py-3 pr-4 text-center text-muted-foreground">{item.minStock}</td>
                <td className="py-3 pr-4 text-center">
                  <span className={cn("font-medium", (item.usedThisShift ?? 0) > 0 ? "text-primary" : "text-muted-foreground")}>
                    {item.usedThisShift ?? 0}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUse(item.id, 1)}
                      disabled={item.quantity === 0}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
