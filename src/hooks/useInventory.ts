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

  const flagItem = useMutation({
    mutationFn: async ({
      id,
      note,
      qtyLeft,
      qtyToOrder,
      flaggedBy,
    }: { id: string; note?: string; qtyLeft?: number | null; qtyToOrder?: number | null; flaggedBy?: string | null }) => {
      const { error } = await (supabase as any)
        .from(tables.inventory)
        .update({
          needs_restock: true,
          restock_note: note ?? null,
          qty_left: qtyLeft ?? null,
          qty_to_order: qtyToOrder ?? null,
          flagged_at: new Date().toISOString(),
          flagged_by: flaggedBy ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const clearFlag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from(tables.inventory)
        .update({ needs_restock: false, restock_note: null, qty_left: null, qty_to_order: null, flagged_at: null, flagged_by: null })
        .eq("id", id);
      if (error) throw error;
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
