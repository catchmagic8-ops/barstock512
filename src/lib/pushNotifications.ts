import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { supabase } from "@/integrations/supabase/client";
import { getSettings } from "@/lib/appSettings";

/** app_settings keys used as a fallback when connector env vars are unavailable. */
export const PUSH_SETTING_KEYS = {
  apiKey: "push_web_api_key",
  projectId: "push_project_id",
  appId: "push_app_id",
  vapidKey: "push_vapid_key",
} as const;

export interface PushConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  messagingSenderId: string;
  vapidKey: string;
}

const envConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY ?? "",
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID ?? "",
  appId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID ?? "",
  vapidKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY ?? "",
};

let cached: PushConfig | null = null;

/** Loads the Firebase web-push config from connector env vars, falling back to admin-saved settings. */
export async function loadPushConfig(force = false): Promise<PushConfig> {
  if (cached && !force) return cached;
  let saved: Record<string, string> = {};
  try {
    saved = await getSettings(Object.values(PUSH_SETTING_KEYS));
  } catch {
    saved = {};
  }
  const apiKey = envConfig.apiKey || saved[PUSH_SETTING_KEYS.apiKey] || "";
  const projectId = envConfig.projectId || saved[PUSH_SETTING_KEYS.projectId] || "";
  const appId = envConfig.appId || saved[PUSH_SETTING_KEYS.appId] || "";
  const vapidKey = envConfig.vapidKey || saved[PUSH_SETTING_KEYS.vapidKey] || "";
  cached = {
    apiKey,
    projectId,
    appId,
    messagingSenderId: appId.split(":")[1] ?? "",
    vapidKey,
  };
  return cached;
}

/** Lists the exact missing Firebase web-push configuration fields (empty = fully configured). */
export function getMissingPushConfig(cfg: PushConfig | null): string[] {
  const missing: string[] = [];
  if (!cfg?.apiKey) missing.push("Firebase Web API Key");
  if (!cfg?.projectId) missing.push("Firebase Project ID");
  if (!cfg?.appId) missing.push("Firebase App ID (1:...:web:...)");
  if (!cfg?.messagingSenderId) missing.push("Messaging Sender ID (drugi segment App ID)");
  if (!cfg?.vapidKey) missing.push("Publiczny klucz VAPID");
  return missing;
}

export function isPushConfigured(cfg: PushConfig | null): boolean {
  return getMissingPushConfig(cfg).length === 0;
}

export type PushEventType = "handover" | "inventory_flag" | "reservation" | "user_pending";

export const PUSH_TOPICS: { id: PushEventType; label: string; description: string }[] = [
  { id: "handover", label: "Wiadomości INFO", description: "Nowe wpisy i odpowiedzi w handoverze" },
  { id: "inventory_flag", label: "Alerty magazynowe", description: "Zgłoszenia niskiego stanu" },
  { id: "reservation", label: "Rezerwacje", description: "Nowe i zmienione rezerwacje stolików" },
  { id: "user_pending", label: "Nowe konta", description: "Konta oczekujące na zatwierdzenie (tylko manager)" },
];

export const DEFAULT_TOPICS: PushEventType[] = ["handover", "inventory_flag", "reservation", "user_pending"];

export type PushEnableResult =
  | { status: "registered" }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" };

const TOKEN_KEY = "sheraton-push-token";
const TOPICS_KEY = "sheraton-push-topics";

export function getStoredPushToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredTopics(): PushEventType[] {
  try {
    const raw = localStorage.getItem(TOPICS_KEY);
    if (!raw) return DEFAULT_TOPICS;
    const parsed = JSON.parse(raw) as PushEventType[];
    return Array.isArray(parsed) ? parsed : DEFAULT_TOPICS;
  } catch {
    return DEFAULT_TOPICS;
  }
}

/** Persists the user's topic choices for this device (local + database). */
export async function saveTopics(topics: PushEventType[]): Promise<void> {
  try {
    localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
  } catch {
    /* ignore */
  }
  const token = getStoredPushToken();
  if (!token) return;
  await (supabase as any).from("push_tokens").update({ topics }).eq("token", token);
}

export async function enablePush(user: {
  username: string;
  role: string;
  department?: string;
}): Promise<PushEnableResult> {
  const cfg = await loadPushConfig(true);
  if (!isPushConfigured(cfg)) return { status: "not-configured" };
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) {
    return { status: "unsupported" };
  }
  if (window.top !== window.self) return { status: "open-in-new-tab" };

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  const firebaseConfig = {
    apiKey: cfg.apiKey,
    projectId: cfg.projectId,
    appId: cfg.appId,
    messagingSenderId: cfg.messagingSenderId,
  };
  const query = new URLSearchParams(firebaseConfig).toString();
  const swReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: cfg.vapidKey, serviceWorkerRegistration: swReg });
  if (!token) return { status: "denied" };

  const platform = /iphone|ipad|ipod/i.test(navigator.userAgent)
    ? "ios"
    : /android/i.test(navigator.userAgent)
      ? "android"
      : "web";

  await (supabase as any).from("push_tokens").upsert(
    {
      token,
      username: user.username,
      role: user.role,
      department: user.department ?? "all",
      platform,
      topics: getStoredTopics(),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );

  localStorage.setItem(TOKEN_KEY, token);
  return { status: "registered" };
}

export async function disablePush(): Promise<void> {
  const token = getStoredPushToken();
  if (token) {
    await (supabase as any).from("push_tokens").delete().eq("token", token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function sendPush(
  type: PushEventType,
  payload: { title: string; body: string; path?: string; actorUsername?: string; department?: string },
): Promise<void> {
  try {
    await supabase.functions.invoke("send-push-notification", {
      body: { type, ...payload },
    });
  } catch (e) {
    console.error("push send failed:", e);
  }
}
