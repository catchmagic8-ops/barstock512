import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Loader2, Phone, User, Package, Calendar, BookOpen, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import OptionsPasswordGate from "@/components/OptionsPasswordGate";
import StockManager from "@/components/StockManager";
import SubcategoryManager from "@/components/SubcategoryManager";

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

function ContactsManager() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").insert({
        name,
        role: role || null,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      setOpen(false);
      setName(""); setRole(""); setPhone(""); setEmail(""); setNotes("");
      toast.success("Contact added");
    },
    onError: () => toast.error("Failed to add contact"),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Manage useful contacts visible to all staff.</p>
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No contacts yet</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/50 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[c.role, c.phone, c.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8" onClick={() => deleteContact.mutate(c.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Add Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Role (e.g. Manager, Supplier)" value={role} onChange={(e) => setRole(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border" />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary border-border" />
            <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="bg-secondary border-border" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => addContact.mutate()} disabled={!name || addContact.isPending}>
              {addContact.isPending ? "Adding…" : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventsManager() {
  const qc = useQueryClient();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Manage events. Add new events from the Events page.</p>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No events</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev) => (
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
    </div>
  );
}

function RecipesManager() {
  const qc = useQueryClient();
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe deleted");
    },
  });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Manage recipes. Add new recipes from the Recipes page.</p>
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      ) : recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No recipes</p>
      ) : (
        <div className="space-y-2">
          {recipes.map((r) => (
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
    </div>
  );
}

export default function Admin() {
  return (
    <OptionsPasswordGate>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link to="/home">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="font-heading text-lg font-bold text-foreground">Admin Panel</h1>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          <AdminSection title="Inventory Management" icon={Package} defaultOpen>
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
