import { useQuery } from "@tanstack/react-query";
import { ArrowRight, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { formatFlaggedAt, type InventoryItem } from "@/lib/inventory";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface LogRow {
  id: string;
  item_name: string;
  unit: string | null;
  qty_before: number | null;
  qty_after: number | null;
  qty_to_order: number | null;
  action: string;
  note: string | null;
  username: string | null;
  created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  flag: "Zgłoszenie niskiego stanu",
  stocktake: "Inwentaryzacja",
  restock: "Uzupełniono",
};

interface Props {
  item: InventoryItem | null;
  onOpenChange: (open: boolean) => void;
}

export default function InventoryHistoryDialog({ item, onOpenChange }: Props) {
  const { department } = useDepartment();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["inventory-log", department, item?.id],
    enabled: !!item,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("inventory_log")
        .select("*")
        .eq("department", department)
        .eq("item_id", item!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> Historia zmian stanu
          </DialogTitle>
          <DialogDescription>{item?.name}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Ładowanie…</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Brak zapisanych zmian dla tej pozycji.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {rows.map((r) => (
              <li key={r.id} className="rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {ACTION_LABEL[r.action] ?? r.action}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatFlaggedAt(r.created_at)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{r.qty_before ?? "—"}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium text-foreground">{r.qty_after ?? "—"}</span>
                  {r.unit && <span>{r.unit}</span>}
                  {r.qty_to_order != null && <span>· zamów: {r.qty_to_order}</span>}
                </div>
                {r.note && <p className="mt-0.5 text-[11px] italic text-muted-foreground">"{r.note}"</p>}
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {r.username ? `zmienił: ${r.username}` : "użytkownik nieznany"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
