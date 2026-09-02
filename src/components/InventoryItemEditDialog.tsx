import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventory } from "@/hooks/useInventory";
import { useSubcategories } from "@/components/SubcategoryManager";
import { CATEGORY_LABELS, COUNTING_LOCATIONS, type Category, type InventoryItem } from "@/lib/inventory";
import { toast } from "sonner";

interface Props {
  item: InventoryItem | null;
  onOpenChange: (open: boolean) => void;
}

/** Quick admin edit of a single product — opened from the press-and-hold menu. */
export default function InventoryItemEditDialog({ item, onOpenChange }: Props) {
  const { editItem } = useInventory();
  const { data: subcategories = [] } = useSubcategories();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("spirits");
  const [subcategory, setSubcategory] = useState("");
  const [unit, setUnit] = useState("");
  const [storehouse, setStorehouse] = useState("");
  const [countingLocation, setCountingLocation] = useState("");

  useEffect(() => {
    if (!item) return;
    setName(item.name);
    setCategory(item.category);
    setSubcategory(item.subcategory ?? "");
    setUnit(item.unit ?? "");
    setStorehouse(item.storehouse ?? "");
    setCountingLocation(item.countingLocation ?? "");
  }, [item]);

  const subs = (subcategories as { id: string; name: string; category: Category }[]).filter(
    (s) => s.category === category
  );

  const save = () => {
    if (!item) return;
    if (!name.trim()) { toast.error("Nazwa jest wymagana"); return; }
    editItem.mutate(
      {
        id: item.id,
        name: name.trim(),
        category,
        subcategory: subcategory || null,
        unit: unit.trim() || "units",
        storehouse: storehouse.trim() || null,
        countingLocation: countingLocation || null,
      } as never,
      {
        onSuccess: () => { toast.success("Pozycja zaktualizowana"); onOpenChange(false); },
        onError: () => toast.error("Nie udało się zaktualizować"),
      }
    );
  };

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edytuj pozycję</DialogTitle>
          <DialogDescription>{item?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nazwa</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Kategoria</label>
              <Select value={category} onValueChange={(v) => { setCategory(v as Category); setSubcategory(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Podkategoria</label>
              <Select value={subcategory || "_none"} onValueChange={(v) => setSubcategory(v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Brak" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Brak podkategorii</SelectItem>
                  {subs.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Jednostka</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="np. bottles" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Magazyn źródłowy</label>
              <Input value={storehouse} onChange={(e) => setStorehouse(e.target.value)} placeholder="np. Beverage" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Lokalizacja liczenia</label>
              <Select value={countingLocation || "_none"} onValueChange={(v) => setCountingLocation(v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Lokalizacja liczenia" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Bez lokalizacji liczenia</SelectItem>
                  {COUNTING_LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={save} disabled={editItem.isPending} className="gap-1.5">
            <Save className="h-4 w-4" /> Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
