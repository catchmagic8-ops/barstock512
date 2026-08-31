import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Read-only ("viewer" / demo) mode.
 *
 * Auth in this app is custom (app_users + RPC), so the database cannot tell
 * a viewer apart from staff. Enforcement therefore happens here, centrally:
 * every write through the Supabase client is blocked while read-only is on.
 */

let readOnly = false;
let patched = false;
let lastToast = 0;

export const READ_ONLY_MESSAGE = "Tryb podglądu — zmiany są wyłączone";

export function isReadOnly() {
  return readOnly;
}

function deny(): never {
  const now = Date.now();
  if (now - lastToast > 1500) {
    lastToast = now;
    toast.error(READ_ONLY_MESSAGE, {
      description: "To konto służy tylko do prezentacji aplikacji.",
    });
  }
  throw new Error(READ_ONLY_MESSAGE);
}

const TABLE_WRITES = ["insert", "update", "upsert", "delete"] as const;
const STORAGE_WRITES = ["upload", "update", "remove", "move", "copy", "createSignedUploadUrl"] as const;
/** Edge functions that only read/analyse and never persist anything. */
const SAFE_FUNCTIONS = ["scan-upsell-bottle", "scan-event-sheet"];

function installGuard() {
  if (patched) return;
  patched = true;
  const client = supabase as any;

  const origFrom = client.from.bind(client);
  client.from = (table: string) => {
    const builder = origFrom(table);
    if (!readOnly) return builder;
    for (const method of TABLE_WRITES) {
      if (typeof builder[method] === "function") {
        builder[method] = () => deny();
      }
    }
    return builder;
  };

  const origRpc = client.rpc.bind(client);
  client.rpc = (fn: string, params?: unknown, opts?: unknown) => {
    // Login / registration RPCs must keep working; everything else that a
    // viewer could call is a mutation.
    const allowed = fn === "verify_user_login" || fn.startsWith("admin_list");
    if (readOnly && !allowed) return deny();
    return origRpc(fn, params as any, opts as any);
  };

  // Edge functions can write on the server side with elevated rights.
  const functions = client.functions;
  if (functions?.invoke) {
    const origInvoke = functions.invoke.bind(functions);
    functions.invoke = (name: string, opts?: unknown) => {
      if (readOnly && !SAFE_FUNCTIONS.includes(name)) return deny();
      return origInvoke(name, opts as any);
    };
  }

  const storage = client.storage;
  const origStorageFrom = storage.from.bind(storage);
  storage.from = (bucket: string) => {
    const api = origStorageFrom(bucket);
    if (!readOnly) return api;
    for (const method of STORAGE_WRITES) {
      if (typeof (api as any)[method] === "function") {
        (api as any)[method] = () => deny();
      }
    }
    return api;
  };
}

export function setReadOnly(value: boolean) {
  readOnly = value;
  if (value) installGuard();
}

/**
 * Enable the guard synchronously at startup (before React mounts) so a viewer
 * session restored from storage can never slip a write through during the
 * first render pass.
 */
(function initFromStoredSession() {
  try {
    const raw = localStorage.getItem("sheraton-auth-user");
    if (!raw) return;
    const parsed = JSON.parse(raw) as { role?: string };
    if (parsed?.role === "viewer") setReadOnly(true);
  } catch {
    /* ignore */
  }
})();

