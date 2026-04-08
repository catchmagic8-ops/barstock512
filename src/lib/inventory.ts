export type Category = "spirits" | "wine" | "beer" | "soft-drinks" | "tea-coffee" | "reusables";

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  unit: string;
  quantity: number;
  minStock: number;
  usedThisShift?: number;
}

const STORAGE_KEY = "bar-inventory";

const defaultItems: InventoryItem[] = [
  // Spirits
  { id: "s1", name: "Vodka (1L)", category: "spirits", unit: "bottles", quantity: 8, minStock: 3, usedThisShift: 0 },
  { id: "s2", name: "Gin (1L)", category: "spirits", unit: "bottles", quantity: 5, minStock: 3, usedThisShift: 0 },
  { id: "s3", name: "Rum (1L)", category: "spirits", unit: "bottles", quantity: 2, minStock: 3, usedThisShift: 0 },
  { id: "s4", name: "Whiskey (1L)", category: "spirits", unit: "bottles", quantity: 6, minStock: 2, usedThisShift: 0 },
  { id: "s5", name: "Tequila (1L)", category: "spirits", unit: "bottles", quantity: 4, minStock: 2, usedThisShift: 0 },
  { id: "s6", name: "Triple Sec (700ml)", category: "spirits", unit: "bottles", quantity: 3, minStock: 2, usedThisShift: 0 },
  // Wine
  { id: "w1", name: "House Red", category: "wine", unit: "bottles", quantity: 12, minStock: 5, usedThisShift: 0 },
  { id: "w2", name: "House White", category: "wine", unit: "bottles", quantity: 10, minStock: 5, usedThisShift: 0 },
  { id: "w3", name: "Prosecco", category: "wine", unit: "bottles", quantity: 4, minStock: 4, usedThisShift: 0 },
  { id: "w4", name: "Rosé", category: "wine", unit: "bottles", quantity: 6, minStock: 3, usedThisShift: 0 },
  // Beer
  { id: "b1", name: "Lager (330ml)", category: "beer", unit: "bottles", quantity: 48, minStock: 24, usedThisShift: 0 },
  { id: "b2", name: "IPA (330ml)", category: "beer", unit: "bottles", quantity: 24, minStock: 12, usedThisShift: 0 },
  { id: "b3", name: "Stout (500ml)", category: "beer", unit: "bottles", quantity: 12, minStock: 6, usedThisShift: 0 },
  { id: "b4", name: "Pale Ale (330ml)", category: "beer", unit: "cans", quantity: 10, minStock: 12, usedThisShift: 0 },
  // Soft Drinks
  { id: "sd1", name: "Coca-Cola (330ml)", category: "soft-drinks", unit: "cans", quantity: 36, minStock: 24, usedThisShift: 0 },
  { id: "sd2", name: "Tonic Water", category: "soft-drinks", unit: "bottles", quantity: 20, minStock: 12, usedThisShift: 0 },
  { id: "sd3", name: "Orange Juice (1L)", category: "soft-drinks", unit: "cartons", quantity: 5, minStock: 3, usedThisShift: 0 },
  { id: "sd4", name: "Soda Water", category: "soft-drinks", unit: "bottles", quantity: 15, minStock: 10, usedThisShift: 0 },
  // Tea & Coffee
  { id: "tc1", name: "Espresso Beans (1kg)", category: "tea-coffee", unit: "bags", quantity: 3, minStock: 2, usedThisShift: 0 },
  { id: "tc2", name: "English Breakfast Tea", category: "tea-coffee", unit: "boxes", quantity: 2, minStock: 1, usedThisShift: 0 },
  { id: "tc3", name: "Chamomile Tea", category: "tea-coffee", unit: "boxes", quantity: 1, minStock: 1, usedThisShift: 0 },
  // Reusables
  { id: "r1", name: "Pint Glasses", category: "reusables", unit: "pcs", quantity: 40, minStock: 20, usedThisShift: 0 },
  { id: "r2", name: "Wine Glasses", category: "reusables", unit: "pcs", quantity: 30, minStock: 15, usedThisShift: 0 },
  { id: "r3", name: "Cocktail Shakers", category: "reusables", unit: "pcs", quantity: 5, minStock: 3, usedThisShift: 0 },
];

export function loadInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultItems;
}

export function saveInventory(items: InventoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
