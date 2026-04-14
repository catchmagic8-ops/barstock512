import { useNavigate } from "react-router-dom";
import { Package, Calendar, BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function useLowStockCount() {
  return useQuery({
    queryKey: ["low-stock-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, quantity, min_stock");
      if (error) throw error;
      return (data ?? []).filter((i) => i.quantity < i.min_stock).length;
    },
  });
}

function useNextEvent() {
  return useQuery({
    queryKey: ["next-event"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("events")
        .select("title, event_date")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

function useRecipeCount() {
  return useQuery({
    queryKey: ["recipe-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("id");
      if (error) throw error;
      return data?.length ?? 0;
    },
  });
}

function LowStockBadge() {
  const { data: count = 0 } = useLowStockCount();
  if (count > 0) {
    return (
      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
        {count} low
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
      All good
    </span>
  );
}

function EventsBadge() {
  const { data: event } = useNextEvent();
  if (event) {
    const d = new Date(event.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return (
      <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {event.title} · {d}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      No events yet
    </span>
  );
}

function RecipesBadge() {
  const { data: count = 0 } = useRecipeCount();
  if (count > 0) {
    return (
      <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {count} cocktails
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      0 cocktails
    </span>
  );
}

interface NavCard {
  title: string;
  icon: React.ElementType;
  subtitle: string;
  to: string;
  badge: () => React.ReactNode;
}

const cards: NavCard[] = [
  {
    title: "INVENTORY",
    icon: Package,
    subtitle: "Track stock levels & low alerts",
    to: "/inventory",
    badge: LowStockBadge,
  },
  {
    title: "WHAT'S NEW",
    icon: Calendar,
    subtitle: "Upcoming events & promotions",
    to: "/events",
    badge: EventsBadge,
  },
  {
    title: "RECIPES",
    icon: BookOpen,
    subtitle: "Cocktail library & instructions",
    to: "/recipes",
    badge: RecipesBadge,
  },
];

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("bar-unlocked");
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0f0e0c" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <h1
          className="text-xl font-bold tracking-wide sm:text-2xl"
          style={{ fontFamily: "'Playfair Display', serif", color: "#d74c5a" }}
        >
          Bar Manager
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Logout"
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-16 sm:px-8">
        {/* Greeting */}
        <div className="mb-10 text-center sm:mb-14">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif", color: "#e8e3d5" }}
          >
            {getGreeting()}, Mathew
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{getFormattedDate()}</p>
        </div>

        {/* Navigation cards */}
        <div className="grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {cards.map(({ title, icon: Icon, subtitle, to, badge: Badge }) => (
            <button
              key={title}
              onClick={() => navigate(to)}
              className={cn(
                "group flex flex-col items-center gap-3 rounded-xl border px-6 py-8 text-center transition-all duration-300",
                "hover:scale-[1.03]"
              )}
              style={{
                borderColor: "rgba(215, 76, 90, 0.4)",
                background: "rgba(215, 76, 90, 0.04)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 20px rgba(215, 76, 90, 0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <Icon className="h-8 w-8 text-primary" />
              <h3
                className="text-lg font-bold tracking-wider"
                style={{ fontFamily: "'Playfair Display', serif", color: "#e8e3d5" }}
              >
                {title}
              </h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
              <Badge />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
