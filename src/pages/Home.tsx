import { useNavigate } from "react-router-dom";
import { Package, Calendar, BookOpen, Phone, Shield, ArrowLeft, Utensils, LogOut, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptSubPath, DEPT_TABLES } from "@/lib/department";
import { useAuth } from "@/contexts/AuthContext";

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

function LowStockBadge() {
  const { tables, department } = useDepartment();
  const { data: count = 0 } = useQuery({
    queryKey: ["low-stock-count", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tables.inventory)
        .select("id, needs_restock")
        .eq("needs_restock", true);
      if (error) throw error;
      return data?.length ?? 0;
    },
  });
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
  const { tables, department } = useDepartment();
  const { data: event } = useQuery({
    queryKey: ["next-event", department],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await (supabase as any)
        .from(tables.events)
        .select("title, event_date")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
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
  const { tables, department } = useDepartment();
  const { data: count = 0 } = useQuery({
    queryKey: ["recipe-count", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from(tables.recipes).select("id");
      if (error) throw error;
      return data?.length ?? 0;
    },
  });
  if (count > 0) {
    return (
      <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {count} recipes
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      0 recipes
    </span>
  );
}

function ContactsBadge() {
  const { data: count = 0 } = useQuery({
    queryKey: ["contact-count", "all"],
    queryFn: async () => {
      const results = await Promise.all(
        (Object.keys(DEPT_TABLES) as Array<keyof typeof DEPT_TABLES>).map(async (d) => {
          const { data, error } = await (supabase as any)
            .from(DEPT_TABLES[d].contacts)
            .select("id");
          if (error) throw error;
          return data?.length ?? 0;
        }),
      );
      return results.reduce((a, b) => a + b, 0);
    },
  });
  return (
    <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {count} contacts
    </span>
  );
}

function AdminBadge() {
  return (
    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
      Password protected
    </span>
  );
}

function ALaCarteBadge() {
  const { tables, department } = useDepartment();
  const tableName = tables.alaCarte;
  const { data: count = 0 } = useQuery({
    queryKey: ["a-la-carte-count", department],
    queryFn: async () => {
      if (!tableName) return 0;
      const { data, error } = await (supabase as any).from(tableName).select("id");
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: !!tableName,
  });
  return (
    <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {count} item{count === 1 ? "" : "s"}
    </span>
  );
}

interface NavCard {
  title: string;
  icon: React.ElementType;
  subtitle: string;
  sub: "inventory" | "events" | "recipes" | "telephone" | "admin" | "a-la-carte" | "reservations";
  badge: () => React.ReactNode;
}

const cards: NavCard[] = [
  { title: "INVENTORY", icon: Package, subtitle: "Track stock levels & low alerts", sub: "inventory", badge: LowStockBadge },
  { title: "EVENTS", icon: Calendar, subtitle: "Upcoming events & promotions", sub: "events", badge: EventsBadge },
  { title: "COCKTAIL RECIPES", icon: BookOpen, subtitle: "Cocktail recipe library & instructions", sub: "recipes", badge: RecipesBadge },
  { title: "TELEPHONE", icon: Phone, subtitle: "Useful contacts & numbers", sub: "telephone", badge: ContactsBadge },
  { title: "ADMIN", icon: Shield, subtitle: "Manage all content for this dept.", sub: "admin", badge: AdminBadge },
];

const aLaCarteCard: NavCard = {
  title: "A LA CARTE",
  icon: Utensils,
  subtitle: "Menu of dishes, allergens & prices",
  sub: "a-la-carte",
  badge: ALaCarteBadge,
};

function ReservationsBadge() {
  const { department } = useDepartment();
  const { data: count = 0 } = useQuery({
    queryKey: ["reservations-count", department],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await (supabase as any)
        .from("reservations_polskie_smaki")
        .select("id")
        .gte("reservation_date", today);
      if (error) throw error;
      return data?.length ?? 0;
    },
    enabled: department === "polskie_smaki",
  });
  return (
    <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {count} upcoming
    </span>
  );
}

const reservationsCard: NavCard = {
  title: "RESERVATIONS",
  icon: BookMarked,
  subtitle: "Table bookings, guests & requests",
  sub: "reservations",
  badge: ReservationsBadge,
};

export default function Home() {
  const navigate = useNavigate();
  const { department, meta } = useDepartment();
  const { isAdminFor, user, logout } = useAuth();
  const canAdmin = isAdminFor(department);

  const visibleCards: NavCard[] = (() => {
    let base = department === "konferencje" ? [...cards] : [...cards];
    // For Polskie Smaki: drop Cocktail Recipes, add A La Carte before Admin.
    // For Bar 512: keep Cocktail Recipes, add A La Carte before Admin.
    let result = base;
    if (department === "polskie_smaki") {
      result = result.filter((c) => c.sub !== "recipes");
    }
    if (department !== "konferencje") {
      const adminIdx = result.findIndex((c) => c.sub === "admin");
      result.splice(adminIdx, 0, aLaCarteCard);
    }
    // Reservations: only Polskie Smaki, inserted before Admin
    if (department === "polskie_smaki") {
      const adminIdx = result.findIndex((c) => c.sub === "admin");
      const insertAt = adminIdx === -1 ? result.length : adminIdx;
      result.splice(insertAt, 0, reservationsCard);
    }
    // Only admins for THIS department see the Admin tile
    if (!canAdmin) result = result.filter((c) => c.sub !== "admin");
    return result;
  })();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            title="Back to Departments"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1
            className="text-xl font-bold tracking-wide sm:text-2xl"
            style={{ fontFamily: "'Playfair Display', serif", color: "#d74c5a" }}
          >
            {meta.label}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              {user.username} · <span className="capitalize">{user.role}</span>
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Sign out"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-16 sm:px-8">
        <div className="mb-10 text-center sm:mb-14">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif", color: "#e8e3d5" }}
          >
            {getGreeting()}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{getFormattedDate()}</p>
        </div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {visibleCards.map(({ title, icon: Icon, subtitle, sub, badge: Badge }) => (
            <button
              key={title}
              onClick={() => navigate(deptSubPath(department, sub))}
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
