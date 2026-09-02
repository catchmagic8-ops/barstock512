import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Loader2, Phone, Package, Calendar, BookOpen, ChevronDown, ChevronUp, BellRing, Check, ImagePlus, Repeat, Pencil, Sparkles, Upload, Utensils, Users, Palette, Clock, MapPin, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import StockManager from "@/components/StockManager";
import SubcategoryManager from "@/components/SubcategoryManager";
import ALaCarteManager from "@/components/ALaCarteManager";
import UserManagement from "@/components/UserManagement";
import AccentPicker from "@/components/AccentPicker";
import DeptImageSettings from "@/components/DeptImageSettings";
import AppearanceSettings from "@/components/AppearanceSettings";
import WeeklyTasksManager from "@/components/WeeklyTasksManager";
import { useInventory } from "@/hooks/useInventory";
import { isStockStale, STALE_STOCK_DAYS } from "@/lib/inventory";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath, deptSubPath } from "@/lib/department";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { AmbientBackgroundForDepartment } from "@/components/AmbientBackground";

function AdminSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  alertCount = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  alertCount?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasAlert = alertCount > 0;
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-300",
        hasAlert
          ? "border-destructive/60 bg-gradient-to-b from-destructive/[0.08] to-destructive/[0.03] shadow-[0_0_24px_hsl(var(--destructive)/0.15)]"
          : "border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06]",
        !hasAlert && "hover:border-primary/40"
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", hasAlert ? "text-destructive" : "text-primary")} />
          <h2 className="font-heading font-bold tracking-wide text-foreground">{title}</h2>
          {hasAlert && (
            <span className="rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
              {alertCount} {alertCount === 1 ? "alert" : "alerty"}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border/40 p-5">{children}</div>}
    </div>
  );
}

function useFlaggedCount() {
  const { items } = useInventory();
  return items.filter((i: any) => i.needsRestock).length;
}

