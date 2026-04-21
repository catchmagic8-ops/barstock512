import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Calendar, Clock, Tag, Repeat, Users, UtensilsCrossed, Wine, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";

const categoryColor = (cat: string) => {
  const colors: Record<string, string> = {
    Wave: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    Conference: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Bar512: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };
  return colors[cat] || "bg-muted text-muted-foreground border-border";
};

export default function Events() {
  const { tables, department, meta } = useDepartment();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tables.events)
        .select("*")
        .order("event_date", { ascending: true });
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
            <h1 className="font-heading text-lg font-bold text-foreground">Events</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">· {meta.label}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg">No events yet</p>
            <p className="text-sm">Events are managed from the Admin panel</p>
          </div>
        ) : (
          events.map((ev: any) => (
            <div key={ev.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-foreground text-base">{ev.title}</h3>
              </div>

              {ev.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{ev.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={categoryColor(ev.category || "General")}>
                  <Tag className="h-3 w-3 mr-1" />
                  {ev.category || "General"}
                </Badge>

                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(ev.event_date), "EEE, d MMM yyyy")}
                </Badge>

                {ev.event_time && (
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                    <Clock className="h-3 w-3 mr-1" />
                    {ev.event_time.slice(0, 5)}
                  </Badge>
                )}

                {ev.location && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                    <MapPin className="h-3 w-3 mr-1" />
                    {ev.location}
                  </Badge>
                )}

                {ev.guest_count != null && (
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                    <Users className="h-3 w-3 mr-1" />
                    {ev.guest_count} {ev.guest_count === 1 ? "guest" : "guests"}
                  </Badge>
                )}

                {ev.is_recurring && (
                  <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">
                    <Repeat className="h-3 w-3 mr-1" />
                    {ev.recurrence_rule || "recurring"}
                  </Badge>
                )}
              </div>

              {(ev.food_menu || ev.beverage_menu) && (
                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                  {ev.food_menu && (
                    <div className="rounded-lg border border-border bg-secondary/40 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        <UtensilsCrossed className="h-3.5 w-3.5" /> Food
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line">{ev.food_menu}</p>
                    </div>
                  )}
                  {ev.beverage_menu && (
                    <div className="rounded-lg border border-border bg-secondary/40 p-3">
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        <Wine className="h-3.5 w-3.5" /> Beverage
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-line">{ev.beverage_menu}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
