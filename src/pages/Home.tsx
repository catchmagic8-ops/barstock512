import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Calendar, BookOpen, Phone, Shield, ArrowLeft, Utensils, LogOut, BookMarked, Sparkles, MoreVertical, Moon, Sun, User, MessageSquare, FlaskConical, Palette , Bell, ClipboardList, LayoutGrid } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptSubPath, DEPT_TABLES } from "@/lib/department";
import { useAuth } from "@/contexts/AuthContext";
import { AmbientBackgroundForDepartment } from "@/components/AmbientBackground";
import PersonalAccentDialog from "@/components/PersonalAccentDialog";
import NotificationsDialog from "@/components/NotificationsDialog";
import TileOrderDialog from "@/components/TileOrderDialog";
import ViewerBadge from "@/components/ViewerBadge";
import { useWeeklyTasksProgress } from "@/hooks/useWeeklyTasks";



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
      <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
        {count} mało
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
      Wszystko OK
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
      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {event.title} · {d}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      Brak wydarzeń
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
      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {count} przepisów
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      0 przepisów
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
    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {count} kontaktów
    </span>
  );
}

function AdminBadge() {
  return (
    <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
      Chronione hasłem
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
    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {count} pozycj{count === 1 ? "a" : "e"}
    </span>
  );
}

function InfoBadge() {

  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      Wiadomości
    </span>
  );
}

