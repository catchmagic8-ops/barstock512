import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  disablePush,
  enablePush,
  getMissingPushConfig,
  getStoredPushToken,
  isPushConfigured,
} from "@/lib/pushNotifications";

type State = "idle" | "working" | "on" | "off";

export default function NotificationsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const [state, setState] = useState<State>("idle");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEnabled(!!getStoredPushToken());
      setMessage(null);
      setState("idle");
    }
  }, [open]);

  async function handleEnable() {
    if (!user) return;
    setState("working");
    setMessage(null);
    const res = await enablePush({ username: user.username, role: user.role, department: user.department });
    switch (res.status) {
      case "registered":
        setEnabled(true);
        setState("on");
        setMessage("Powiadomienia włączone na tym urządzeniu.");
        break;
      case "open-in-new-tab":
        setState("idle");
        setMessage("W podglądzie (iframe) przeglądarka blokuje prośbę o zgodę. Otwórz aplikację w osobnej karcie lub użyj opublikowanej wersji.");
        break;
      case "denied":
        setState("off");
        setMessage("Przeglądarka zablokowała powiadomienia. Odblokuj je w ustawieniach strony (ikonka kłódki przy adresie).");
        break;
      case "unsupported":
        setState("off");
        setMessage("Ta przeglądarka/urządzenie nie obsługuje push. Na iPhonie dodaj aplikację do ekranu głównego i włącz stamtąd.");
        break;
      case "not-configured":
        setState("off");
        setMessage("Połączenie z usługą push nie jest jeszcze skonfigurowane.");
        break;
    }
  }

  async function handleDisable() {
    setState("working");
    await disablePush();
    setEnabled(false);
    setState("off");
    setMessage("Powiadomienia wyłączone na tym urządzeniu.");
  }

  const isInstalled = window.matchMedia?.("(display-mode: standalone)").matches;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {enabled ? <BellRing className="h-5 w-5 text-brand" /> : <Bell className="h-5 w-5 text-muted-foreground" />}
            Powiadomienia push
          </DialogTitle>
          <DialogDescription>
            Otrzymuj powiadomienia na ekranie blokady o nowych wiadomościach INFO, alertach magazynowych i rezerwacjach.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!isPushConfigured() && (
            <p className="rounded-xl border border-border/40 bg-foreground/[0.03] p-3 text-xs text-muted-foreground">
              Usługa push nie jest jeszcze skonfigurowana w tym projekcie.
            </p>
          )}

          {!isInstalled && /iphone|ipad|ipod/i.test(navigator.userAgent) && (
            <p className="rounded-xl border border-border/40 bg-foreground/[0.03] p-3 text-xs text-muted-foreground">
              Na iPhonie: otwórz aplikację w Safari, wybierz Udostępnij → „Dodaj do ekranu początkowego", a potem włącz
              powiadomienia z zainstalowanej aplikacji.
            </p>
          )}

          {message && (
            <p className="rounded-xl border border-border/40 bg-foreground/[0.03] p-3 text-sm text-foreground">{message}</p>
          )}

          {state === "idle" && message?.includes("osobnej karcie") && (
            <Button variant="outline" className="w-full gap-2" onClick={() => window.open(window.location.href, "_blank")}>
              <ExternalLink className="h-4 w-4" /> Otwórz w nowej karcie
            </Button>
          )}

          {enabled ? (
            <Button variant="outline" className="w-full gap-2" onClick={handleDisable} disabled={state === "working"}>
              <BellOff className="h-4 w-4" /> Wyłącz na tym urządzeniu
            </Button>
          ) : (
            <Button className="w-full gap-2 bg-brand text-white hover:bg-brand/90" onClick={handleEnable} disabled={state === "working" || !isPushConfigured()}>
              <Bell className="h-4 w-4" /> {state === "working" ? "Włączanie…" : "Włącz powiadomienia"}
            </Button>
          )}

          <p className="text-center text-[11px] text-muted-foreground">
            Powiadomienia trzeba włączyć osobno na każdym urządzeniu.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
