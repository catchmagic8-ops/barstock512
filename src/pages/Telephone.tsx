import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Loader2, User, Hash, Search, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";

const slugify = (s: string) =>
  "cat-" + s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function Telephone() {
  const { tables, department, meta } = useDepartment();
  const [search, setSearch] = useState("");
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tables.contacts)
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? contacts.filter((c: any) =>
          [c.name, c.role, c.phone, c.extension, c.category, c.email]
            .filter(Boolean)
            .some((v: string) => v.toLowerCase().includes(q))
        )
      : contacts;

    const map = new Map<string, any[]>();
    for (const c of filtered) {
      const key = c.category || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [contacts, search]);

  const jumpTo = (cat: string) => {
    const el = document.getElementById(slugify(cat));
    if (!el) return;
    const headerOffset = 130; // sticky header height
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  };

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
            <h1 className="font-heading text-lg font-bold text-foreground">Useful Contacts</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">· {meta.label}</span>
          </div>
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
        </div>
      </header>

      <div ref={scrollRootRef} className="relative">
        <main className="mx-auto max-w-3xl px-4 py-6 pr-12 sm:pr-14 space-y-6">
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
              <section key={category} id={slugify(category)} className="space-y-2 scroll-mt-32">
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
                      className="rounded-xl border border-border bg-card p-4 space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {c.role && (
                            <p className="text-xs font-medium text-primary">{c.role}</p>
                          )}
                          <h3 className="font-heading font-bold text-foreground break-words">
                            {c.name}
                          </h3>
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

        {/* Sticky alphabetical category jump-bar */}
        {grouped.length > 0 && (
          <nav
            aria-label="Jump to category"
            className="fixed right-1 top-1/2 z-20 -translate-y-1/2 max-h-[80vh] overflow-y-auto rounded-full border border-border bg-card/90 backdrop-blur-md py-2 px-1 shadow-lg"
          >
            <ul className="flex flex-col items-stretch gap-0.5">
              {grouped.map(([category]) => {
                const initials = category
                  .split(/[\s/()-]+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("");
                return (
                  <li key={category}>
                    <button
                      onClick={() => jumpTo(category)}
                      title={category}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {initials || category[0]}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