function LowStockAlerts() {
  const { items, clearFlag, clearAllFlags, confirmStock } = useInventory();
  const { user } = useAuth();
  const flagged = items.filter((i: any) => i.needsRestock);
  const stale = items.filter((i: any) => isStockStale(i));
  const [staleOpen, setStaleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirmOne = async (item: any) => {
    try {
      await confirmStock.mutateAsync({
        id: item.id,
        qtyLeft: item.qtyLeft ?? null,
        note: "Potwierdzono bez zmian (panel admina)",
        username: user?.username ?? null,
      });
    } catch {
      toast.error(`Nie udało się potwierdzić: ${item.name}`);
      throw new Error("fail");
    }
  };

  const confirmAllStale = async () => {
    if (!window.confirm(`Potwierdzić aktualność stanu dla ${stale.length} pozycji? Alerty „nieaktualne" zostaną zdjęte.`)) return;
    setBusy(true);
    let ok = 0;
    for (const item of stale) {
      try {
        await confirmOne(item);
        ok++;
      } catch {
        /* already toasted */
      }
    }
    setBusy(false);
    if (ok > 0) toast.success(`Odświeżono ${ok} ${ok === 1 ? "pozycję" : "pozycji"}`);
  };


  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {flagged.length === 0
            ? "Brak powiadomień o niskim stanie."
            : `${flagged.length} ${flagged.length === 1 ? "pozycja oznaczona" : "pozycji oznaczonych"} przez personel.`}
        </p>
        {flagged.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (window.confirm("Wyczyścić wszystkie oznaczenia niskiego stanu?")) {
                clearAllFlags.mutate(undefined, {
                  onSuccess: () => toast.success("Wszystkie oznaczenia wyczyszczone"),
                });
              }
            }}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" /> Wyczyść wszystko
          </Button>
        )}
      </div>

      {flagged.length > 0 && (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {flagged.map((item: any) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <BellRing className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                  <span className="font-medium text-foreground text-sm">{item.name}</span>
                  {item.subcategory && (
                    <span className="text-xs text-primary/80">({item.subcategory})</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 ml-5 capitalize">
                  {item.category} · {item.unit}
                </p>
                {item.restockNote && (
                  <p className="text-xs text-warning/90 italic mt-1 ml-5">
                    “{item.restockNote}”
                  </p>
                )}
                {item.flaggedAt && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 ml-5">
                    Oznaczono {new Date(item.flaggedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-xs"
                onClick={() =>
                  clearFlag.mutate(item.id, {
                    onSuccess: () => toast.success("Oznaczono jako uzupełnione"),
                  })
                }
              >
                <Check className="h-3.5 w-3.5" /> Gotowe
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Nieaktualne stany — pozycje bez potwierdzenia od ponad STALE_STOCK_DAYS dni */}
      <div className="rounded-lg border border-border/60 bg-foreground/[0.03] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Stany nieaktualne
              {stale.length > 0 && (
                <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                  {stale.length}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stale.length === 0
                ? `Wszystkie pozycje potwierdzone w ciągu ${STALE_STOCK_DAYS} dni.`
                : `Brak potwierdzenia od ponad ${STALE_STOCK_DAYS} dni. Potwierdź, aby zdjąć alert bez zmiany ilości.`}
            </p>
          </div>
          {stale.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setStaleOpen(!staleOpen)} className="text-xs">
                {staleOpen ? "Ukryj listę" : "Pokaż listę"}
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={confirmAllStale} className="gap-1.5">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Wyczyść wszystkie alerty
              </Button>
            </div>
          )}
        </div>

        {staleOpen && stale.length > 0 && (
          <div className="mt-3 max-h-[40vh] space-y-1.5 overflow-y-auto">
            {stale.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{item.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[item.category, item.subcategory, item.storehouse].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs"
                  disabled={busy}
                  onClick={() =>
                    confirmOne(item)
                      .then(() => toast.success("Stan potwierdzony"))
                      .catch(() => {})
                  }
                >
                  <Check className="h-3.5 w-3.5" /> Potwierdź
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function ContactsManager() {
  const qc = useQueryClient();
  const { tables, department } = useDepartment();
  const QKEY = ["contacts", department];
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [category, setCategory] = useState("");
  const [extension, setExtension] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setName(""); setRole(""); setCategory(""); setExtension(""); setPhone(""); setEmail(""); setNotes("");
  };

  const openAdd = () => { resetForm(); setOpen(true); };
  const openEdit = (c: any) => {
    setEditingId(c.id);
    setName(c.name ?? "");
    setRole(c.role ?? "");
    setCategory(c.category ?? "");
    setExtension(c.extension ?? "");
    setPhone(c.phone ?? "");
    setEmail(c.email ?? "");
    setNotes(c.notes ?? "");
    setOpen(true);
  };

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(tables.contacts)
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveContact = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        role: role || null,
        category: category || null,
        extension: extension || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
      };
      if (editingId) {
        const { error } = await (supabase as any)
          .from(tables.contacts)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from(tables.contacts).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      setOpen(false);
      const wasEditing = !!editingId;
      resetForm();
      toast.success(wasEditing ? "Kontakt zaktualizowany" : "Kontakt dodany");
    },
    onError: () => toast.error(editingId ? "Nie udało się zaktualizować kontaktu" : "Nie udało się dodać kontaktu"),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(tables.contacts).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success("Kontakt usunięty");
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Zarządzaj przydatnymi kontaktami widocznymi dla całego personelu.</p>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Dodaj
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Brak kontaktów</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[c.category, c.role, c.extension && `Wew. ${c.extension}`, c.phone, c.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => deleteContact.mutate(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">
              {editingId ? "Edytuj kontakt" : "Dodaj kontakt"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Kategoria (np. Recepcja, Kuchnia)" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Rola / Stanowisko (np. Kierownik)" value={role} onChange={(e) => setRole(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Imię i nazwisko *" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Numer wewnętrzny (np. 1700)" value={extension} onChange={(e) => setExtension(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Numer telefonu" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border" />
            <Textarea placeholder="Notatki (opcjonalnie)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="bg-secondary border-border" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Anuluj</Button>
            <Button onClick={() => saveContact.mutate()} disabled={!name || saveContact.isPending}>
              {saveContact.isPending ? "Zapisywanie…" : editingId ? "Zapisz zmiany" : "Dodaj kontakt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const EVENT_CATEGORIES = ["Wave", "Conference", "Bar512"] as const;
const DEPT_DEFAULT_CATEGORY: Record<string, (typeof EVENT_CATEGORIES)[number]> = {
  bar512: "Bar512",
  konferencje: "Conference",
  polskie_smaki: "Wave",
};
const RECURRENCE_OPTIONS = ["weekly", "biweekly", "monthly"];
const CONFERENCE_ROOMS = [
  "Roald Amundsen",
  "Willem Barents",
  "Vasco Da Gamma",
  "Christopher Columbus",
  "Marco Polo",
  "Baltic Panorama",
  "Henry Hudson",
  "James Cook",
  "Amergio Vespucci",
  "Ferdinand Magellan",
] as const;
const NO_LOCATION = "__none__";

function EventsManager() {
  const qc = useQueryClient();
  const { tables, department } = useDepartment();
  const QKEY = ["events", department];
  const defaultCategory = DEPT_DEFAULT_CATEGORY[department] ?? "Bar512";
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [category, setCategory] = useState<string>(defaultCategory);
  const [location, setLocation] = useState<string>(NO_LOCATION);
  const [foodMenu, setFoodMenu] = useState("");
  const [beverageMenu, setBeverageMenu] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("weekly");
  const [scanning, setScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setEditingId(null);
    setTitle(""); setDescription(""); setEventDate(""); setEventTime("");
    setCategory(defaultCategory);
    setLocation(NO_LOCATION);
    setFoodMenu(""); setBeverageMenu(""); setGuestCount("");
    setIsRecurring(false); setRecurrenceRule("weekly");
  };

  const openAdd = () => { resetForm(); setOpen(true); };
  const openEdit = (ev: any) => {
    setEditingId(ev.id);
    setTitle(ev.title ?? "");
    setDescription(ev.description ?? "");
    setEventDate(ev.event_date ?? "");
    setEventTime(ev.event_time ? String(ev.event_time).slice(0, 5) : "");
    setCategory(ev.category ?? defaultCategory);
    setLocation(ev.location && (CONFERENCE_ROOMS as readonly string[]).includes(ev.location) ? ev.location : NO_LOCATION);
    setFoodMenu(ev.food_menu ?? "");
    setBeverageMenu(ev.beverage_menu ?? "");
    setGuestCount(ev.guest_count != null ? String(ev.guest_count) : "");
    setIsRecurring(!!ev.is_recurring);
    setRecurrenceRule(ev.recurrence_rule ?? "weekly");
    setOpen(true);
  };

  const handleScanFile = async (file: File) => {
    if (!file) return;
    setScanning(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("scan-event-sheet", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      const ev = data?.event;
      if (!ev) throw new Error("No event returned");
      setTitle(ev.title ?? "");
      setDescription(ev.description ?? "");
      setEventDate(ev.event_date ?? "");
      setEventTime(ev.event_time ?? "");
      setCategory(
        (EVENT_CATEGORIES as readonly string[]).includes(ev.category)
          ? ev.category
          : defaultCategory,
      );
      setLocation(
        ev.location && (CONFERENCE_ROOMS as readonly string[]).includes(ev.location)
          ? ev.location
          : NO_LOCATION,
      );
      setFoodMenu(ev.food_menu ?? "");
      setBeverageMenu(ev.beverage_menu ?? "");
      setGuestCount(ev.guest_count != null ? String(ev.guest_count) : "");
      setIsRecurring(!!ev.is_recurring);
      setRecurrenceRule(ev.recurrence_rule ?? "weekly");
      setOpen(true);
      toast.success("Karta wydarzenia zeskanowana — sprawdź i zapisz");
    } catch (err: any) {
      console.error(err);
      const msg = err?.context?.error || err?.message || "Nie udało się zeskanować karty";
      toast.error(msg);
    } finally {
      setScanning(false);
      if (scanInputRef.current) scanInputRef.current.value = "";
    }
  };

  const { data: events = [], isLoading } = useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from(tables.events).select("*").order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveEvent = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        description: description || null,
        event_date: eventDate,
        event_time: eventTime || null,
        category,
        location: location && location !== NO_LOCATION ? location : null,
        food_menu: foodMenu || null,
        beverage_menu: beverageMenu || null,
        guest_count: guestCount ? parseInt(guestCount, 10) : null,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : null,
      };
      if (editingId) {
        const { error } = await (supabase as any)
          .from(tables.events)
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from(tables.events).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      const wasEditing = !!editingId;
      setOpen(false); resetForm();
      toast.success(wasEditing ? "Wydarzenie zaktualizowane" : "Wydarzenie dodane");
    },
    onError: () => toast.error(editingId ? "Nie udało się zaktualizować wydarzenia" : "Nie udało się dodać wydarzenia"),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(tables.events).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success("Wydarzenie usunięte");
    },
  });

  return (
    <div className="space-y-3">
      <input
        ref={scanInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleScanFile(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleScanFile(e.target.files[0])}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <p className="text-sm text-muted-foreground">Dodawaj, przeglądaj i usuwaj wydarzenia. Zeskanuj papierową kartę, aby uzupełnić automatycznie.</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={scanning}
            className="gap-1.5 sm:hidden"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {scanning ? "Skanowanie…" : "Aparat"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => scanInputRef.current?.click()}
            disabled={scanning}
            className="gap-1.5"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="sm:hidden">Prześlij</span>
            <span className="hidden sm:inline">{scanning ? "Skanowanie…" : "Skanuj kartę"}</span>
          </Button>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" /> Dodaj wydarzenie
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Brak wydarzeń</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev: any) => (
            <div key={ev.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{ev.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[ev.event_date, ev.category, ev.location].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8" onClick={() => openEdit(ev)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => deleteEvent.mutate(ev.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">{editingId ? "Edytuj wydarzenie" : "Dodaj wydarzenie"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Tytuł wydarzenia" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary border-border" />
            <Textarea placeholder="Opis (opcjonalnie)" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary border-border" rows={3} />
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Lokalizacja (opcjonalnie)</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Wybierz salę" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LOCATION}>— Brak lokalizacji —</SelectItem>
                  {CONFERENCE_ROOMS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Data</Label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Godzina (opcjonalnie)</Label>
                <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Liczba gości (opcjonalnie)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="np. 50"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Menu kulinarne (opcjonalnie)</Label>
              <Textarea
                placeholder="Jedna pozycja w wierszu"
                value={foodMenu}
                onChange={(e) => setFoodMenu(e.target.value)}
                rows={3}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Menu napojów (opcjonalnie)</Label>
              <Textarea
                placeholder="Jedna pozycja w wierszu"
                value={beverageMenu}
                onChange={(e) => setBeverageMenu(e.target.value)}
                rows={3}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm text-foreground">Wydarzenie cykliczne</Label>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Częstotliwość powtarzania" /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Anuluj</Button>
            <Button onClick={() => saveEvent.mutate()} disabled={!title || !eventDate || saveEvent.isPending}>
              {saveEvent.isPending ? "Zapisywanie…" : editingId ? "Zapisz zmiany" : "Dodaj wydarzenie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function uploadRecipeImage(file: File, department: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${department}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("recipe-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
  return data.publicUrl;
}

function RecipesManager() {
  const qc = useQueryClient();
  const { tables, department } = useDepartment();
  const QKEY = ["recipes", department];
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cocktail");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from(tables.recipes).select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setName(""); setCategory("cocktail"); setIngredients(""); setInstructions("");
    setImageFile(null); setImagePreview(null); setExistingImage(null);
  };

  const openAdd = () => { resetForm(); setOpen(true); };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setName(r.name ?? "");
    setCategory(r.category ?? "cocktail");
    setIngredients(r.ingredients ?? "");
    setInstructions(r.instructions ?? "");
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(r.image_url ?? null);
    setOpen(true);
  };

  const saveRecipe = useMutation({
    mutationFn: async () => {
      let image_url: string | null = existingImage;
      if (imageFile) image_url = await uploadRecipeImage(imageFile, department);
      const payload = { name, category, ingredients, instructions, image_url };
      if (editingId) {
        const { error } = await (supabase as any).from(tables.recipes).update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from(tables.recipes).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      const wasEdit = !!editingId;
      setOpen(false);
      resetForm();
      toast.success(wasEdit ? "Przepis zaktualizowany" : "Przepis dodany");
    },
    onError: () => toast.error(editingId ? "Nie udało się zaktualizować przepisu" : "Nie udało się dodać przepisu"),
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(tables.recipes).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success("Przepis usunięty");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const shownImage = imagePreview ?? existingImage;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Dodawaj, edytuj i usuwaj przepisy.</p>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Dodaj przepis
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Brak przepisów</p>
      ) : (
        <div className="space-y-2">
          {recipes.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{r.category}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8" onClick={() => openEdit(r)} aria-label={`Edytuj ${r.name}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => deleteRecipe.mutate(r.id)} aria-label={`Usuń ${r.name}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">{editingId ? "Edytuj przepis" : "Dodaj przepis"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Nazwa przepisu" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Kategoria (np. koktajl, mocktail, shot)" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-secondary border-border" />
            <Textarea placeholder="Składniki (jeden w wierszu)" value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={4} className="bg-secondary border-border" />
            <Textarea placeholder="Instrukcje" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} className="bg-secondary border-border" />
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {shownImage ? (
                <div className="relative">
                  <img src={shownImage} alt="Preview" className="w-full max-h-48 rounded-lg object-cover" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>Zmień</Button>
                    <Button type="button" variant="destructive" size="sm" onClick={() => { setImageFile(null); setImagePreview(null); setExistingImage(null); }}>Usuń</Button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full gap-2 border-dashed border-border text-muted-foreground" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> Dodaj zdjęcie
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Anuluj</Button>
            <Button onClick={() => saveRecipe.mutate()} disabled={!name || !ingredients || !instructions || saveRecipe.isPending}>
              {saveRecipe.isPending ? "Zapisywanie…" : editingId ? "Zapisz zmiany" : "Dodaj przepis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export default function Admin() {
  const { department, meta } = useDepartment();
  const { isGlobalAdmin } = useAuth();
  const flaggedCount = useFlaggedCount();
  return (
    <div className="relative min-h-screen">
        <AmbientBackgroundForDepartment intensity={0.4} blur={3} />
        <header className="app-header sticky top-0 z-30 bg-background/40 backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <Link to={deptHomePath(department)}>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="font-heading text-xl font-bold tracking-wide text-brand sm:text-2xl">Panel administracyjny</h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">· {meta.label}</span>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-4xl px-5 py-8 space-y-5 sm:px-8">
          {isGlobalAdmin && (
            <AdminSection title="Zarządzanie użytkownikami" icon={Users}>
              <UserManagement />
            </AdminSection>
          )}

          <AdminSection title="Wygląd aplikacji" icon={Palette}>
            <AccentPicker />
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Elementy interfejsu
              </p>
              <AppearanceSettings />
            </div>
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Zdjęcia i tła
              </p>
              <DeptImageSettings />
            </div>
          </AdminSection>

          <Link
            to={deptSubPath(department, "locations")}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] px-5 py-4 transition-colors hover:border-primary/40"
          >
            <span className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span>
                <span className="block text-sm font-semibold text-foreground">Lokalizacje</span>
                <span className="block text-xs text-muted-foreground">
                  Zarządzaj pomieszczeniami i przypisz je do produktów
                </span>
              </span>
            </span>
            <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
          </Link>

          <AdminSection title="Alerty niskiego stanu" icon={BellRing} alertCount={flaggedCount}>
            <LowStockAlerts />
          </AdminSection>

          {department === "bar512" && (
            <AdminSection title="Obowiązki" icon={ClipboardList}>
              <WeeklyTasksManager />
            </AdminSection>
          )}


          <AdminSection title="Zarządzanie zapasami" icon={Package}>
            <div className="space-y-4">
              <SubcategoryManager />
              <div className="border-t border-border pt-4">
                <StockManager />
              </div>
            </div>
          </AdminSection>

          <AdminSection title="Zarządzanie kontaktami" icon={Phone}>
            <ContactsManager />
          </AdminSection>

          <AdminSection title="Zarządzanie wydarzeniami" icon={Calendar}>
            <EventsManager />
          </AdminSection>

          <AdminSection title="Zarządzanie przepisami" icon={BookOpen}>
            <RecipesManager />
          </AdminSection>

          {department !== "konferencje" && (
            <AdminSection title="Menu à la carte" icon={Utensils}>
              <ALaCarteManager />
            </AdminSection>
          )}
        </main>
    </div>
  );
}
