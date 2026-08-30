import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, ExternalLink, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { setSetting } from "@/lib/appSettings";
import {
  disablePush,
  enablePush,
  getMissingPushConfig,
  getStoredPushToken,
  getStoredTopics,
  isPushConfigured,
  loadPushConfig,
  saveTopics,
  PUSH_SETTING_KEYS,
  PUSH_TOPICS,
  type PushConfig,
  type PushEventType,
} from "@/lib/pushNotifications";

type State = "idle" | "working" | "on" | "off";

export default function NotificationsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const [state, setState] = useState<State>("idle");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [topics, setTopics] = useState<PushEventType[]>(getStoredTopics());
  const [showSetup, setShowSetup] = useState(false);
  const [form, setForm] = useState({ apiKey: "", projectId: "", appId: "", vapidKey: "" });
  const isManager = user?.role === "admin";

  useEffect(() => {
    if (!open) return;
    setEnabled(!!getStoredPushToken());
    setTopics(getStoredTopics());
    setMessage(null);
    setState("idle");
    setShowSetup(false);
    void loadPushConfig(true).then(setConfig);
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
        setMessage("Powiadomienia sa wlaczone na tym urzadzeniu.");
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

  async function toggleTopic(id: PushEventType, value: boolean) {
    const next = value ? [...topics, id] : topics.filter((t) => t !== id);
    setTopics(next);
    await saveTopics(next);
  }

  async function handleSaveSetup() {
    setState("working");
    await Promise.all([
      setSetting(PUSH_SETTING_KEYS.apiKey, form.apiKey.trim() || null),
      setSetting(PUSH_SETTING_KEYS.projectId, form.projectId.trim() || null),
      setSetting(PUSH_SETTING_KEYS.appId, form.appId.trim() || null),
      setSetting(PUSH_SETTING_KEYS.vapidKey, form.vapidKey.trim() || null),
    ]);
    const cfg = await loadPushConfig(true);
    setConfig(cfg);
    setState("idle");
    setMessage(isPushConfigured(cfg) ? "Konfiguracja push zapisana. Możesz włączyć powiadomienia." : "Zapisano, ale konfiguracja jest nadal niekompletna.");
  }

  const configured = isPushConfigured(config);
  const isInstalled = window.matchMedia?.("(display-mode: standalone)").matches;
  const visibleTopics = PUSH_TOPICS.filter((t) => t.id !== "user_pending" || isManager);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
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
          {!configured &&
            (isManager ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-foreground">
                <p className="font-medium">Konfiguracja push jest niekompletna (widok managera)</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                  {getMissingPushConfig(config).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="mt-3 w-full gap-2" onClick={() => setShowSetup((v) => !v)}>
                  <Settings className="h-4 w-4" /> {showSetup ? "Ukryj konfigurację" : "Wprowadź dane Firebase"}
                </Button>
              </div>
            ) : (
              <p className="rounded-xl border border-border/40 bg-foreground/[0.03] p-3 text-xs text-muted-foreground">
                Powiadomienia push nie są jeszcze dostępne. Skontaktuj się z managerem.
              </p>
            ))}

          {isManager && showSetup && (
            <div className="space-y-2 rounded-xl border border-border/40 bg-foreground/[0.03] p-3">
              <p className="text-xs text-muted-foreground">
                Dane z konsoli Firebase (Ustawienia projektu → Twoje aplikacje web oraz Cloud Messaging → Web Push certificates). Są to wartości publiczne.
              </p>
              <div className="space-y-1">
                <Label className="text-xs">Web API Key</Label>
                <Input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="AIza..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Project ID</Label>
                <Input value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} placeholder="b512-65e2f" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">App ID</Label>
                <Input value={form.appId} onChange={(e) => setForm({ ...form, appId: e.target.value })} placeholder="1:123456789:web:abc123" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Publiczny klucz VAPID</Label>
                <Input value={form.vapidKey} onChange={(e) => setForm({ ...form, vapidKey: e.target.value })} placeholder="B..." />
              </div>
              <Button size="sm" className="w-full bg-brand text-white hover:bg-brand/90" onClick={handleSaveSetup} disabled={state === "working"}>
                Zapisz konfigurację
              </Button>
            </div>
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

          <div className="space-y-2 rounded-xl border border-border/40 bg-foreground/[0.03] p-3">
            <p className="text-xs font-medium text-foreground">Które powiadomienia chcesz otrzymywać?</p>
            {visibleTopics.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-foreground">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.description}</p>
                </div>
                <Switch checked={topics.includes(t.id)} onCheckedChange={(v) => void toggleTopic(t.id, v)} />
              </div>
            ))}
          </div>

          {enabled ? (
            <Button variant="outline" className="w-full gap-2" onClick={handleDisable} disabled={state === "working"}>
              <BellOff className="h-4 w-4" /> Wyłącz na tym urządzeniu
            </Button>
          ) : (
            <Button className="w-full gap-2 bg-brand text-white hover:bg-brand/90" onClick={handleEnable} disabled={state === "working" || !configured}>
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
