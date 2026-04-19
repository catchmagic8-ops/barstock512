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
  };
}
