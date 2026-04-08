import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import barLogo from "@/assets/bar-logo.png";

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
    <div className="flex min-h-screen bg-background">
      {/* Left panel with logo */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-card border-r border-border">
        <img
          src={barLogo}
          alt="Bar & Lounge"
          className="max-h-[70vh] w-auto object-contain opacity-80"
        />
      </div>

      {/* Right panel with password form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          {/* Mobile logo */}
          <div className="flex justify-center md:hidden mb-4">
            <img src={barLogo} alt="Bar & Lounge" className="h-32 w-auto opacity-80" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <Lock className="h-8 w-8 text-primary" />
            <h2 className="font-heading text-xl font-bold text-foreground">Staff Access</h2>
            <p className="text-sm text-muted-foreground">Enter password to continue</p>
          </div>

          <Input
            type="password"
            placeholder="Password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            autoFocus
            className="bg-card"
          />
          {error && <p className="text-sm text-destructive">Incorrect password</p>}
          <Button type="submit" className="w-full">Unlock</Button>
        </form>
      </div>
    </div>
  );
}
