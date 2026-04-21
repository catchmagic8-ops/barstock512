import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import barLogo from "@/assets/sheraton-logo.png";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await login(username, password);
    setSubmitting(false);
    if (!res.ok) setError(res.error);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-8 sm:p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <img
          src={barLogo}
          alt="Sheraton"
          className="h-32 w-32 sm:h-40 sm:w-40 object-contain opacity-90"
        />

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <Lock className="h-7 w-7 sm:h-8 sm:w-8" style={{ color: "#d74c5a" }} />
            <h2
              className="text-lg sm:text-xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: "#e8e3d5" }}
            >
              Staff Sign In
            </h2>
            <p className="text-sm text-muted-foreground">Enter your username and password</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="login-username" className="text-xs uppercase tracking-wider text-muted-foreground">
                Username
              </Label>
              <Input
                id="login-username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                autoFocus
                autoComplete="username"
                autoCapitalize="none"
                className="bg-card h-11 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                autoComplete="current-password"
                className="bg-card h-11 text-base"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 text-base"
              style={{ backgroundColor: "#d74c5a" }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}