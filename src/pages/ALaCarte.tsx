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

  function toggleAllergen(a: string) {
    setExcludedAllergens((curr) =>
      curr.includes(a) ? curr.filter((x) => x !== a) : [...curr, a]
    );
  }

  if (!tableName) return <Navigate to={deptHomePath(department)} replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 min-w-0">
          <Link to={deptHomePath(department)}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[0.6rem] uppercase tracking-[0.45em] text-muted-foreground">
              {meta.label}
            </p>
            <h1
              className="truncate text-lg font-bold tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--brand))" }}
            >
              Menu
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHeaderOpen((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label={headerOpen ? "Zwiń filtry" : "Rozwiń filtry"}
          >
            {headerOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {headerOpen ? (
          <div className="mx-auto max-w-3xl px-4 pb-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj pozycji w menu..."
                className="pl-9 pr-9 bg-secondary/60 border-border/70"
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
              <div className="flex flex-wrap gap-2 -mx-1 px-1">
                <button
                  onClick={() => setActiveCat(null)}
                  className={cn(
                    "flex-1 min-w-[5.5rem] max-w-[7rem] rounded-lg px-2 py-2 text-[0.65rem] uppercase tracking-[0.1em] transition-colors border text-center leading-tight",
                    activeCat === null
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border/70 hover:text-foreground hover:border-primary/50"
                  )}
                >
                  Wszystko
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCat(c === activeCat ? null : c)}
                    className={cn(
                      "flex-1 min-w-[5.5rem] max-w-[7rem] rounded-lg px-2 py-2 text-[0.65rem] uppercase tracking-[0.1em] transition-colors border text-center leading-tight",
                      activeCat === c
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border/70 hover:text-foreground hover:border-primary/50"
                    )}
                  >
                    {c === DRINKS_KEY ? "Napoje" : c}
                  </button>

                ))}
              </div>
            )}

            {allAllergens.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Ukryj pozycje zawierające:</span>
                  </div>
                  {excludedAllergens.length > 0 && (
                    <button
                      onClick={() => setExcludedAllergens([])}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Wyczyść
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                  {allAllergens.map((a) => {
                    const active = excludedAllergens.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => toggleAllergen(a)}
                        className={cn(
                          "flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border whitespace-nowrap transition-colors",
                          active
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                            : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        {active ? <X className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 pb-3">
            <button
              onClick={() => setHeaderOpen(true)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Search className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {activeCat ? (activeCat === DRINKS_KEY ? "Napoje" : activeCat) : "Wszystkie kategorie"}
                  {search && ` · „${search}”`}
                  {excludedAllergens.length > 0 && ` · bez ${excludedAllergens.length} alergenów`}
                </span>
              </span>
              <span className="flex-shrink-0 text-primary font-medium">
                {grouped.reduce((sum, [, list]) => sum + list.length, 0)} poz.
              </span>
            </button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
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
          <p className="text-center text-sm text-muted-foreground py-12">Brak wyników.</p>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card/40 px-5 py-8 sm:px-10 shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.35)]">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-3 h-px w-24 bg-border" />
              <p
                className="text-2xl tracking-[0.35em] uppercase"
                style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--brand))" }}
              >
                512
              </p>
              <p className="mt-1 text-[0.6rem] uppercase tracking-[0.4em] text-muted-foreground">
                Karta Menu
              </p>
              <div className="mx-auto mt-3 h-px w-24 bg-border" />
            </div>

            <div className="space-y-12">
              {grouped.map(([cat, list]) => (
                <section key={cat}>
                  <div className="mb-5 flex items-center gap-4">
                    <span className="h-px flex-1 bg-border/70" />
                    <h2
                      className="text-center text-base sm:text-lg uppercase tracking-[0.3em]"
                      style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--brand))" }}
                    >
                      {cat}
                    </h2>
                    <span className="h-px flex-1 bg-border/70" />
                  </div>

                  <div className="space-y-6">
                    {list.map((it) => (
                      <article key={it.id} className="group">
                        <div className="flex items-baseline gap-2">
                          <h3
                            className="font-semibold uppercase tracking-wide text-foreground text-sm sm:text-base"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {it.name}
                          </h3>
                          <span className="flex-1 translate-y-[-0.2rem] border-b border-dotted border-border/80" />
                          <span
                            className="flex-shrink-0 text-sm sm:text-base font-semibold text-primary"
                            style={{ fontFamily: "'Playfair Display', serif" }}
                          >
                            {Number(it.price_pln).toFixed(0)} PLN
                          </span>
                        </div>

                        {it.description && (
                          <p className="mt-1.5 max-w-xl text-sm italic leading-relaxed text-muted-foreground">
                            {it.description}
                          </p>
                        )}

                        {(it.dietary.length > 0 || it.allergens.length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
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
          </div>
        )}
      </main>

    </div>
  );
}