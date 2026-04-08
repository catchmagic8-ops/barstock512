import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PASS = "psuja512";

export default function OptionsPasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("options-unlocked") === "1");
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASS) {
      sessionStorage.setItem("options-unlocked", "1");
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/">
            <Button variant="ghost" size="icon" type="button">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h2 className="font-heading text-xl font-bold text-foreground">Options Access</h2>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Lock className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Enter password to access options</p>
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
  );
}
