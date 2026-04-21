import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Loader2, Phone, Package, Calendar, BookOpen, ChevronDown, ChevronUp, BellRing, Check, ImagePlus, Repeat, Pencil, Sparkles, Upload,
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
import OptionsPasswordGate from "@/components/OptionsPasswordGate";
import StockManager from "@/components/StockManager";
import SubcategoryManager from "@/components/SubcategoryManager";
import { useInventory } from "@/hooks/useInventory";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";

function AdminSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-bold text-foreground">{title}</h2>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border p-4">{children}</div>}
    </div>
  );
}

function LowStockAlerts() {
  const { items, clearFlag, clearAllFlags } = useInventory();
  const flagged = items.filter((i: any) => i.needsRestock);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {flagged.length === 0
            ? "No low-stock notifications."
            : `${flagged.length} item${flagged.length === 1 ? "" : "s"} flagged by staff.`}
        </p>
        {flagged.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (window.confirm("Clear all low-stock flags?")) {
                clearAllFlags.mutate(undefined, {
                  onSuccess: () => toast.success("All flags cleared"),
                });
              }
            }}
            className="gap-1.5"
          >
            <Check className="h-4 w-4" /> Clear all
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
                    Flagged {new Date(item.flaggedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 text-xs"
                onClick={() =>
                  clearFlag.mutate(item.id, {
                    onSuccess: () => toast.success("Marked as restocked"),
                  })
                }
              >
                <Check className="h-3.5 w-3.5" /> Done
              </Button>
            </div>
          ))}
        </div>
      )}
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
      toast.success(wasEditing ? "Contact updated" : "Contact added");
    },
    onError: () => toast.error(editingId ? "Failed to update contact" : "Failed to add contact"),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(tables.contacts).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success("Contact deleted");
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Manage useful contacts visible to all staff.</p>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No contacts yet</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[c.category, c.role, c.extension && `Ext ${c.extension}`, c.phone, c.email].filter(Boolean).join(" · ")}
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
              {editingId ? "Edit Contact" : "Add Contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Category (e.g. Front Desk, Kitchen)" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Role / Title (e.g. Manager)" value={role} onChange={(e) => setRole(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Extension (e.g. 1700)" value={extension} onChange={(e) => setExtension(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border" />
            <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="bg-secondary border-border" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={() => saveContact.mutate()} disabled={!name || saveContact.isPending}>
              {saveContact.isPending ? "Saving…" : editingId ? "Save Changes" : "Add Contact"}
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
      toast.success("Event sheet scanned — review and save");
    } catch (err: any) {
      console.error(err);
      const msg = err?.context?.error || err?.message || "Failed to scan sheet";
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
      toast.success(wasEditing ? "Event updated" : "Event added");
    },
    onError: () => toast.error(editingId ? "Failed to update event" : "Failed to add event"),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(tables.events).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success("Event deleted");
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
        <p className="text-sm text-muted-foreground">Add, view and delete events. Scan a physical sheet to auto-fill.</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={scanning}
            className="gap-1.5 sm:hidden"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {scanning ? "Scanning…" : "Camera"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => scanInputRef.current?.click()}
            disabled={scanning}
            className="gap-1.5"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="sm:hidden">Upload</span>
            <span className="hidden sm:inline">{scanning ? "Scanning…" : "Scan Sheet"}</span>
          </Button>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No events</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev: any) => (
            <div key={ev.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{ev.title}</p>
                <p className="text-xs text-muted-foreground">{ev.event_date} · {ev.category}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8" onClick={() => deleteEvent.mutate(ev.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-secondary border-border" />
            <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary border-border" rows={3} />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Time (optional)</Label>
                <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Number of guests (optional)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 50"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Food menu (optional)</Label>
              <Textarea
                placeholder="One item per line"
                value={foodMenu}
                onChange={(e) => setFoodMenu(e.target.value)}
                rows={3}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Beverage menu (optional)</Label>
              <Textarea
                placeholder="One item per line"
                value={beverageMenu}
                onChange={(e) => setBeverageMenu(e.target.value)}
                rows={3}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm text-foreground">Recurring event</Label>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Repeat frequency" /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addEvent.mutate()} disabled={!title || !eventDate || addEvent.isPending}>
              {addEvent.isPending ? "Adding…" : "Add Event"}
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
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cocktail");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: QKEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from(tables.recipes).select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addRecipe = useMutation({
    mutationFn: async () => {
      let image_url: string | null = null;
      if (imageFile) image_url = await uploadRecipeImage(imageFile, department);
      const { error } = await (supabase as any).from(tables.recipes).insert({ name, category, ingredients, instructions, image_url });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      setOpen(false);
      setName(""); setCategory("cocktail"); setIngredients(""); setInstructions("");
      setImageFile(null); setImagePreview(null);
      toast.success("Recipe added");
    },
    onError: () => toast.error("Failed to add recipe"),
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(tables.recipes).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QKEY });
      toast.success("Recipe deleted");
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

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Add, view and delete recipes.</p>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Recipe
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No recipes</p>
      ) : (
        <div className="space-y-2">
          {recipes.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{r.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{r.category}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8" onClick={() => deleteRecipe.mutate(r.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Add Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Recipe name" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Category (e.g. cocktail, mocktail, shot)" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-secondary border-border" />
            <Textarea placeholder="Ingredients (one per line)" value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={4} className="bg-secondary border-border" />
            <Textarea placeholder="Instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} className="bg-secondary border-border" />
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-48 rounded-lg object-cover" />
                  <Button type="button" variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => { setImageFile(null); setImagePreview(null); }}>Remove</Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full gap-2 border-dashed border-border text-muted-foreground" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> Add Photo
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addRecipe.mutate()} disabled={!name || !ingredients || !instructions || addRecipe.isPending}>
              {addRecipe.isPending ? "Adding…" : "Add Recipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Admin() {
  const { department, meta } = useDepartment();
  return (
    <OptionsPasswordGate>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link to={deptHomePath(department)}>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="font-heading text-lg font-bold text-foreground">Admin Panel</h1>
              <span className="text-xs text-muted-foreground hidden sm:inline">· {meta.label}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          <AdminSection title="Low Stock Alerts" icon={BellRing} defaultOpen>
            <LowStockAlerts />
          </AdminSection>

          <AdminSection title="Inventory Management" icon={Package}>
            <div className="space-y-4">
              <SubcategoryManager />
              <div className="border-t border-border pt-4">
                <StockManager />
              </div>
            </div>
          </AdminSection>

          <AdminSection title="Contacts Management" icon={Phone}>
            <ContactsManager />
          </AdminSection>

          <AdminSection title="Events Management" icon={Calendar}>
            <EventsManager />
          </AdminSection>

          <AdminSection title="Recipes Management" icon={BookOpen}>
            <RecipesManager />
          </AdminSection>
        </main>
      </div>
    </OptionsPasswordGate>
  );
}
