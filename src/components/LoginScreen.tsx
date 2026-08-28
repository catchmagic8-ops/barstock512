import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, UserPlus, ArrowLeft } from "lucide-react";
import barLogo from "@/assets/sheraton-logo.png";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "choose" | "login" | "register" | "pending";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("choose");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = (next: Mode) => {
    setMode(next);
    setUsername("");
    setPassword("");
    setConfirm("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === "register" && password !== confirm) {
      setError("Hasła nie są identyczne");
      return;
    }
    setSubmitting(true);
    const res = mode === "register"
      ? await register(username, password)
      : await login(username, password);
    setSubmitting(false);
    if (res.ok === false) setError(res.error);
    else if (mode === "register") reset("pending");
  };

  const isRegister = mode === "register";

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-8 sm:p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <img
          src={barLogo}
          alt="Sheraton"
          className="h-32 w-32 sm:h-40 sm:w-40 object-contain opacity-90"
        />

        {mode === "choose" ? (
          <div className="w-full space-y-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="font-heading text-lg font-bold text-brand sm:text-xl">Witaj w Sheraton F&amp;B</h2>
              <p className="text-sm text-muted-foreground">Wybierz, jak chcesz kontynuować</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => reset("login")}
                className="w-full rounded-xl border border-border/60 bg-card/60 p-4 text-left backdrop-blur-md transition-colors hover:border-brand/60 hover:bg-card"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Mam już konto</p>
                    <p className="text-xs text-muted-foreground">Zaloguj się swoimi danymi</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => reset("register")}
                className="w-full rounded-xl border border-border/60 bg-card/60 p-4 text-left backdrop-blur-md transition-colors hover:border-brand/60 hover:bg-card"
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-brand" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Jestem nowy</p>
                    <p className="text-xs text-muted-foreground">Utwórz konto pracownika</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="flex flex-col items-center gap-2 text-center">
              {isRegister ? (
                <UserPlus className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              ) : (
                <Lock className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              )}
              <h2 className="font-heading text-lg font-bold text-brand sm:text-xl">
                {isRegister ? "Nowe konto" : "Logowanie"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRegister
                  ? "Twoje konto pojawi się od razu w panelu administratora"
                  : "Podaj nazwę użytkownika i hasło"}
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="login-username" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Nazwa użytkownika
                </Label>
                <Input
                  id="login-username"
                  type="text"
                  placeholder="nazwa użytkownika"
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
                  Hasło
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="hasło"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  className="bg-card h-11 text-base"
                />
              </div>
              {isRegister && (
                <div className="space-y-1.5">
                  <Label htmlFor="login-confirm" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Powtórz hasło
                  </Label>
                  <Input
                    id="login-confirm"
                    type="password"
                    placeholder="powtórz hasło"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                    autoComplete="new-password"
                    className="bg-card h-11 text-base"
                  />
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={submitting} className="w-full h-11 text-base">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isRegister ? "Utwórz konto" : "Zaloguj się"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => reset("choose")}
                className="w-full gap-1.5 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Wróć
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
