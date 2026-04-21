import { useState, useCallback, useMemo } from "react";
import { AlertTriangle, FileText, Loader2, Home, Search, BellRing } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/bar-logo.png";
import { Button } from "@/components/ui/button";
import CategoryTabs from "@/components/CategoryTabs";
import InventoryTable from "@/components/InventoryTable";
import { Input } from "@/components/ui/input";
import { generateReport } from "@/lib/generateReport";
import type { Category } from "@/lib/inventory";
import { useInventory } from "@/hooks/useInventory";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";
import { toast } from "sonner";

export default function Index() {
  const { items, isLoading, flagItem, clearFlag } = useInventory();
  const { tables, department, meta } = useDepartment();
  const [activeCategory, setActiveCategory] = useState<Category>("spirits");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subcategories = [] } = useQuery({
    queryKey: ["subcategories", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from(tables.subcategories).select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const currentSubs = useMemo(
    () => subcategories.filter((s: any) => s.category === activeCategory),
    [subcategories, activeCategory]
  );

  const handleCategoryChange = useCallback((cat: Category) => {
    setActiveCategory(cat);
    setActiveSubcategory(null);
  }, []);

  const handleFlag = useCallback(
    (id: string, note?: string) => {
      flagItem.mutate(
        { id, note },
        {
          onSuccess: () => toast.success("Manager notified"),
          onError: () => toast.error("Failed to notify"),
        }
      );
    },
    [flagItem]
  );

  const handleClear = useCallback(
    (id: string) => {
      clearFlag.mutate(id, {
        onSuccess: () => toast.success("Marked as restocked"),
        onError: () => toast.error("Failed to update"),
      });
    },
    [clearFlag]
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
        .filter((i) => searchQuery
          ? i.name.toLowerCase().includes(searchQuery.toLowerCase())
          : i.category === activeCategory && (!activeSubcategory || i.subcategory === activeSubcategory)
        )
        .sort((a, b) => Number(b.needsRestock) - Number(a.needsRestock)),
    [items, activeCategory, activeSubcategory, searchQuery]
  );

  const flaggedCount = useMemo(
    () => items.filter((i) => i.needsRestock).length,
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
    <div className="flex min-h-screen flex-col bg-background overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Logo" className="h-7 w-7 sm:h-8 sm:w-8" width={32} height={32} />
            <div>
              <h1 className="font-heading text-base font-bold leading-tight text-foreground sm:text-lg">
                {meta.label.toUpperCase()} INVENTORY
              </h1>
              <p className="text-[10px] text-muted-foreground sm:text-xs">
                {items.length} items tracked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <Link to={deptHomePath(department)}>
              <Button variant="ghost" size="icon" title="Back to Home" className="h-8 w-8 text-muted-foreground hover:text-foreground sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline text-sm">Home</span>
              </Button>
            </Link>
            {flaggedCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning sm:px-2.5 sm:py-1 sm:text-xs">
                <BellRing className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {flaggedCount}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={() => generateReport(items)} title="Generate report" className="h-8 w-8 text-muted-foreground hover:text-foreground sm:h-9 sm:w-auto sm:px-3 sm:gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Report</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-2 py-2 sm:px-4 sm:py-6">
        <div className="flex gap-6">
          {department === "bar512" && (
            <div className="hidden lg:flex flex-col items-center justify-center pt-4">
              <img src={logo} alt="Logo" className="w-64 h-auto opacity-80" loading="lazy" />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-3 sm:space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card border-border rounded-lg"
              />
            </div>
            <CategoryTabs active={activeCategory} onSelect={handleCategoryChange} counts={counts} />
            {currentSubs.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1 px-1 pb-1">
                <button
                  onClick={() => setActiveSubcategory(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap snap-start flex-shrink-0 transition-all ${
                    activeSubcategory === null
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
                  }`}
                >
                  All
                </button>
                {currentSubs.map((sub: any) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubcategory(sub.name)}
                    className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap snap-start flex-shrink-0 transition-all ${
                      activeSubcategory === sub.name
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
            {flaggedCount > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{flaggedCount} item{flaggedCount === 1 ? "" : "s"} flagged for restock — managers have been notified.</span>
              </div>
            )}
            <div className="rounded-lg border border-border bg-card p-2 sm:p-4">
              <InventoryTable items={filtered} onFlag={handleFlag} onClear={handleClear} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
