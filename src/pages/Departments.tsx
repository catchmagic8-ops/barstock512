import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import bar512Img from "@/assets/dept-bar512.jpg";
import AmbientBackground, { DEPT_AMBIENT } from "@/components/AmbientBackground";
import { DEPT_AMBIENT_IMAGE_KEY, DEPT_TILE_IMAGE_KEY, getSettings } from "@/lib/appSettings";

interface Tile {
  title: string;
  tagline: string;
  image: string;
  to: string;
}

const SETTING_KEYS = [DEPT_TILE_IMAGE_KEY, DEPT_AMBIENT_IMAGE_KEY];

export default function Departments() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: settings = {} } = useQuery({
    queryKey: ["app-settings", "dept-images"],
    queryFn: () => getSettings(SETTING_KEYS),
  });

  const tiles: Tile[] = [
    {
      title: "Bar 512",
      tagline: "Cocktails · Stock · Service",
      image: settings[DEPT_TILE_IMAGE_KEY] || bar512Img,
      to: "/home",
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackground src={settings[DEPT_AMBIENT_IMAGE_KEY] || DEPT_AMBIENT.bar512} intensity={0.35} blur={4} />
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/40 bg-background/40 px-5 py-4 backdrop-blur-xl backdrop-saturate-150 sm:px-8">
        <h1 className="font-heading text-xl font-bold tracking-wide text-brand sm:text-2xl">
          Departments
        </h1>
        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {user.username} · <span className="capitalize">{user.role}</span>
            </span>
          )}
          <ThemeToggle />
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
        <div className="grid w-full max-w-sm grid-cols-1 gap-5 sm:gap-6">
          {tiles.map((t, idx) => (
            <button
              key={t.title}
              onClick={() => navigate(t.to)}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/[0.03] text-left backdrop-blur-md transition-all duration-500 hover:scale-[1.02] hover:bg-background/[0.06]"
              style={{
                aspectRatio: "4/5",
                boxShadow: "0 20px 60px -20px hsl(var(--background) / 0.6)",
              }}
            >
              <img
                src={t.image}
                alt={t.title}
                width={1024}
                height={768}
                loading={idx === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, hsl(var(--background) / 0.15) 0%, hsl(var(--background) / 0.55) 55%, hsl(var(--background) / 0.95) 100%)",
                }}
              />
              <span className="sr-only">{t.title}</span>
            </button>

          ))}
        </div>
      </main>
    </div>
  );
}
