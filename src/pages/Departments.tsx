import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import bar512Img from "@/assets/dept-bar512.jpg";
import konferencjeImg from "@/assets/dept-konferencje.jpg";
import polskieSmakiImg from "@/assets/dept-polskie-smaki.jpg";

interface Tile {
  title: string;
  tagline: string;
  image: string;
  to: string;
}

const tiles: Tile[] = [
  { title: "Bar 512", tagline: "Cocktails · Stock · Service", image: bar512Img, to: "/home" },
  { title: "Konferencje", tagline: "Events · Conference Operations", image: konferencjeImg, to: "/konferencje" },
  { title: "Polskie Smaki", tagline: "Kitchen · Recipes · Supplies", image: polskieSmakiImg, to: "/polskie-smaki" },
];

export default function Departments() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("bar-unlocked");
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <h1
          className="text-xl font-bold tracking-wide sm:text-2xl"
          style={{ fontFamily: "'Playfair Display', serif", color: "#d74c5a" }}
        >
          Departments
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

      <main className="flex flex-1 flex-col items-center justify-center px-5 pb-16 sm:px-8">
        <div className="mb-10 text-center sm:mb-14">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif", color: "#e8e3d5" }}
          >
            Choose a department
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Each department has its own inventory, events, recipes & contacts.
          </p>
        </div>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
          {tiles.map((t, idx) => (
            <button
              key={t.title}
              onClick={() => navigate(t.to)}
              className="group relative overflow-hidden rounded-2xl border text-left transition-all duration-500 hover:scale-[1.02]"
              style={{
                borderColor: "rgba(215, 76, 90, 0.4)",
                aspectRatio: "4/5",
              }}
            >
              <img
                src={t.image}
                alt={t.title}
                width={1024}
                height={768}
                loading={idx === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(15,14,12,0.15) 0%, rgba(15,14,12,0.55) 55%, rgba(15,14,12,0.95) 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3
                  className="text-2xl font-bold leading-tight sm:text-3xl"
                  style={{ fontFamily: "'Playfair Display', serif", color: "#e8e3d5" }}
                >
                  {t.title}
                </h3>
                <p className="mt-1.5 text-sm" style={{ color: "rgba(232, 227, 213, 0.7)" }}>
                  {t.tagline}
                </p>
                <span
                  className="mt-4 inline-block text-xs font-semibold tracking-widest uppercase"
                  style={{ color: "#d74c5a" }}
                >
                  Enter →
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
