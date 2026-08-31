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
