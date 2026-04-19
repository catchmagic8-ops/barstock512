import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";

export default function Telephone() {
  const { tables, department, meta } = useDepartment();
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tables.contacts)
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

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
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Phone className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg">No contacts yet</p>
            <p className="text-sm">Contacts can be added from the Admin panel</p>
          </div>
        ) : (
          contacts.map((c: any) => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-bold text-foreground">{c.name}</h3>
                  {c.role && <p className="text-xs text-primary">{c.role}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pl-[52px]">
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
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

              {c.notes && (
                <p className="text-xs text-muted-foreground pl-[52px]">{c.notes}</p>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
