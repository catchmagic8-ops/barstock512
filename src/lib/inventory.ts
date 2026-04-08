export type Category = "spirits" | "wine" | "beer" | "soft-drinks" | "tea-coffee" | "reusables";

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  unit: string;
  quantity: number;
  minStock: number;
  usedThisShift: number;
}

// Map DB row to app model
export function rowToItem(row: {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  min_stock: number;
  used_this_shift: number;
}): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category as Category,
    unit: row.unit,
    quantity: row.quantity,
    minStock: row.min_stock,
    usedThisShift: row.used_this_shift,
  };
}
