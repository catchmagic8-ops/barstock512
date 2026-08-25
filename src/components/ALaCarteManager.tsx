import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useDepartment } from "@/contexts/DepartmentContext";

const CATEGORIES = [
  "Przekąski",
  "Pizza",
  "Sałatki",
  "Pomiędzy bułkami",
  "Zupy",
  "Makarony",
  "Dania główne",
  "Słodkości",
  "Dla dzieci",
  "Koktajle firmowe",
  "Spritzery",
  "Moktajle",
  "Szampany i wina musujące",
  "Wino białe",
  "Wino czerwone",
  "Wino różowe",
  "Piwo",
  "Wódka",
  "Whisky i whiskey",
  "Cognac i brandy",
  "Gin",
  "Rum",
  "Tequila",
  "Zimne napoje i soki",
  "Kawa i herbata",
];

const DIETARY_OPTIONS = ["Wegańskie", "Wegetariańskie"];

interface ALaCarteItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  allergens: string[];
  dietary: string[];
  price_pln: number;
  sort_order: number;
}

export default function ALaCarteManager() {
  const { tables, department } = useDepartment();
  const tableName = tables.alaCarte;
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [allergensText, setAllergensText] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [price, setPrice] = useState("");

  if (!tableName) {
    return (
      <p className="text-sm text-muted-foreground">
        Menu A La Carte nie jest włączone dla tego działu.
      </p>
    );
  }

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["a-la-carte-admin", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select("*")
        .order("category", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ALaCarteItem[];
    },
  });

  function reset() {
    setEditingId(null);
    setName("");
    setCategory(CATEGORIES[0]);
    setDescription("");
    setAllergensText("");
    setDietary([]);
    setPrice("");
  }

  function startEdit(it: ALaCarteItem) {
    setEditingId(it.id);
    setName(it.name);
    setCategory(it.category);
    setDescription(it.description ?? "");
    setAllergensText((it.allergens ?? []).join(", "));
    setDietary(it.dietary ?? []);
    setPrice(String(it.price_pln));
    setOpen(true);
  }

  const saveItem = useMutation({
    mutationFn: async () => {
      const allergens = allergensText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || null,
        allergens,
        dietary,
        price_pln: Number(price) || 0,
      };
      if (editingId) {
        const { error } = await (supabase as any)
          .from(tableName)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from(tableName).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Pozycja zaktualizowana" : "Pozycja dodana");
      qc.invalidateQueries({ queryKey: ["a-la-carte-admin", department] });
      qc.invalidateQueries({ queryKey: ["a-la-carte", department] });
      qc.invalidateQueries({ queryKey: ["a-la-carte-count", department] });
      reset();
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Nie udało się"),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pozycja usunięta");
      qc.invalidateQueries({ queryKey: ["a-la-carte-admin", department] });
      qc.invalidateQueries({ queryKey: ["a-la-carte", department] });
      qc.invalidateQueries({ queryKey: ["a-la-carte-count", department] });
    },
    onError: (e: any) => toast.error(e.message ?? "Nie udało się"),
  });

  function toggleDietary(tag: string) {
    setDietary((curr) =>
      curr.includes(tag) ? curr.filter((t) => t !== tag) : [...curr, tag]
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "pozycja" : "pozycji"}
        </p>
        <Button
          size="sm"
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" /> Dodaj pozycję
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Brak pozycji</p>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {items.map((it) => (
            <div
              key={it.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{it.name}</p>
                  <span className="text-xs text-primary">{Number(it.price_pln).toFixed(0)} PLN</span>
                </div>
                <p className="text-xs text-muted-foreground">{it.category}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary h-8 w-8"
                  onClick={() => startEdit(it)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                  onClick={() => {
                    if (window.confirm(`Usunąć „${it.name}”?`)) deleteItem.mutate(it.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              {editingId ? "Edytuj pozycję" : "Dodaj pozycję"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Nazwa pozycji"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border"
            />

            <div>
              <Label className="text-xs text-muted-foreground">Kategoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary border-border mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Opis"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-secondary border-border"
            />

            <div>
              <Label className="text-xs text-muted-foreground">
                Alergeny (rozdzielone przecinkami, np. Gluten, Mleko, Jaja)
              </Label>
              <Input
                placeholder="Gluten, Mleko, Jaja"
                value={allergensText}
                onChange={(e) => setAllergensText(e.target.value)}
                className="bg-secondary border-border mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Oznaczenia dietetyczne</Label>
              <div className="flex gap-2 mt-2">
                {DIETARY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDietary(d)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      dietary.includes(d)
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Cena (PLN)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-secondary border-border mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => saveItem.mutate()}
              disabled={!name || !price || saveItem.isPending}
            >
              {saveItem.isPending ? "Zapisywanie…" : editingId ? "Zapisz" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}