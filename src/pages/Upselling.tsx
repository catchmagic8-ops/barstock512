import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowLeft, Camera, Loader2, Sparkles, Trash2, Search, Wine, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { deptHomePath } from "@/lib/department";
import { cn } from "@/lib/utils";

interface UpsellItem {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  tasting_notes: string | null;
  upsell_pitch: string | null;
  pairing_suggestions: string | null;
  price_tier: string | null;
  created_by: string | null;
  created_at: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function Upselling() {
  const { department, meta } = useDepartment();
  const { user, isAdminFor } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (department !== "bar512") return <Navigate to={deptHomePath(department)} replace />;
  const canEdit = isAdminFor(department);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["upsell-items-bar512"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("upsell_items_bar512")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UpsellItem[];
    },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("upsell_items_bar512").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["upsell-items-bar512"] });
      toast({ title: "Usunięto" });
    },
    onError: (e: Error) => toast({ title: "Nie udało się usunąć", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<UpsellItem> }) => {
      const { error } = await (supabase as any).from("upsell_items_bar512").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["upsell-items-bar512"] }),
  });

  async function handleFile(f: File) {
    if (!f) return;
    setScanning(true);
    try {
      const dataUrl = await fileToBase64(f);

      // 1. Ask AI to identify + generate pitch
      const { data: aiRes, error: aiErr } = await supabase.functions.invoke("scan-upsell-bottle", {
        body: { imageBase64: dataUrl },
      });
      if (aiErr) throw aiErr;
      if (!aiRes?.bottle) throw new Error("Nie udało się rozpoznać butelki");
      const b = aiRes.bottle as {
        name: string; category: string; price_tier?: string;
        tasting_notes: string; upsell_pitch: string; pairing_suggestions?: string;
      };

      // 2. Upload image to storage
      const ext = f.name.split(".").pop() || "jpg";
      const path = `upsell/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("recipe-images").upload(path, f, {
        contentType: f.type || "image/jpeg",
        upsert: false,
      });
      let publicUrl: string | null = null;
      if (!upErr) {
        publicUrl = supabase.storage.from("recipe-images").getPublicUrl(path).data.publicUrl;
      }

      // 3. Insert row
      const { error: insErr } = await (supabase as any).from("upsell_items_bar512").insert({
        name: b.name,
        category: b.category,
        price_tier: b.price_tier ?? null,
        image_url: publicUrl,
        tasting_notes: b.tasting_notes,
        upsell_pitch: b.upsell_pitch,
        pairing_suggestions: b.pairing_suggestions ?? null,
        created_by: user?.username ?? null,
      });
      if (insErr) throw insErr;

      qc.invalidateQueries({ queryKey: ["upsell-items-bar512"] });
      toast({ title: "Butelka dodana", description: b.name });
    } catch (e) {
      console.error(e);
      toast({
        title: "Skanowanie nie udało się",
        description: e instanceof Error ? e.message : "Nieznany błąd",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];
  const filtered = items.filter((i) => {
    const s = search.toLowerCase();
    const matchSearch =
      !s ||
      i.name.toLowerCase().includes(s) ||
      (i.tasting_notes ?? "").toLowerCase().includes(s) ||
      (i.upsell_pitch ?? "").toLowerCase().includes(s);
    const matchCat = !activeCat || i.category === activeCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/70 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3">
          <Link to={deptHomePath(department)}>
            <Button variant="ghost" size="icon" title="Wróć">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1
            className="text-xl font-bold sm:text-2xl"
            style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--brand))" }}
          >
            Upselling · {meta.label}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
            className="gap-2"
            style={{ backgroundColor: "hsl(var(--brand))", color: "white" }}
          >
            {scanning ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Skanowanie…</>
            ) : (
              <><Camera className="h-4 w-4" /> Skanuj butelkę</>
            )}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-6 sm:px-8">
        {/* Search + filters */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj butelek, nut smakowych, tekstu sprzedaży…"
              className="pl-9"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCat(null)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  !activeCat ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                Wszystkie
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c === activeCat ? null : c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    activeCat === c
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <Wine className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? "Brak butelek — kliknij „Skanuj butelkę”, aby dodać pierwszą."
                : "Żadna butelka nie odpowiada wyszukiwaniu."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((it) => {
              const isOpen = expanded === it.id;
              return (
                <div
                  key={it.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-md transition hover:border-primary/50"
                  style={{ boxShadow: "0 10px 30px -20px rgba(0,0,0,0.6)" }}
                >
                  {it.image_url ? (
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                      <img
                        src={it.image_url}
                        alt={it.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center bg-muted">
                      <Wine className="h-14 w-14 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{it.name}</h3>
                      {canEdit && (
                        <button
                          onClick={() => {
                            if (confirm(`Usunąć „${it.name}”?`)) delMut.mutate(it.id);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                          title="Usuń"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {it.category && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                          {it.category}
                        </span>
                      )}
                      {it.price_tier && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                          {it.price_tier}
                        </span>
                      )}
                    </div>
                    {it.tasting_notes && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{it.tasting_notes}</p>
                    )}
                    {it.upsell_pitch && (
                      <div className="mt-1 rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <Sparkles className="h-3 w-3" /> Tekst sprzedażowy
                        </div>
                        <p className={cn("text-xs leading-relaxed text-foreground/90", !isOpen && "line-clamp-4")}>
                          {it.upsell_pitch}
                        </p>
                      </div>
                    )}
                    {it.pairing_suggestions && isOpen && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/80">Pasuje do: </span>
                        {it.pairing_suggestions}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {it.created_by ? `Dodał: ${it.created_by}` : ""}
                      </span>
                      <button
                        onClick={() => setExpanded(isOpen ? null : it.id)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {isOpen ? "Mniej" : "Więcej"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}