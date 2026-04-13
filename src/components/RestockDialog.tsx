import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InventoryItem } from "@/lib/inventory";

interface Props {
  open: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onRestock: (restockMap: Record<string, number>) => void;
}

export default function RestockDialog({ open, onClose, items, onRestock }: Props) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const lowItems = items.filter((i) => i.quantity < i.minStock);
  const displayItems = lowItems.length > 0 ? lowItems : items;

  const handleSubmit = () => {
    const map: Record<string, number> = {};
    Object.entries(quantities).forEach(([id, val]) => {
      const n = parseInt(val, 10);
      if (n > 0) map[id] = n;
    });
    if (Object.keys(map).length > 0) {
      onRestock(map);
    }
    setQuantities({});
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">
            Restock Delivery
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {lowItems.length > 0
              ? `Showing ${lowItems.length} low-stock items`
              : "Enter quantities received"}
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {displayItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Current: {item.quantity} {item.unit}
                </p>
              </div>
              <Input
                type="number"
                min={0}
                placeholder="0"
                className="w-20 text-center bg-secondary border-border"
                value={quantities[item.id] || ""}
                onChange={(e) =>
                  setQuantities((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Confirm Delivery</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
