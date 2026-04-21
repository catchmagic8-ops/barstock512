import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import barLogo from "@/assets/sheraton-logo.png";

const PASS = "5sheraton12";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("bar-unlocked") === "1");
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASS) {
      sessionStorage.setItem("bar-unlocked", "1");
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Left panel with logo (desktop only) — vertically centered to match form */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-card border-r border-border p-8">
        <img
          src={barLogo}
          alt="Sheraton"
          className="max-h-[60vh] w-auto object-contain opacity-90"
        />
      </div>

      {/* Right panel with password form */}
      <div className="flex w-full md:w-1/2 items-center justify-center px-5 py-8 sm:p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-6 sm:space-y-7"
        >
          {/* Mobile logo */}
          <div className="flex justify-center md:hidden">
            <img
              src={barLogo}
              alt="Sheraton"
              className="h-28 w-28 xs:h-32 xs:w-32 object-contain opacity-90"
            />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
              Staff Access
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter password to continue
            </p>
          </div>

          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              autoFocus
              inputMode="text"
              autoComplete="current-password"
              className="bg-card h-11 text-base"
            />
            {error && (
              <p className="text-sm text-destructive">Incorrect password</p>
            )}
            <Button type="submit" className="w-full h-11 text-base">
              Unlock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
