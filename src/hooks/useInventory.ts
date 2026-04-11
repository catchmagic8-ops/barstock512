import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rowToItem, type InventoryItem, type Category } from "@/lib/inventory";

const QUERY_KEY = ["inventory"];

export function useInventory() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []).map(rowToItem);
    },
  });

  const updateItem = useMutation({
    mutationFn: async (item: InventoryItem) => {
      const { error } = await supabase
        .from("inventory_items")
        .update({
          quantity: item.quantity,
          used_this_shift: item.usedThisShift,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const updateMany = useMutation({
    mutationFn: async (updates: { id: string; quantity: number; used_this_shift: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("inventory_items")
          .update({ quantity: u.quantity, used_this_shift: u.used_this_shift })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const addItem = useMutation({
    mutationFn: async (item: { id: string; name: string; category: Category; subcategory?: string | null; unit: string; quantity: number; min_stock: number }) => {
      const { error } = await supabase.from("inventory_items").insert({
        id: item.id, name: item.name, category: item.category, subcategory: item.subcategory ?? null, unit: item.unit, quantity: item.quantity, min_stock: item.min_stock,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const editItem = useMutation({
    mutationFn: async (item: { id: string; name: string; category: Category; subcategory?: string | null; unit: string; quantity: number; min_stock: number }) => {
      const { error } = await supabase
        .from("inventory_items")
        .update({ name: item.name, category: item.category, subcategory: item.subcategory ?? null, unit: item.unit, quantity: item.quantity, min_stock: item.min_stock })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return { items, isLoading, updateItem, updateMany, addItem, editItem, deleteItem };
}
