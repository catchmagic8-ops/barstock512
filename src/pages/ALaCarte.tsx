import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Loader2, Utensils, Search, X, Leaf, ShieldCheck, ChevronUp, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER = [
  "Przekąski",
  "Pizza",
  "Sałatki",
  "Pomiędzy bułkami",
  "Zupy",
  "Makarony",
  "Dania główne",
  "Słodkości",
  "Dla dzieci",
  "Koktajle firmowe",
  "Spritzery",
  "Moktajle",
  "Szampany i wina musujące",
  "Wino białe",
  "Wino czerwone",
  "Wino różowe",
  "Piwo",
  "Wódka",
  "Whisky i whiskey",
  "Cognac i brandy",
  "Gin",
  "Rum",
  "Tequila",
  "Zimne napoje i soki",
  "Kawa i herbata",
];

/** Wszystkie kategorie napojów — na liście filtrów łączone w jeden kafelek „Napoje”. */
const DRINK_CATEGORIES = new Set([
  "Koktajle firmowe",
  "Spritzery",
  "Moktajle",
  "Szampany i wina musujące",
  "Wino białe",
  "Wino czerwone",
  "Wino różowe",
  "Piwo",
  "Wódka",
  "Whisky i whiskey",
  "Cognac i brandy",
  "Gin",
  "Rum",
  "Tequila",
  "Zimne napoje i soki",
  "Kawa i herbata",
]);

const DRINKS_KEY = "__napoje__";


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
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[0.68rem] font-medium text-emerald-500 dark:text-emerald-400">
      <Leaf className="h-3 w-3" />
      {tag}
    </span>
  );
}

function AllergenBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[0.68rem] font-medium text-muted-foreground">
      {tag}
    </span>
  );
}


export default function ALaCarte() {
  const { tables, department, meta } = useDepartment();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [headerOpen, setHeaderOpen] = useState(true);
  const [allergOpen, setAllergOpen] = useState(false);

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
      const matchCat =
        !activeCat ||
        (activeCat === DRINKS_KEY ? DRINK_CATEGORIES.has(i.category) : i.category === activeCat);

      const matchAllergens =
        excludedAllergens.length === 0 ||
        !i.allergens.some((a) =>
          excludedAllergens.some((ex) => a.toLowerCase().includes(ex.toLowerCase()))
        );
      return matchSearch && matchCat && matchAllergens;
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
  }, [items, search, activeCat, excludedAllergens]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    const food = CATEGORY_ORDER.filter((c) => set.has(c) && !DRINK_CATEGORIES.has(c));
    const unknown = [...set].filter((c) => !CATEGORY_ORDER.includes(c));
    const hasDrinks = [...set].some((c) => DRINK_CATEGORIES.has(c));
    return [...food, ...unknown, ...(hasDrinks ? [DRINKS_KEY] : [])];
  }, [items]);


  const allAllergens = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      for (const a of it.allergens) set.add(a);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const totalCount = useMemo(
    () => grouped.reduce((sum, [, list]) => sum + list.length, 0),
    [grouped]
  );

  function toggleAllergen(a: string) {
    setExcludedAllergens((curr) =>
      curr.includes(a) ? curr.filter((x) => x !== a) : [...curr, a]
    );
  }

  if (!tableName) return <Navigate to={deptHomePath(department)} replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="app-header sticky top-0 z-30 order/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5 min-w-0 sm:px-4">
          <Link to={deptHomePath(department)} className="flex-shrink-0">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-base font-semibold tracking-wide sm:text-lg"
              style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--brand))" }}
            >
              Karta Menu
            </h1>
            <p className="truncate text-[0.7rem] text-muted-foreground">
              {activeCat ? (activeCat === DRINKS_KEY ? "Napoje" : activeCat) : "Wszystkie kategorie"}
              {" · "}
              {totalCount} poz.
            </p>
          </div>
          <Button
            variant={headerOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setHeaderOpen((v) => !v)}
            className="flex-shrink-0 gap-1.5 text-xs"
            aria-label={headerOpen ? "Zwiń filtry" : "Rozwiń filtry"}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtry</span>
            {headerOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {headerOpen && (
          <div className="mx-auto max-w-3xl space-y-2.5 px-3 pb-3 sm:px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj w menu..."
                className="h-10 border-border/70 bg-secondary/50 pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Wyczyść wyszukiwanie"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setActiveCat(null)}
                  className={cn(
                    "flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    activeCat === null
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/70 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  Wszystko
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCat(c === activeCat ? null : c)}
                    className={cn(
                      "flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                      activeCat === c
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {c === DRINKS_KEY ? "Napoje" : c}
                  </button>
                ))}
              </div>
            )}

            {allAllergens.length > 0 && (
              <div className="rounded-lg border border-border/60 bg-card/50">
                <button
                  onClick={() => setAllergOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Ukryj alergeny
                    {excludedAllergens.length > 0 && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary">
                        {excludedAllergens.length}
                      </span>
                    )}
                  </span>
                  {allergOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {allergOpen && (
                  <div className="flex flex-wrap gap-1.5 border-t border-border/50 px-3 py-2.5">
                    {allAllergens.map((a) => {
                      const active = excludedAllergens.includes(a);
                      return (
                        <button
                          key={a}
                          onClick={() => toggleAllergen(a)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                            active
                              ? "border-primary/50 bg-primary/15 text-primary"
                              : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {active && <X className="h-3 w-3" />}
                          {a}
                        </button>
                      );
                    })}
                    {excludedAllergens.length > 0 && (
                      <button
                        onClick={() => setExcludedAllergens([])}
                        className="ml-auto text-xs text-muted-foreground underline hover:text-foreground"
                      >
                        Wyczyść
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Utensils className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg">Brak pozycji w menu</p>
            <p className="text-sm">Pozycje dodaje się w panelu administratora</p>
          </div>
        ) : grouped.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Brak wyników.</p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([cat, list]) => (
              <section key={cat} className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
                <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-secondary/40 px-4 py-2.5">
                  <h2
                    className="text-sm font-semibold uppercase tracking-[0.18em] sm:text-base"
                    style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--brand))" }}
                  >
                    {cat}
                  </h2>
                  <span className="flex-shrink-0 text-[0.7rem] text-muted-foreground">{list.length}</span>
                </div>

                <div className="divide-y divide-border/50">
                  {list.map((it) => (
                    <article key={it.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[0.95rem] font-semibold leading-snug text-foreground">
                          {it.name}
                        </h3>
                        <span className="flex-shrink-0 whitespace-nowrap text-[0.95rem] font-bold text-primary">
                          {Number(it.price_pln).toFixed(0)} zł
                        </span>
                      </div>

                      {it.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {it.description}
                        </p>
                      )}

                      {(it.dietary.length > 0 || it.allergens.length > 0) && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
            ))}
          </div>
        )}
      </main>


    </div>
  );
}