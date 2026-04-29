import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, BookOpen, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";

export default function Recipes() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "signature" | "classic">("all");
  const [search, setSearch] = useState("");
  const { tables, department, meta } = useDepartment();

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tables.recipes)
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((r: any) => {
      const c = (r.category ?? "").toLowerCase();
      if (filter === "signature" && !c.includes("signature")) return false;
      if (filter === "classic" && !c.includes("classic")) return false;
      if (q && !(r.name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [recipes, filter, search]);

  const filters: { key: "all" | "signature" | "classic"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "signature", label: "Signature" },
    { key: "classic", label: "Classic" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={deptHomePath(department)}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-heading text-lg font-bold text-foreground">Recipes</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">· {meta.label}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border rounded-lg"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-all ${
                filter === f.key
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg">No recipes yet</p>
            <p className="text-sm">Recipes are managed from the Admin panel</p>
          </div>
        ) : (
          filtered.map((r: any) => {
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {r.image_url && (
                      <img src={r.image_url} alt={r.name} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-foreground">{r.name}</h3>
                      <span className="text-xs text-primary capitalize">{r.category}</span>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        alt={r.name}
                        className="mx-auto max-h-80 w-auto max-w-full rounded-lg object-contain bg-background/40"
                      />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ingredients</p>
                      <p className="text-sm text-foreground whitespace-pre-line">{r.ingredients}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Instructions</p>
                      <p className="text-sm text-foreground whitespace-pre-line">{r.instructions}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
