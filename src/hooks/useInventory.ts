import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rowToItem, type InventoryItem } from "@/lib/inventory";

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

  return { items, isLoading, updateItem, updateMany };
}
