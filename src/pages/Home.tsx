import { useNavigate } from "react-router-dom";
import { Package, Calendar, BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface NavCard {
  title: string;
  icon: React.ElementType;
  subtitle: string;
  to: string;
  badge: () => React.ReactNode;
}

function LowStockBadge() {
  try {
    const raw = localStorage.getItem("low-stock-count");
    const count = raw ? parseInt(raw, 10) : 0;
    if (count > 0) {
      return (
        <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
          {count} low
        </span>
      );
    }
  } catch {}
  return (
    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
      All good
    </span>
  );
}

function EventsBadge() {
  try {
    const raw = localStorage.getItem("next-event");
    if (raw) {
      const { name, date } = JSON.parse(raw);
      return (
        <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {name} · {date}
        </span>
      );
    }
  } catch {}
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      No events yet
    </span>
  );
}

function RecipesBadge() {
  try {
    const raw = localStorage.getItem("recipe-count");
    const count = raw ? parseInt(raw, 10) : 0;
    if (count > 0) {
      return (
        <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {count} cocktails
        </span>
      );
    }
  } catch {}
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      0 cocktails
    </span>
  );
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
