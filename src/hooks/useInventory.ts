import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rowToItem, type InventoryItem, type Category } from "@/lib/inventory";
import { useDepartment } from "@/contexts/DepartmentContext";

export function useInventory() {
  const queryClient = useQueryClient();
  const { tables, department } = useDepartment();
  const QUERY_KEY = ["inventory", department];

  const { data: items = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tables.inventory)
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []).map(rowToItem);
    },
  });

  // Append an entry to the shared change history
  async function logChange(entry: {
    item: InventoryItem | undefined;
    itemId: string;
    qtyAfter?: number | null;
    qtyToOrder?: number | null;
    action: "flag" | "stocktake" | "restock";
    note?: string | null;
    username?: string | null;
  }) {
    await (supabase as any).from("inventory_log").insert({
      department,
      item_id: entry.itemId,
      item_name: entry.item?.name ?? entry.itemId,
      unit: entry.item?.unit ?? null,
      qty_before: entry.item?.qtyLeft ?? null,
      qty_after: entry.qtyAfter ?? null,
      qty_to_order: entry.qtyToOrder ?? null,
      action: entry.action,
      note: entry.note ?? null,
      username: entry.username ?? null,
    });
  }

  const flagItem = useMutation({
    mutationFn: async ({
      id,
      note,
      qtyLeft,
      qtyToOrder,
      flaggedBy,
    }: { id: string; note?: string; qtyLeft?: number | null; qtyToOrder?: number | null; flaggedBy?: string | null }) => {
      const before = items.find((i) => i.id === id);
      const now = new Date().toISOString();
      const { error } = await (supabase as any)
        .from(tables.inventory)
        .update({
          needs_restock: true,
          restock_note: note ?? null,
          qty_left: qtyLeft ?? null,
          qty_to_order: qtyToOrder ?? null,
          flagged_at: now,
          flagged_by: flaggedBy ?? null,
          stock_confirmed_at: qtyLeft != null ? now : null,
        })
        .eq("id", id);
      if (error) throw error;
      await logChange({
        item: before,
        itemId: id,
        qtyAfter: qtyLeft ?? null,
        qtyToOrder: qtyToOrder ?? null,
        action: "flag",
        note: note ?? null,
        username: flaggedBy ?? null,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  // Confirm the current stock level without raising a low-stock alert (stocktake)
  const confirmStock = useMutation({
    mutationFn: async ({
      id,
      qtyLeft,
      note,
      username,
    }: { id: string; qtyLeft: number | null; note?: string | null; username?: string | null }) => {
      const before = items.find((i) => i.id === id);
      const { error } = await (supabase as any)
        .from(tables.inventory)
        .update({ qty_left: qtyLeft, stock_confirmed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logChange({
        item: before,
        itemId: id,
        qtyAfter: qtyLeft,
        action: "stocktake",
        note: note ?? null,
        username: username ?? null,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const clearFlag = useMutation({
    mutationFn: async (input: string | { id: string; username?: string | null }) => {
      const id = typeof input === "string" ? input : input.id;
      const username = typeof input === "string" ? null : input.username ?? null;
      const before = items.find((i) => i.id === id);
      const { error } = await (supabase as any)
        .from(tables.inventory)
        .update({ needs_restock: false, restock_note: null, qty_left: null, qty_to_order: null, flagged_at: null, flagged_by: null })
        .eq("id", id);
      if (error) throw error;
      await logChange({ item: before, itemId: id, qtyAfter: null, action: "restock", username });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const clearAllFlags = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from(tables.inventory)
        .update({ needs_restock: false, restock_note: null, qty_left: null, qty_to_order: null, flagged_at: null, flagged_by: null })
        .eq("needs_restock", true);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const addItem = useMutation({
    mutationFn: async (item: { id: string; name: string; category: Category; subcategory?: string | null; unit: string; storehouse?: string | null }) => {
      const { error } = await (supabase as any).from(tables.inventory).insert({
        id: item.id, name: item.name, category: item.category, subcategory: item.subcategory ?? null, unit: item.unit, storehouse: item.storehouse ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const editItem = useMutation({
    mutationFn: async (item: { id: string; name: string; category: Category; subcategory?: string | null; unit: string; storehouse?: string | null }) => {
      const { error } = await (supabase as any)
        .from(tables.inventory)
        .update({ name: item.name, category: item.category, subcategory: item.subcategory ?? null, unit: item.unit, storehouse: item.storehouse ?? null })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(tables.inventory).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return { items, isLoading, flagItem, clearFlag, clearAllFlags, addItem, editItem, deleteItem };
}

export type { InventoryItem };
