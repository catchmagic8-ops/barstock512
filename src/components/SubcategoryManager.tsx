import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/inventory";
import { toast } from "sonner";
import { useDepartment } from "@/contexts/DepartmentContext";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "spirits", label: "Spirits" },
  { value: "wine", label: "Wine" },
  { value: "beer", label: "Beer" },
  { value: "soft-drinks", label: "Soft Drinks" },
  { value: "tea-coffee", label: "Tea & Coffee" },
  { value: "reusables", label: "Reusables" },
];

export function useSubcategories() {
  const { tables, department } = useDepartment();
  return useQuery({
    queryKey: ["subcategories", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tables.subcategories)
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function SubcategoryManager() {
  const queryClient = useQueryClient();
  const { tables, department } = useDepartment();
  const QUERY_KEY = ["subcategories", department];
  const { data: subcategories = [] } = useSubcategories();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("spirits");
  const [filterCat, setFilterCat] = useState<Category | "all">("all");

  const filtered = filterCat === "all" ? subcategories : subcategories.filter((s: any) => s.category === filterCat);

  const addSub = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from(tables.subcategories).insert({ name: name.trim(), category });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setName("");
      toast.success("Subcategory added");
    },
    onError: (e: any) => toast.error(e.message?.includes("duplicate") ? "Already exists" : "Failed to add"),
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(tables.subcategories).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const handleAdd = () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    addSub.mutate();
  };

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold text-foreground">Manage Subcategories</h2>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Subcategory name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-card flex-1"
        />
        <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
          <SelectTrigger className="bg-card w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleAdd} disabled={addSub.isPending} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <Select value={filterCat} onValueChange={(v) => setFilterCat(v as Category | "all")}>
        <SelectTrigger className="w-48 bg-card"><SelectValue placeholder="Filter" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No subcategories yet</p>
        )}
        {filtered.map((sub: any) => (
          <div key={sub.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <div>
              <span className="font-medium text-foreground text-sm">{sub.name}</span>
              <span className="ml-2 text-xs text-muted-foreground capitalize">{sub.category.replace("-", " ")}</span>
            </div>
            <Button size="icon" variant="ghost" onClick={() => deleteSub.mutate(sub.id)} className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
