import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Loader2, User, Hash, Search, List, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath, DEPT_META, DEPT_TABLES, type Department } from "@/lib/department";
import { cn } from "@/lib/utils";

const DEPT_BADGE: Record<Department, string> = {
  bar512: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  konferencje: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  polskie_smaki: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
};
const ALL_DEPTS: Department[] = ["bar512", "konferencje", "polskie_smaki"];

const slugify = (s: string) =>
  "cat-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function Telephone() {
  const { department, meta } = useDepartment();
  const [search, setSearch] = useState("");
  const [activeDepts, setActiveDepts] = useState<Department[]>(ALL_DEPTS);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", "all"],
    queryFn: async () => {
      const results = await Promise.all(
        ALL_DEPTS.map(async (d) => {
          const { data, error } = await (supabase as any)
            .from(DEPT_TABLES[d].contacts)
            .select("*")
            .order("category", { ascending: true })
            .order("name", { ascending: true });
          if (error) throw error;
          return (data ?? []).map((c: any) => ({ ...c, _dept: d as Department }));
        }),
      );
      return results.flat();
    },
  });

  const toggleDept = (d: Department) =>
    setActiveDepts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = contacts.filter((c: any) => {
      if (!activeDepts.includes(c._dept)) return false;
      if (!q) return true;
      return [c.name, c.role, c.phone, c.extension, c.category, c.email]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q));
    });

    const map = new Map<string, any[]>();
    for (const c of filtered) {
      const key = c.category || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [contacts, search, activeDepts]);

  const jumpTo = (cat: string) => {
    const el = document.getElementById(slugify(cat));
    if (!el) return;
    const headerOffset = 140; // sticky header height (title + search)
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
    setMobileNavOpen(false);
  };

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link to={deptHomePath(department)}>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-heading text-lg font-bold text-foreground truncate">Useful Contacts</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">· {meta.label}</span>
          </div>
          {grouped.length > 0 && (
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden gap-1.5 flex-shrink-0"
                  aria-label="Jump to category"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Categories</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card border-border p-0 flex flex-col">
                <SheetHeader className="px-4 py-3 border-b border-border">
                  <SheetTitle className="font-heading text-foreground text-left">Jump to category</SheetTitle>
                </SheetHeader>
                <nav className="flex-1 overflow-y-auto p-2">
                  <ul className="space-y-0.5">
                    {grouped.map(([category, items]) => (
                      <li key={category}>
                        <button
                          onClick={() => jumpTo(category)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <span className="truncate">{category}</span>
                          <span className="text-xs opacity-70 flex-shrink-0">{items.length}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, role, ext, mobile…"
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {ALL_DEPTS.map((d) => {
              const active = activeDepts.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDept(d)}
                  className={cn(
                    "flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border whitespace-nowrap transition-colors",
                    active
                      ? DEPT_BADGE[d]
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  <Building2 className="h-3 w-3" />
                  {DEPT_META[d].label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div ref={scrollRootRef} className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop sticky jump-bar with full labels */}
          {grouped.length > 0 && (
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <nav
                aria-label="Jump to category"
                className="sticky top-[140px] max-h-[calc(100vh-160px)] overflow-y-auto rounded-xl border border-border bg-card/80 backdrop-blur-md p-2"
              >
                <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Categories
                </p>
                <ul className="space-y-0.5">
                  {grouped.map(([category, items]) => (
                    <li key={category}>
                      <button
                        onClick={() => jumpTo(category)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <span className="truncate">{category}</span>
                        <span className="text-[10px] opacity-70 flex-shrink-0">{items.length}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          <main className="flex-1 min-w-0 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Phone className="h-12 w-12 mb-3 opacity-40" />
                <p className="text-lg">No contacts found</p>
                <p className="text-sm">Contacts can be added from the Admin panel</p>
              </div>
            ) : (
              grouped.map(([category, items]) => (
                <section key={category} id={slugify(category)} className="space-y-2 scroll-mt-36">
                  <div className="flex items-center gap-2 px-1">
                    <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-primary">
                      {category}
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((c: any) => (
                      <div
                        key={c.id}
                        className={cn(
                          "rounded-xl border border-border bg-card p-4 space-y-2 transition-opacity",
                          c._dept !== department && "opacity-70"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {c.role && (
                              <p className="text-xs font-medium text-primary">{c.role}</p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-heading font-bold text-foreground break-words">
                                {c.name}
                              </h3>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
                                  DEPT_BADGE[c._dept as Department]
                                )}
                              >
                                <Building2 className="h-2.5 w-2.5" />
                                {DEPT_META[c._dept as Department].shortLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        {(c.extension || c.phone || c.email) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pl-[52px]">
                            {c.extension && (
                              <span className="flex items-center gap-1.5 text-sm text-foreground">
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-mono">{c.extension}</span>
                              </span>
                            )}
                            {c.phone && (
                              <a
                                href={`tel:${c.phone.replace(/\s/g, "")}`}
                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {c.phone}
                              </a>
                            )}
                            {c.email && (
                              <a
                                href={`mailto:${c.email}`}
                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                {c.email}
                              </a>
                            )}
                          </div>
                        )}

                        {c.notes && (
                          <p className="text-xs text-muted-foreground pl-[52px]">{c.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
