import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowUp, ArrowDown, Check, Loader2, MapPin, Pencil, Plus, Search, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventory } from "@/hooks/useInventory";
import { useCountingLocations } from "@/lib/countingLocations";
import { CATEGORY_LABELS, groupByCountingLocation } from "@/lib/inventory";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath, DEPT_META } from "@/lib/department";
import { AmbientBackgroundForDepartment } from "@/components/AmbientBackground";
import { cn } from "@/lib/utils";

export default function Locations() {
  const { department } = useDepartment();
  const { items, isLoading, setLocations } = useInventory();
  const { locations, save } = useCountingLocations(department);

  const [newRoom, setNewRoom] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [search, setSearch] = useState("");
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
      .filter((i) => (onlyUnassigned ? !i.countingLocation : true))
      .sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }, [items, search, onlyUnassigned]);

  const counts = useMemo(() => {
    const groups = groupByCountingLocation(items, false, locations);
    return Object.fromEntries(groups.map((g) => [g.location, g.items.length])) as Record<string, number>;
  }, [items, locations]);

  const unassignedCount = items.filter(
    (i) => !i.countingLocation || !locations.includes(i.countingLocation)
  ).length;

  const addRoom = async () => {
    const name = newRoom.trim();
    if (!name) return;
    if (locations.includes(name)) {
      toast.error("Takie pomieszczenie już istnieje");
      return;
    }
    await save.mutateAsync([...locations, name]);
    setNewRoom("");
    toast.success(`Dodano pomieszczenie: ${name}`);
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...locations];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await save.mutateAsync(next);
  };

  const removeRoom = async (name: string) => {
    await save.mutateAsync(locations.filter((l) => l !== name));
    // Detach the room from every product that referenced it
    await Promise.all(
      items
        .filter((i) => i.countingLocation === name || (i.additionalLocations ?? []).includes(name))
        .map((i) =>
          setLocations.mutateAsync({
            id: i.id,
            countingLocation: i.countingLocation === name ? null : undefined,
            additionalLocations: (i.additionalLocations ?? []).includes(name)
              ? (i.additionalLocations ?? []).filter((l) => l !== name)
              : undefined,
          })
        )
    );
    toast.success(`Usunięto pomieszczenie: ${name}`);
  };

  const applyRename = async (oldName: string) => {
    const name = renameValue.trim();
    setRenaming(null);
    if (!name || name === oldName) return;
    await save.mutateAsync(locations.map((l) => (l === oldName ? name : l)));
    await Promise.all(
      items
        .filter((i) => i.countingLocation === oldName || (i.additionalLocations ?? []).includes(oldName))
        .map((i) =>
          setLocations.mutateAsync({
            id: i.id,
            countingLocation: i.countingLocation === oldName ? name : undefined,
            additionalLocations: (i.additionalLocations ?? []).includes(oldName)
              ? (i.additionalLocations ?? []).map((l) => (l === oldName ? name : l))
              : undefined,
          })
        )
    );
    toast.success("Zmieniono nazwę pomieszczenia");
  };

  return (
    <div className="relative min-h-screen">
      <AmbientBackgroundForDepartment />
      <div className="relative mx-auto max-w-4xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`${deptHomePath(department)}/admin`.replace("//", "/")}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Lokalizacje</h1>
            <p className="text-xs text-muted-foreground">
              {DEPT_META[department]?.label ?? department} — pomieszczenia w kolejności obchodu lokalu
            </p>
          </div>
        </div>

        {/* Room manager */}
        <section className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" /> Pomieszczenia
          </h2>
          <div className="space-y-2">
            {locations.map((loc, idx) => (
              <div key={loc} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-2.5 py-2">
                <span className="w-5 shrink-0 text-[11px] font-semibold text-muted-foreground">{idx + 1}.</span>
                {renaming === loc ? (
                  <>
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyRename(loc)}
                      className="h-8 flex-1"
                    />
                    <Button size="sm" className="h-8 gap-1" onClick={() => applyRename(loc)}>
                      <Check className="h-3.5 w-3.5" /> Zapisz
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 truncate text-sm font-medium text-foreground">{loc}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{counts[loc] ?? 0} poz.</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(idx, 1)} disabled={idx === locations.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setRenaming(loc); setRenameValue(loc); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRoom(loc)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Nazwa nowego pomieszczenia"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRoom()}
              className="h-9"
            />
            <Button onClick={addRoom} disabled={save.isPending} className="h-9 gap-1.5">
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Dodaj
            </Button>
          </div>
          {unassignedCount > 0 && (
            <p className="mt-2 text-[11px] font-medium text-destructive">
              {unassignedCount} produktów bez przypisanej lokalizacji
            </p>
          )}
        </section>

        {/* Product assignment */}
        <section className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Przypisanie produktów</h2>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj produktu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8"
              />
            </div>
            <Button
              variant={onlyUnassigned ? "default" : "outline"}
              className="h-9 text-xs"
              onClick={() => setOnlyUnassigned((v) => !v)}
            >
              Tylko bez lokalizacji
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {filtered.map((item) => {
                const extras = item.additionalLocations ?? [];
                return (
                  <div key={item.id} className="rounded-lg border border-border/60 bg-card/50 px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                      {item.storehouse ? ` · ${item.storehouse}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {locations.map((loc) => {
                        const isMain = item.countingLocation === loc;
                        const isExtra = extras.includes(loc);
                        return (
                          <button
                            key={loc}
                            onClick={() => {
                              if (isMain) {
                                setLocations.mutate({ id: item.id, countingLocation: null });
                              } else if (isExtra) {
                                setLocations.mutate({ id: item.id, additionalLocations: extras.filter((l) => l !== loc) });
                              } else if (!item.countingLocation) {
                                setLocations.mutate({ id: item.id, countingLocation: loc });
                              } else {
                                setLocations.mutate({ id: item.id, additionalLocations: [...extras, loc] });
                              }
                            }}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                              isMain
                                ? "border-primary/60 bg-primary/20 text-primary"
                                : isExtra
                                  ? "border-primary/30 bg-primary/10 text-primary/80"
                                  : "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            )}
                          >
                            {isMain ? "★ " : isExtra ? "+ " : ""}{loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">Brak produktów dla tych filtrów.</p>
              )}
            </div>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">
            ★ główna lokalizacja · + dodatkowe pomieszczenie. Kliknij, aby dodać lub usunąć.
          </p>
        </section>
      </div>
    </div>
  );
}
