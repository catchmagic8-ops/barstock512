import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, MessageSquare, Pin, PinOff, Plus, Check, Trash2, RotateCcw, User, Reply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { deptHomePath } from "@/lib/department";
import { AmbientBackgroundForDepartment } from "@/components/AmbientBackground";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useHandoverRealtime } from "@/hooks/useHandoverRealtime";


const CATEGORIES = ["Ogólne", "Zmiana / Handover", "Braki", "Goście / VIP", "Usterki", "Ważne"] as const;

const CAT_STYLE: Record<string, string> = {
  "Ogólne": "bg-muted text-muted-foreground border-border/60",
  "Zmiana / Handover": "bg-primary/15 text-primary border-primary/30",
  "Braki": "bg-warning/15 text-warning border-warning/30",
  "Goście / VIP": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "Usterki": "bg-orange-500/15 text-orange-500 border-orange-500/30",
  "Ważne": "bg-destructive/15 text-destructive border-destructive/30",
};

interface Note {
  id: string;
  department: string;
  author_username: string | null;
  category: string;
  message: string;
  pinned: boolean;
  resolved: boolean;
  created_at: string;
  parent_id: string | null;
}


function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Info() {
  const navigate = useNavigate();
  const { department, meta } = useDepartment();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("Zmiana / Handover");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const queryKey = ["handover-notes", department];

  useHandoverRealtime(department);

  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("handover_notes")
        .select("*")
        .eq("department", department)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey });
    qc.invalidateQueries({ queryKey: ["handover-notes-count", department] });
  };

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("handover_notes").insert({
        department,
        category,
        message: message.trim(),
        author_username: user?.username ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      setOpen(false);
      invalidate();
      toast({ title: "Wiadomość dodana" });
    },
    onError: (e: any) => toast({ title: "Błąd", description: e.message, variant: "destructive" }),
  });

  const addReply = useMutation({
    mutationFn: async ({ parent, text, cat }: { parent: string; text: string; cat: string }) => {
      const { error } = await (supabase as any).from("handover_notes").insert({
        department,
        category: cat,
        message: text.trim(),
        author_username: user?.username ?? null,
        parent_id: parent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyText("");
      setReplyTo(null);
      invalidate();
      toast({ title: "Odpowiedź dodana" });
    },
    onError: (e: any) => toast({ title: "Błąd", description: e.message, variant: "destructive" }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Note> }) => {
      const { error } = await (supabase as any).from("handover_notes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("handover_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Wiadomość usunięta" });
    },
  });

  const repliesByParent = useMemo(() => {
    const map = new Map<string, Note[]>();
    notes
      .filter((n) => n.parent_id)
      .forEach((n) => {
        const arr = map.get(n.parent_id!) ?? [];
        arr.push(n);
        map.set(n.parent_id!, arr);
      });
    map.forEach((arr) =>
      arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    );
    return map;
  }, [notes]);

  const matches = (n: Note, q: string) =>
    [n.message, n.category, n.author_username]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (n.parent_id) return false;
      if (!showResolved && n.resolved) return false;
      if (!q) return true;
      const replies = repliesByParent.get(n.id) ?? [];
      return matches(n, q) || replies.some((r) => matches(r, q));
    });
  }, [notes, search, showResolved, repliesByParent]);

  const openCount = notes.filter((n) => !n.resolved && !n.parent_id).length;



  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackgroundForDepartment intensity={0.4} blur={3} />

      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/50 px-5 py-4 backdrop-blur-xl backdrop-saturate-150 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(deptHomePath(department))}
              title="Powrót"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-heading text-lg font-bold tracking-wide text-brand sm:text-xl">
                INFO / HANDOVER
              </h1>
              <p className="text-xs text-muted-foreground">
                {meta.label} · {openCount} aktywn{openCount === 1 ? "a" : "ych"} wiadomoś{openCount === 1 ? "ć" : "ci"}
              </p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Dodaj
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background/95 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle>Nowa wiadomość</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Kategoria</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
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
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Treść</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                    placeholder="Np. Kończy się Prosecco, zamówione na wtorek. Stolik 12 — goście wracają o 20:00."
                    rows={5}
                  />
                  <p className="text-right text-[11px] text-muted-foreground">{message.length}/2000</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Anuluj
                </Button>
                <Button
                  onClick={() => addNote.mutate()}
                  disabled={!message.trim() || addNote.isPending}
                >
                  {addNote.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Opublikuj
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mx-auto mt-3 flex max-w-3xl items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj w wiadomościach…"
            className="h-9"
          />
          <Button
            variant={showResolved ? "default" : "secondary"}
            size="sm"
            onClick={() => setShowResolved((v) => !v)}
            className="shrink-0"
          >
            {showResolved ? "Ukryj załatwione" : "Pokaż załatwione"}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6 sm:px-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-border/40 bg-card/40 p-10 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Brak wiadomości. Dodaj pierwszą informację dla zespołu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((n) => {
              const replies = repliesByParent.get(n.id) ?? [];
              return (
              <article

                key={n.id}
                className={cn(
                  "rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.05] p-4 transition-colors",
                  n.pinned && "border-primary/40",
                  n.resolved && "opacity-60"
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      CAT_STYLE[n.category] ?? CAT_STYLE["Ogólne"]
                    )}
                  >
                    {n.category}
                  </span>
                  {n.pinned && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <Pin className="h-3 w-3" /> przypięte
                    </span>
                  )}
                  {n.resolved && (
                    <span className="text-[11px] font-semibold text-emerald-500">załatwione</span>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {formatDate(n.created_at)}
                  </span>
                </div>

                <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {n.message}
                </p>

                {replies.length > 0 && (
                  <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
                    {replies.map((r) => (
                      <div key={r.id} className="rounded-xl border border-border/40 bg-background/40 p-2.5">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <User className="h-3 w-3" />
                          {r.author_username ?? "nieznany"}
                          <span className="ml-auto">{formatDate(r.created_at)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => deleteNote.mutate(r.id)}
                            title="Usuń odpowiedź"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {r.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {replyTo === n.id && (
                  <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value.slice(0, 2000))}
                      placeholder="Twoja odpowiedź…"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyText("");
                        }}
                      >
                        Anuluj
                      </Button>
                      <Button
                        size="sm"
                        disabled={!replyText.trim() || addReply.isPending}
                        onClick={() =>
                          addReply.mutate({ parent: n.id, text: replyText, cat: n.category })
                        }
                      >
                        {addReply.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                        Odpowiedz
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-2.5">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <User className="h-3 w-3" />
                    {n.author_username ?? "nieznany"}
                  </span>
                  {replies.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-primary">
                      <MessageSquare className="h-3 w-3" />
                      {replies.length} odpowied{replies.length === 1 ? "ź" : "zi"}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setReplyText("");
                        setReplyTo((v) => (v === n.id ? null : n.id));
                      }}
                    >
                      <Reply className="h-3.5 w-3.5" />
                      Odpowiedz
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => updateNote.mutate({ id: n.id, patch: { pinned: !n.pinned } })}
                    >
                      {n.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      {n.pinned ? "Odepnij" : "Przypnij"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => updateNote.mutate({ id: n.id, patch: { resolved: !n.resolved } })}
                    >
                      {n.resolved ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      {n.resolved ? "Przywróć" : "Załatwione"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => deleteNote.mutate(n.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Usuń
                    </Button>
                  </div>
                </div>
              </article>
              );
            })}

          </div>
        )}
      </main>
    </div>
  );
}
