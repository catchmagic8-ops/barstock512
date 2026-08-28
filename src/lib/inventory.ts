export type Category = "spirits" | "wine" | "beer" | "soft-drinks" | "tea-coffee" | "reusables";

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  subcategory?: string;
  unit: string;
  needsRestock: boolean;
  restockNote?: string;
  flaggedAt?: string;
  flaggedBy?: string;
  storehouse?: string;
  qtyLeft?: number;
  qtyToOrder?: number;
  updatedAt?: string;
  stockConfirmedAt?: string;
}

export const STALE_STOCK_DAYS = 7;

// True when the item's stock was not confirmed within the last STALE_STOCK_DAYS days
export function isStockStale(item: InventoryItem): boolean {
  const ref = item.stockConfirmedAt ?? item.flaggedAt;
  if (!ref) return true;
  const d = new Date(ref).getTime();
  if (Number.isNaN(d)) return true;
  return Date.now() - d > STALE_STOCK_DAYS * 86400000;
}

// Map DB row to app model
export function rowToItem(row: {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  unit: string;
  needs_restock?: boolean | null;
  restock_note?: string | null;
  flagged_at?: string | null;
  flagged_by?: string | null;
  storehouse?: string | null;
  qty_left?: number | null;
  qty_to_order?: number | null;
  updated_at?: string | null;
}): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    subcategory: row.subcategory ?? undefined,
    unit: row.unit,
    needsRestock: !!row.needs_restock,
    restockNote: row.restock_note ?? undefined,
    flaggedAt: row.flagged_at ?? undefined,
    flaggedBy: row.flagged_by ?? undefined,
    storehouse: row.storehouse ?? undefined,
    qtyLeft: row.qty_left ?? undefined,
    qtyToOrder: row.qty_to_order ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

// Format a flag timestamp as "28.08.2026, 03:22"
export function formatFlaggedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString("pl-PL")}, ${d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
}

// Short relative label in Polish, e.g. "teraz", "3 h temu", "2 dni temu"
export function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h temu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "dzień" : "dni"} temu`;
  return formatFlaggedAt(iso);
}
