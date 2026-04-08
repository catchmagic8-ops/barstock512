import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-2">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <h2 className="font-heading text-lg font-bold text-foreground">Enter Password</h2>
        </div>
        <Input
          type="password"
          placeholder="Password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">Incorrect password</p>}
        <Button type="submit" className="w-full">Unlock</Button>
      </form>
    </div>
  );
}
