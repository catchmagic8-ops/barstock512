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
  const { department } = useDepartment();
  const { data: count = 0 } = useQuery({
    queryKey: ["handover-notes-count", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("handover_notes")
        .select("id, resolved, parent_id")
        .eq("department", department)
        .eq("resolved", false)
        .is("parent_id", null);
      if (error) throw error;
      return data?.length ?? 0;
    },
  });
  if (count > 0) {
    return (
      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
        {count} otwart{count === 1 ? "a" : "e"} wiadomoś{count === 1 ? "ć" : "ci"}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      Brak nowych wiadomości
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
  tier?: "primary" | "secondary";
}

const cards: NavCard[] = [
  { title: "MAGAZYN", icon: Package, subtitle: "Stany magazynowe i alerty o niskim stanie", sub: "inventory", badge: LowStockBadge, size: "large", tier: "primary" },
  { title: "WYDARZENIA", icon: Calendar, subtitle: "Nadchodzące wydarzenia i promocje", sub: "events", badge: EventsBadge, size: "small", tier: "secondary" },
  { title: "PRZEPISY", icon: BookOpen, subtitle: "Biblioteka przepisów na koktajle", sub: "recipes", badge: RecipesBadge, size: "small", tier: "secondary" },
  { title: "TELEFON", icon: Phone, subtitle: "Przydatne kontakty i numery", sub: "telephone", badge: ContactsBadge, size: "small", tier: "secondary" },
  { title: "INFO", icon: MessageSquare, subtitle: "Wiadomości i handover dla zespołu", sub: "info", badge: InfoBadge, size: "large", tier: "primary" },
  { title: "QUIZ MENU", icon: FlaskConical, subtitle: "Szkolenie z karty menu: na czas, bez limitu i nauka", sub: "test", badge: TestBadge, size: "small", tier: "secondary" },
  { title: "ADMIN", icon: Shield, subtitle: "Zarządzaj całą zawartością tego działu", sub: "admin", badge: AdminBadge, size: "large", tier: "secondary" },
];

const aLaCarteCard: NavCard = {
  title: "A LA CARTE",
  icon: Utensils,
  subtitle: "Menu dań, alergeny i ceny",
  sub: "a-la-carte",
  badge: ALaCarteBadge,
  size: "large",
  tier: "secondary",
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
  tier: "primary",
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
  tier: "secondary",
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
  tier: "primary",
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
    if (tileOrder.length) {
      result = [...result].sort((a, b) => {
        const ia = tileOrder.indexOf(a.sub);
        const ib = tileOrder.indexOf(b.sub);
        return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
      });
    }
    return result;
  })();


  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackgroundForDepartment intensity={0.4} blur={3} scrim={0.78} />
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80 px-4 py-3 supports-[backdrop-filter]:bg-background/60 supports-[backdrop-filter]:backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150 sm:px-8 sm:py-4">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              title="Powrót do działów"
              aria-label="Powrót do działów"
              className="h-11 w-11 shrink-0 rounded-xl border border-border/50 bg-card/40 text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Sheraton F&amp;B
              </p>
              <h1 className="truncate font-heading text-lg font-bold leading-tight tracking-wide text-brand sm:text-2xl">
                {meta.label}
              </h1>
            </div>
            <ViewerBadge />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Menu"
                aria-label="Menu użytkownika"
                className="h-11 w-11 shrink-0 rounded-xl border border-border/50 bg-card/40 text-muted-foreground transition-colors hover:bg-card/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-60 border-border/60 bg-popover/95 shadow-xl supports-[backdrop-filter]:bg-popover/90 supports-[backdrop-filter]:backdrop-blur-xl motion-reduce:transition-none motion-reduce:animate-none"
            >
              {user && (
                <>
                  <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2 text-xs font-normal text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-foreground">{user.username}</span>
                    <span className="capitalize">· {user.role}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuLabel className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Wygląd
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={toggleTheme} className="min-h-11 gap-2.5 px-2">
                {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
                {theme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAccentOpen(true)} className="min-h-11 gap-2.5 px-2">
                <Palette className="h-4 w-4 shrink-0" />
                Mój kolor akcentu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                Operacje
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setPushOpen(true)} className="min-h-11 gap-2.5 px-2">
                <Bell className="h-4 w-4 shrink-0" />
                Powiadomienia
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrderOpen(true)} className="min-h-11 gap-2.5 px-2">
                <LayoutGrid className="h-4 w-4 shrink-0" />
                Ułóż kafelki
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="min-h-11 gap-2.5 px-2 focus:bg-destructive/10 focus:text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Wyloguj się
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <PersonalAccentDialog open={accentOpen} onOpenChange={setAccentOpen} />
        <NotificationsDialog open={pushOpen} onOpenChange={setPushOpen} />
        <TileOrderDialog
          open={orderOpen}
          onOpenChange={setOrderOpen}
          items={visibleCards.map((c) => ({ sub: c.sub, title: c.title }))}
          onSave={saveTileOrder}
        />

      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 pb-16 sm:px-8">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-4 auto-rows-[minmax(150px,1fr)] sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {visibleCards.map(({ title, icon: Icon, subtitle, sub, badge: Badge, size, tier }) => {
            const isPrimary = tier === "primary";
            return (
              <button
                key={title}
                onClick={() => navigate(deptSubPath(department, sub))}
                className={cn(
                  "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left sm:p-6",
                  "transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "active:scale-[0.985]",
                  isPrimary
                    ? "border-border/60 bg-card/70 shadow-md shadow-black/20 supports-[backdrop-filter]:bg-card/55 supports-[backdrop-filter]:backdrop-blur-md hover:border-primary/50 hover:bg-card/80"
                    : "border-border/40 bg-card/40 shadow-sm shadow-black/10 supports-[backdrop-filter]:bg-card/30 supports-[backdrop-filter]:backdrop-blur-sm hover:border-primary/35 hover:bg-card/60",
                  size === "large" && "sm:col-span-2",
                )}
              >
                {isPrimary && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[2px] bg-primary/60"
                  />
                )}
                <Icon
                  className={cn(
                    isPrimary ? "h-8 w-8 text-primary" : "h-7 w-7 text-primary/80",
                  )}
                />
                <div>
                  <h3
                    className={cn(
                      "font-heading font-bold tracking-wide text-foreground",
                      isPrimary ? "text-lg sm:text-xl" : "text-base sm:text-lg",
                    )}
                  >
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{subtitle}</p>
                  <div className="mt-3">
                    <Badge />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
