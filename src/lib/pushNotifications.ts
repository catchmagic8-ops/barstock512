import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { supabase } from "@/integrations/supabase/client";

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY,
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID,
  appId,
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export type PushEnableResult =
  | { status: "registered" }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" };

const TOKEN_KEY = "sheraton-push-token";

export function getStoredPushToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Lists the exact missing Firebase web-push configuration fields (empty = fully configured). */
export function getMissingPushConfig(): string[] {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push("Firebase Web API Key (VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY)");
  if (!firebaseConfig.projectId) missing.push("Firebase Project ID (VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID)");
  if (!appId) missing.push("Firebase App ID (VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID)");
  if (!firebaseConfig.messagingSenderId) missing.push("Messaging Sender ID (drugi segment App ID)");
  if (!vapidKey) missing.push("Publiczny klucz VAPID (VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY)");
  return missing;
}

export function isPushConfigured(): boolean {
  return getMissingPushConfig().length === 0;
}

export async function enablePush(user: { username: string; role: string; department?: string }): Promise<PushEnableResult> {
  if (!isPushConfigured()) return { status: "not-configured" };
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) {
    return { status: "unsupported" };
  }
  if (window.top !== window.self) return { status: "open-in-new-tab" };

  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  const query = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
  const swReg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
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

export type PushEventType = "handover" | "inventory_flag" | "reservation" | "user_pending";

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