function TestBadge() {
  const { user } = useAuth();
  const username = user?.username || "gość";
  const { data: best } = useQuery({
    queryKey: ["quiz-best", username],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("quiz_results")
        .select("score,total,duration_seconds,mode")
        .eq("username", username)
        .neq("mode", "learn")
        .order("score", { ascending: false })
        .order("duration_seconds", { ascending: true, nullsFirst: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  if (best) {
    return (
      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
        Rekord {best.score}/{best.total}
        {best.duration_seconds != null
          ? ` · ${Math.floor(best.duration_seconds / 60)}:${String(best.duration_seconds % 60).padStart(2, "0")}`
          : ""}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      Zagraj pierwszą rundę
    </span>
  );
}

interface NavCard {
  title: string;
  icon: React.ElementType;
  subtitle: string;
  sub: "inventory" | "events" | "recipes" | "telephone" | "admin" | "a-la-carte" | "reservations" | "upselling" | "info" | "test" | "obowiazki";
  badge: () => React.ReactNode;
  size: "large" | "small";
}

const cards: NavCard[] = [
  { title: "INVENTORY", icon: Package, subtitle: "Śledź stany magazynowe i alerty o niskim stanie", sub: "inventory", badge: LowStockBadge, size: "large" },
  { title: "EVENTS", icon: Calendar, subtitle: "Nadchodzące wydarzenia i promocje", sub: "events", badge: EventsBadge, size: "small" },
  { title: "COCKTAIL RECIPES", icon: BookOpen, subtitle: "Biblioteka przepisów na koktajle i instrukcje", sub: "recipes", badge: RecipesBadge, size: "small" },
  { title: "TELEPHONE", icon: Phone, subtitle: "Przydatne kontakty i numery", sub: "telephone", badge: ContactsBadge, size: "small" },
  { title: "INFO", icon: MessageSquare, subtitle: "Wiadomości i handover dla zespołu", sub: "info", badge: InfoBadge, size: "large" },
  { title: "MENU QUIZ", icon: FlaskConical, subtitle: "Szkolenie z karty menu: tryby na czas, bez limitu i nauka", sub: "test", badge: TestBadge, size: "small" },
  { title: "ADMIN", icon: Shield, subtitle: "Zarządzaj całą zawartością dla tego działu", sub: "admin", badge: AdminBadge, size: "large" },
];

const aLaCarteCard: NavCard = {
  title: "A LA CARTE",
  icon: Utensils,
  subtitle: "Menu dań, alergeny i ceny",
  sub: "a-la-carte",
  badge: ALaCarteBadge,
  size: "large",
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
    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {count} nadchodzących
    </span>
  );
}

const reservationsCard: NavCard = {
  title: "RESERVATIONS",
  icon: BookMarked,
  subtitle: "Rezerwacje stolików, goście i prośby",
  sub: "reservations",
  badge: ReservationsBadge,
  size: "large",
};

function UpsellingBadge() {
  const { data: count = 0 } = useQuery({
    queryKey: ["upsell-items-bar512-count"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("upsell_items_bar512")
        .select("id");
      if (error) throw error;
      return data?.length ?? 0;
    },
  });
  return (
    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
      {count} butelk{count === 1 ? "a" : "i"}
    </span>
  );
}

const upsellingCard: NavCard = {
  title: "UPSELLING",
  icon: Sparkles,
  subtitle: "Skanuj butelki i otrzymuj wskazówki sprzedażowe",
  sub: "upselling",
  badge: UpsellingBadge,
  size: "large",
};

function ObowiazkiBadge() {
  const { data } = useWeeklyTasksProgress();
  const total = data?.total ?? 0;
  const done = data?.done ?? 0;
  if (!total) {
    return (
      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
        Brak zadań w tym tygodniu
      </span>
    );
  }
  const allDone = done === total;
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        allDone ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/15 text-primary",
      )}
    >
      {done}/{total} wykonane
    </span>
  );
}

const obowiazkiCard: NavCard = {
  title: "OBOWIĄZKI",
  icon: ClipboardList,
  subtitle: "Tygodniowe zadania zespołu i postęp",
  sub: "obowiazki",
  badge: ObowiazkiBadge,
  size: "large",
};

export default function Home() {

  const navigate = useNavigate();
  const { department, meta } = useDepartment();
  const { isAdminFor, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [accentOpen, setAccentOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const canAdmin = isAdminFor(department);
  const orderStorageKey = `tile_order_${department}_${user?.username ?? "guest"}`;
  const [tileOrder, setTileOrder] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(orderStorageKey);
      setTileOrder(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setTileOrder([]);
    }
  }, [orderStorageKey]);

  const saveTileOrder = (order: string[]) => {
    setTileOrder(order);
    try {
      if (order.length) localStorage.setItem(orderStorageKey, JSON.stringify(order));
      else localStorage.removeItem(orderStorageKey);
    } catch {
      /* ignore */
    }
  };


  const visibleCards: NavCard[] = (() => {
    let base = [...cards];
    let result = base;
    if (department === "polskie_smaki") {
      result = result.filter((c) => c.sub !== "recipes");
    }
    if (department !== "konferencje") {
      const adminIdx = result.findIndex((c) => c.sub === "admin");
      result.splice(adminIdx, 0, aLaCarteCard);
    }
    if (department === "polskie_smaki") {
      const adminIdx = result.findIndex((c) => c.sub === "admin");
      const insertAt = adminIdx === -1 ? result.length : adminIdx;
      result.splice(insertAt, 0, reservationsCard);
    }
    if (department === "bar512") {
      const adminIdx = result.findIndex((c) => c.sub === "admin");
      const insertAt = adminIdx === -1 ? result.length : adminIdx;
      result.splice(insertAt, 0, upsellingCard, obowiazkiCard);
    }
    if (!canAdmin) result = result.filter((c) => c.sub !== "admin" && c.sub !== "events");
    return result;
  })();

  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackgroundForDepartment intensity={0.4} blur={3} />
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/40 bg-background/40 px-5 py-4 backdrop-blur-xl backdrop-saturate-150 sm:px-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            title="Powrót do działów"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-xl font-bold tracking-wide text-brand sm:text-2xl">
            {meta.label}
          </h1>
          <ViewerBadge />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              title="Menu"
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-popover/90 backdrop-blur-xl backdrop-saturate-150"
          >
            {user && (
              <>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  {user.username} · <span className="capitalize">{user.role}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={toggleTheme} className="gap-2">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAccentOpen(true)} className="gap-2">
              <Palette className="h-4 w-4" />
              Mój kolor akcentu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPushOpen(true)} className="gap-2">
              <Bell className="h-4 w-4" />
              Powiadomienia
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Wyloguj się
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <PersonalAccentDialog open={accentOpen} onOpenChange={setAccentOpen} />
        <NotificationsDialog open={pushOpen} onOpenChange={setPushOpen} />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-16 sm:px-8">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-5 auto-rows-[minmax(160px,1fr)] sm:grid-cols-3 sm:gap-6">
          {visibleCards.map(({ title, icon: Icon, subtitle, sub, badge: Badge, size }) => (
            <button
              key={title}
              onClick={() => navigate(deptSubPath(department, sub))}
              className={cn(
                "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-6 text-left transition-all duration-300",
                "hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]",
                size === "large" && "sm:col-span-2"
              )}
            >
              <Icon className={cn("text-primary", size === "large" ? "h-9 w-9" : "h-7 w-7")} />
              <div>
                <h3 className="font-heading text-lg font-bold tracking-wider text-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                <div className="mt-3">
                  <Badge />
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
