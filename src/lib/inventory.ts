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
  storehouse?: string;
  qtyLeft?: number;
  qtyToOrder?: number;
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
  storehouse?: string | null;
  qty_left?: number | null;
  qty_to_order?: number | null;
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
    storehouse: row.storehouse ?? undefined,
    qtyLeft: row.qty_left ?? undefined,
    qtyToOrder: row.qty_to_order ?? undefined,
  };
}
