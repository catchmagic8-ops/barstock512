import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2, Utensils, Search, X, AlertTriangle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER = [
  "Snacks & Nibbles",
  "Small Plates",
  "Sandwiches & Light Mains",
  "Desserts",
];

interface ALaCarteItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  allergens: string[];
  dietary: string[];
  price_pln: number;
  sort_order: number;
}

function DietaryBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
      <Leaf className="h-3 w-3" />
      {tag}
    </span>
  );
}

function AllergenBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/30">
      <AlertTriangle className="h-3 w-3" />
      {tag}
    </span>
  );
}

export default function ALaCarte() {
  const { tables, department, meta } = useDepartment();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const tableName = tables.alaCarte;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["a-la-carte", department],
    queryFn: async () => {
      if (!tableName) return [] as ALaCarteItem[];
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select("*")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ALaCarteItem[];
    },
    enabled: !!tableName,
  });

  const grouped = useMemo(() => {
    const filtered = items.filter((i) => {
      const matchSearch =
        !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = !activeCat || i.category === activeCat;
      return matchSearch && matchCat;
    });
    const map = new Map<string, ALaCarteItem[]>();
    for (const it of filtered) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category)!.push(it);
    }
    const ordered = CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const);
    // Add unknown categories at the end
    for (const [c, list] of map.entries()) {
      if (!CATEGORY_ORDER.includes(c)) ordered.push([c, list]);
    }
    return ordered;
  }, [items, search, activeCat]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return CATEGORY_ORDER.filter((c) => set.has(c)).concat(
      [...set].filter((c) => !CATEGORY_ORDER.includes(c))
    );
  }, [items]);

  if (!tableName) return <Navigate to={deptHomePath(department)} replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={deptHomePath(department)}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Utensils className="h-5 w-5 text-primary flex-shrink-0" />
            <h1 className="font-heading text-lg font-bold text-foreground truncate">A La Carte</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">· {meta.label}</span>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="pl-9 pr-9 bg-secondary border-border"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                onClick={() => setActiveCat(null)}
                className={cn(
                  "flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  activeCat === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c === activeCat ? null : c)}
                  className={cn(
                    "flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border whitespace-nowrap",
                    activeCat === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Utensils className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg">No menu items yet</p>
            <p className="text-sm">Items are managed from the Admin panel</p>
          </div>
        ) : grouped.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No matches.</p>
        ) : (
          grouped.map(([cat, list]) => (
            <section key={cat} className="space-y-3">
              <h2
                className="text-xl font-bold tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif", color: "#d74c5a" }}
              >
                {cat}
              </h2>
              <div className="space-y-3">
                {list.map((it) => (
                  <article
                    key={it.id}
                    className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading font-bold text-foreground">{it.name}</h3>
                        {it.description && (
                          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                            {it.description}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="font-heading text-base font-bold text-primary">
                          {Number(it.price_pln).toFixed(0)} PLN
                        </span>
                      </div>
                    </div>

                    {(it.dietary.length > 0 || it.allergens.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {it.dietary.map((d) => (
                          <DietaryBadge key={`d-${d}`} tag={d} />
                        ))}
                        {it.allergens.map((a) => (
                          <AllergenBadge key={`a-${a}`} tag={a} />
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}