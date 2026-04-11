import { useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInventory } from "@/hooks/useInventory";
import { useSubcategories } from "@/components/SubcategoryManager";
import type { Category, InventoryItem } from "@/lib/inventory";
import { toast } from "sonner";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "spirits", label: "Spirits" },
  { value: "wine", label: "Wine" },
  { value: "beer", label: "Beer" },
  { value: "soft-drinks", label: "Soft Drinks" },
  { value: "tea-coffee", label: "Tea & Coffee" },
  { value: "reusables", label: "Reusables" },
];

interface ItemForm {
  name: string;
  category: Category;
  subcategory: string;
  unit: string;
  quantity: string;
  minStock: string;
}

const emptyForm: ItemForm = { name: "", category: "spirits", subcategory: "", unit: "bottles", quantity: "0", minStock: "2" };

export default function StockManager() {
  const { items, addItem, editItem, deleteItem } = useInventory();
  const { data: subcategories = [] } = useSubcategories();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ItemForm>(emptyForm);
  const [filterCat, setFilterCat] = useState<Category | "all">("all");

  const filtered = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);

  const getSubsForCategory = (cat: Category) => subcategories.filter((s) => s.category === cat);

  const handleAdd = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    const id = form.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    addItem.mutate(
      { id, name: form.name.trim(), category: form.category, subcategory: form.subcategory || null, unit: form.unit.trim() || "units", quantity: parseInt(form.quantity) || 0, min_stock: parseInt(form.minStock) || 0 },
      {
        onSuccess: () => { setForm(emptyForm); setShowAdd(false); toast.success("Item added"); },
        onError: () => toast.error("Failed to add item"),
      }
    );
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, category: item.category, subcategory: item.subcategory || "", unit: item.unit, quantity: String(item.quantity), minStock: String(item.minStock) });
  };

  const handleEdit = () => {
    if (!editingId || !editForm.name.trim()) return;
    editItem.mutate(
      { id: editingId, name: editForm.name.trim(), category: editForm.category, subcategory: editForm.subcategory || null, unit: editForm.unit.trim(), quantity: parseInt(editForm.quantity) || 0, min_stock: parseInt(editForm.minStock) || 0 },
      {
        onSuccess: () => { setEditingId(null); toast.success("Item updated"); },
        onError: () => toast.error("Failed to update"),
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    deleteItem.mutate(id, {
      onSuccess: () => toast.success("Deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  };

  const SubcategorySelect = ({ value, onChange, category }: { value: string; onChange: (v: string) => void; category: Category }) => {
    const subs = getSubsForCategory(category);
    if (subs.length === 0) return null;
    return (
      <Select value={value || "_none"} onValueChange={(v) => onChange(v === "_none" ? "" : v)}>
        <SelectTrigger className="bg-card"><SelectValue placeholder="Subcategory" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">No subcategory</SelectItem>
          {subs.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">Manage Stock</h2>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-lg border border-primary/30 bg-muted/50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-card" />
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category, subcategory: "" })}>
              <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <SubcategorySelect value={form.subcategory} onChange={(v) => setForm({ ...form, subcategory: v })} category={form.category} />
            <Input placeholder="Unit (e.g. bottles)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="bg-card" />
            <Input placeholder="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="bg-card" />
            <Input placeholder="Min stock" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className="bg-card" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={addItem.isPending}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <Select value={filterCat} onValueChange={(v) => setFilterCat(v as Category | "all")}>
        <SelectTrigger className="w-48 bg-card"><SelectValue placeholder="Filter category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {filtered.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-card p-3">
            {editingId === item.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-muted" />
                  <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v as Category, subcategory: "" })}>
                    <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <SubcategorySelect value={editForm.subcategory} onChange={(v) => setEditForm({ ...editForm, subcategory: v })} category={editForm.category} />
                  <Input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} className="bg-muted" />
                  <Input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} className="bg-muted" />
                  <Input type="number" value={editForm.minStock} onChange={(e) => setEditForm({ ...editForm, minStock: e.target.value })} className="bg-muted" placeholder="Min stock" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEdit} disabled={editItem.isPending} className="gap-1"><Save className="h-3.5 w-3.5" />Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-foreground">{item.name}</span>
                  {item.subcategory && <span className="ml-1.5 text-xs text-primary/80">({item.subcategory})</span>}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {item.quantity} {item.unit} · min {item.minStock}
                  </span>
                  {item.quantity <= item.minStock && (
                    <span className="ml-2 text-xs font-semibold text-primary">LOW</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(item)} className="h-8 w-8">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id, item.name)} className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
