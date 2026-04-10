import { useState, useCallback, useMemo } from "react";
import { AlertTriangle, RotateCcw, Truck, Settings, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/bar-logo.png";
import { Button } from "@/components/ui/button";
import CategoryTabs from "@/components/CategoryTabs";
import InventoryTable from "@/components/InventoryTable";
import RestockDialog from "@/components/RestockDialog";
import { generateReport } from "@/lib/generateReport";
import type { Category } from "@/lib/inventory";
import { useInventory } from "@/hooks/useInventory";

export default function Index() {
  const { items, isLoading, updateItem, updateMany } = useInventory();
  const [activeCategory, setActiveCategory] = useState<Category>("spirits");
  const [restockOpen, setRestockOpen] = useState(false);

  const handleUse = useCallback(
    (id: string, qty: number = 1) => {
      const item = items.find((i) => i.id === id);
      if (!item || item.quantity <= 0) return;
      updateItem.mutate({
        ...item,
        quantity: Math.max(0, item.quantity - qty),
        usedThisShift: (item.usedThisShift ?? 0) + qty,
      });
    },
    [items, updateItem]
  );

  const handleResetShift = useCallback(() => {
    updateMany.mutate(
      items.map((i) => ({ id: i.id, quantity: i.quantity, used_this_shift: 0 }))
    );
  }, [items, updateMany]);

  const handleRestock = useCallback(
    (restockMap: Record<string, number>) => {
      const updates = items
        .filter((i) => restockMap[i.id])
        .map((i) => ({
          id: i.id,
          quantity: i.quantity + restockMap[i.id],
          used_this_shift: i.usedThisShift,
        }));
      updateMany.mutate(updates);
    },
    [items, updateMany]
  );

  const counts = useMemo(
    () => ({
      spirits: items.filter((i) => i.category === "spirits").length,
      wine: items.filter((i) => i.category === "wine").length,
      beer: items.filter((i) => i.category === "beer").length,
      "soft-drinks": items.filter((i) => i.category === "soft-drinks").length,
      "tea-coffee": items.filter((i) => i.category === "tea-coffee").length,
      reusables: items.filter((i) => i.category === "reusables").length,
    }),
    [items]
  );

  const filtered = useMemo(
    () =>
      items
        .filter((i) => i.category === activeCategory)
        .sort((a, b) => {
          const aLow = a.quantity <= a.minStock ? 0 : 1;
          const bLow = b.quantity <= b.minStock ? 0 : 1;
          return aLow - bLow;
        }),
    [items, activeCategory]
  );

  const lowStockCount = useMemo(
    () => items.filter((i) => i.quantity <= i.minStock).length,
    [items]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Logo" className="h-7 w-7 sm:h-8 sm:w-8" width={32} height={32} />
            <div>
              <h1 className="font-heading text-base font-bold leading-tight text-foreground sm:text-lg">
                BAR INVENTORY
              </h1>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                {items.length} items tracked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1.5">
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning sm:px-2.5 sm:py-1 sm:text-xs">
                <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {lowStockCount}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={handleResetShift} title="Reset shift counters" className="h-8 w-8 text-muted-foreground hover:text-foreground sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Reset Shift</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setRestockOpen(true)} title="Add delivery stock" className="h-8 w-8 text-muted-foreground hover:text-foreground sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Restock</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => generateReport(items)} title="Generate report" className="h-8 w-8 text-muted-foreground hover:text-foreground sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Report</span>
            </Button>
            <Link to="/options">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Options</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-3 sm:px-4 sm:py-6">
        <div className="flex gap-6">
          <div className="hidden lg:flex flex-col items-center justify-center pt-4">
            <img src={logo} alt="Logo" className="w-64 h-auto opacity-80" loading="lazy" />
          </div>

          <div className="flex-1 space-y-3 sm:space-y-6">
            <CategoryTabs active={activeCategory} onSelect={setActiveCategory} counts={counts} />
            <div className="rounded-lg border border-border bg-card p-2 sm:p-4">
              <InventoryTable items={filtered} onUse={handleUse} />
            </div>
          </div>
        </div>
      </main>

      <RestockDialog
        open={restockOpen}
        onClose={() => setRestockOpen(false)}
        items={items}
        onRestock={handleRestock}
      />
    </div>
  );
}
