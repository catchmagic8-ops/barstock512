import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Pin,
  PinOff,
  Plus,
  Check,
  Trash2,
  RotateCcw,
  User,
  Reply,
  Settings2,
  Archive,
  Pencil,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendPush } from "@/lib/pushNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { deptHomePath , deptSubPath } from "@/lib/department";
import { AmbientBackgroundForDepartment } from "@/components/AmbientBackground";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useHandoverRealtime } from "@/hooks/useHandoverRealtime";
import { getSettings, setSetting } from "@/lib/appSettings";
import HandoverReactions, { type Reaction } from "@/components/HandoverReactions";


const DEFAULT_CATEGORIES = [
  "Ogólne",
  "Zmiana / Handover",
  "Braki",
  "Goście / VIP",
  "Usterki",
  "Ważne",
];

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
  resolved_at: string | null;
  resolved_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
}

interface InputConfig {
  categories: string[];
  maxLength: number;
  staffCanPost: boolean;
  staffCanReply: boolean;
}

const DEFAULT_CONFIG: InputConfig = {
  categories: DEFAULT_CATEGORIES,
  maxLength: 2000,
  staffCanPost: true,
  staffCanReply: true,
};

function configKey(dept: string) {
  return `handover_input_${dept}`;
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
  const { user, isAdmin, isViewer } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("Zmiana / Handover");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategory, setEditCategory] = useState("");

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

  const { data: config = DEFAULT_CONFIG } = useQuery({
    queryKey: ["handover-config", department],
    queryFn: async () => {
      const s = await getSettings([configKey(department)]);
      const raw = s[configKey(department)];
      if (!raw) return DEFAULT_CONFIG;
      try {
        const parsed = JSON.parse(raw) as Partial<InputConfig>;
        return {
          ...DEFAULT_CONFIG,
          ...parsed,
          categories:
            parsed.categories && parsed.categories.length > 0
              ? parsed.categories
              : DEFAULT_CATEGORIES,
        };
      } catch {
        return DEFAULT_CONFIG;
      }
    },
  });

  // Keep the selected category valid when admins change the configured list.
  useEffect(() => {
    if (!config.categories.includes(category)) setCategory(config.categories[0]);
  }, [config.categories, category]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey });
    qc.invalidateQueries({ queryKey: ["handover-notes-count", department] });
  };

  const canPost = isAdmin || config.staffCanPost;
  const canReply = isAdmin || config.staffCanReply;
  const ownsNote = (n: Note) =>
    !!user?.username && n.author_username?.toLowerCase() === user.username.toLowerCase();
  /** Only the author may remove their own entry; admins may remove anything. */
  const canDelete = (n: Note) => isAdmin || ownsNote(n);
  const canEdit = (n: Note) => isAdmin || ownsNote(n);

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("handover_notes").insert({
        department,
        category,
        message: message.trim().slice(0, config.maxLength),
        author_username: user?.username ?? null,
      });
      if (error) throw error;
      void sendPush("handover", {
        title: "Nowa wiadomość INFO",
        body: `${user?.username ?? "Ktoś"}: ${message.trim().slice(0, 90)}`,
        path: deptSubPath(department, "info"),
        actorUsername: user?.username,
      });
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
        message: text.trim().slice(0, config.maxLength),
        author_username: user?.username ?? null,
        parent_id: parent,
      });
      void sendPush("handover", {
        title: "Nowa odpowiedź INFO",
        body: `${user?.username ?? "Ktoś"}: ${text.trim().slice(0, 90)}`,
        path: deptSubPath(department, "info"),
        actorUsername: user?.username,
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
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await (supabase as any).from("handover_notes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast({ title: "Błąd", description: e.message, variant: "destructive" }),
  });

  const deleteNote = useMutation({
    mutationFn: async (note: Note) => {
      if (!canDelete(note)) throw new Error("Możesz usuwać tylko swoje wpisy");
      const { error } = await (supabase as any).from("handover_notes").delete().eq("id", note.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Wiadomość usunięta" });
    },
    onError: (e: any) => toast({ title: "Błąd", description: e.message, variant: "destructive" }),
  });

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await (supabase as any)
        .from("handover_notes")
        .update({
          message: editText.trim().slice(0, config.maxLength),
          category: editing.parent_id ? editing.category : editCategory,
          edited_at: new Date().toISOString(),
          edited_by: user?.username ?? null,
        })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(null);
      invalidate();
      toast({ title: "Wiadomość zaktualizowana" });
    },
    onError: (e: any) => toast({ title: "Błąd", description: e.message, variant: "destructive" }),
  });

  const saveConfig = useMutation({
    mutationFn: async (next: InputConfig) => {
      await setSetting(configKey(department), JSON.stringify(next));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["handover-config", department] });
      setSettingsOpen(false);
      toast({ title: "Ustawienia zapisane" });
    },
    onError: (e: any) => toast({ title: "Błąd", description: e.message, variant: "destructive" }),
  });

  const toggleResolved = (n: Note) =>
    updateNote.mutate({
      id: n.id,
      patch: n.resolved
        ? { resolved: false, resolved_at: null, resolved_by: null }
        : {
            resolved: true,
            resolved_at: new Date().toISOString(),
            resolved_by: user?.username ?? null,
          },
    });

  // ——— Reakcje emoji ———
  const noteIds = useMemo(() => notes.map((n) => n.id), [notes]);

  const { data: reactions = [] } = useQuery({
    queryKey: ["handover-reactions", department, noteIds.length],
    enabled: noteIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("handover_reactions")
        .select("id, note_id, emoji, username")
        .in("note_id", noteIds);
      if (error) throw error;
      return (data ?? []) as Reaction[];
    },
  });

  const reactionsByNote = useMemo(() => {
    const map = new Map<string, Reaction[]>();
    reactions.forEach((r) => {
      const arr = map.get(r.note_id) ?? [];
      arr.push(r);
      map.set(r.note_id, arr);
    });
    return map;
  }, [reactions]);

  const toggleReaction = useMutation({
    mutationFn: async ({ noteId, emoji }: { noteId: string; emoji: string }) => {
      const me = user?.username;
      if (!me) throw new Error("Brak zalogowanego użytkownika");
      const mine = (reactionsByNote.get(noteId) ?? []).find(
        (r) => r.emoji === emoji && r.username.toLowerCase() === me.toLowerCase()
      );
      if (mine) {
        const { error } = await (supabase as any)
          .from("handover_reactions")
          .delete()
          .eq("id", mine.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("handover_reactions")
          .insert({ note_id: noteId, emoji, username: me });
        if (error) throw error;
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["handover-reactions", department, noteIds.length] }),
    onError: (e: any) =>
      toast({
        title: "Nie udało się dodać reakcji",
        description: e?.message,
        variant: "destructive",
      }),
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

  const closedThreads = useMemo(
    () =>
      notes
        .filter((n) => !n.parent_id && n.resolved)
        .sort(
          (a, b) =>
            new Date(b.resolved_at ?? b.created_at).getTime() -
            new Date(a.resolved_at ?? a.created_at).getTime()
        ),
    [notes]
  );

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

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setLogOpen(true)}
                  title="Dziennik zamkniętych rozmów"
                >
                  <Archive className="h-4 w-4" />
                  <span className="hidden sm:inline">Dziennik</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                  title="Ustawienia wiadomości"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </>
            )}

            {canPost && (
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
                          {config.categories.map((c) => (
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
                        onChange={(e) => setMessage(e.target.value.slice(0, config.maxLength))}
                        placeholder="Np. Kończy się Prosecco, zamówione na wtorek. Stolik 12 — goście wracają o 20:00."
                        rows={5}
                      />
                      <p className="text-right text-[11px] text-muted-foreground">
                        {message.length}/{config.maxLength}
                      </p>
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
            )}
          </div>
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
                      <span className="text-[11px] font-semibold text-emerald-500">
                        załatwione{n.resolved_by ? ` · ${n.resolved_by}` : ""}
                        {n.resolved_at ? ` · ${formatDate(n.resolved_at)}` : ""}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {formatDate(n.created_at)}
                    </span>
                  </div>

                  <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {n.message}
                  </p>
                  {n.edited_at && (
                    <p className="mt-1 text-[11px] italic text-muted-foreground">
                      edytowane {formatDate(n.edited_at)}
                      {n.edited_by ? ` przez ${n.edited_by}` : ""}
                    </p>
                  )}

                  <div className="mt-2.5">
                    <HandoverReactions
                      reactions={reactionsByNote.get(n.id) ?? []}
                      username={user?.username}
                      disabled={isViewer}
                      onToggle={(emoji) => toggleReaction.mutate({ noteId: n.id, emoji })}
                    />
                  </div>



                  {replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
                      {replies.map((r) => (
                        <div
                          key={r.id}
                          className="rounded-xl border border-border/40 bg-background/40 p-2.5"
                        >
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <User className="h-3 w-3" />
                            {r.author_username ?? "nieznany"}
                            <span className="ml-auto">{formatDate(r.created_at)}</span>
                            {canEdit(r) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setEditing(r);
                                  setEditText(r.message);
                                  setEditCategory(r.category);
                                }}
                                title="Edytuj odpowiedź"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {canDelete(r) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => deleteNote.mutate(r)}
                                title="Usuń odpowiedź"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                            {r.message}
                          </p>
                          {r.edited_at && (
                            <p className="mt-1 text-[10px] italic text-muted-foreground">
                              edytowane {formatDate(r.edited_at)}
                              {r.edited_by ? ` przez ${r.edited_by}` : ""}
                            </p>
                          )}
                          <div className="mt-1.5">
                            <HandoverReactions
                              size="xs"
                              reactions={reactionsByNote.get(r.id) ?? []}
                              username={user?.username}
                              disabled={isViewer}
                              onToggle={(emoji) =>
                                toggleReaction.mutate({ noteId: r.id, emoji })
                              }
                            />
                          </div>
                        </div>

                      ))}
                    </div>
                  )}

                  {replyTo === n.id && (
                    <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value.slice(0, config.maxLength))}
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
                          {addReply.isPending && (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          )}
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
                      {canReply && (
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
                      )}
                      {canEdit(n) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditing(n);
                            setEditText(n.message);
                            setEditCategory(n.category);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edytuj
                        </Button>
                      )}
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
                        onClick={() => toggleResolved(n)}
                      >
                        {n.resolved ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {n.resolved ? "Przywróć" : "Załatwione"}
                      </Button>
                      {canDelete(n) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => deleteNote.mutate(n)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Usuń
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Edycja wiadomości */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Edytuj {editing?.parent_id ? "odpowiedź" : "wiadomość"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!editing?.parent_id && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Kategoria</label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...config.categories, editCategory].filter(Boolean))).map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value.slice(0, config.maxLength))}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Anuluj
            </Button>
            <Button onClick={() => saveEdit.mutate()} disabled={!editText.trim() || saveEdit.isPending}>
              {saveEdit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dziennik zamkniętych rozmów (admin) */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto bg-background/95 backdrop-blur-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dziennik zamkniętych rozmów</DialogTitle>
          </DialogHeader>
          {closedThreads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Brak zamkniętych rozmów.
            </p>
          ) : (
            <div className="space-y-2.5">
              {closedThreads.map((n) => {
                const replies = repliesByParent.get(n.id) ?? [];
                return (
                  <div key={n.id} className="rounded-xl border border-border/40 bg-card/50 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-semibold",
                          CAT_STYLE[n.category] ?? CAT_STYLE["Ogólne"]
                        )}
                      >
                        {n.category}
                      </span>
                      <span>utworzono {formatDate(n.created_at)}</span>
                      <span className="ml-auto text-emerald-500">
                        zamknięte {n.resolved_at ? formatDate(n.resolved_at) : "—"}
                        {n.resolved_by ? ` · ${n.resolved_by}` : ""}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      autor: {n.author_username ?? "nieznany"} · {replies.length} odpowiedzi
                    </p>
                    {replies.length > 0 && (
                      <div className="mt-2 space-y-1.5 border-l-2 border-border/60 pl-2.5">
                        {replies.map((r) => (
                          <div key={r.id} className="text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {r.author_username ?? "nieznany"}
                            </span>{" "}
                            · {formatDate(r.created_at)}
                            <p className="whitespace-pre-wrap text-foreground/80">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => toggleResolved(n)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Przywróć
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ustawienia sposobu dodawania wiadomości (admin) */}
      {isAdmin && (
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          config={config}
          saving={saveConfig.isPending}
          onSave={(next) => saveConfig.mutate(next)}
        />
      )}
    </div>
  );
}

function SettingsDialog({
  open,
  onOpenChange,
  config,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  config: InputConfig;
  saving: boolean;
  onSave: (next: InputConfig) => void;
}) {
  const [cats, setCats] = useState(config.categories.join(", "));
  const [maxLength, setMaxLength] = useState(String(config.maxLength));
  const [staffCanPost, setStaffCanPost] = useState(config.staffCanPost);
  const [staffCanReply, setStaffCanReply] = useState(config.staffCanReply);

  useEffect(() => {
    if (open) {
      setCats(config.categories.join(", "));
      setMaxLength(String(config.maxLength));
      setStaffCanPost(config.staffCanPost);
      setStaffCanReply(config.staffCanReply);
    }
  }, [open, config]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Ustawienia wiadomości</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Kategorie (oddzielone przecinkiem)
            </label>
            <Textarea value={cats} onChange={(e) => setCats(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Maksymalna długość wiadomości
            </label>
            <Input
              type="number"
              min={100}
              max={5000}
              value={maxLength}
              onChange={(e) => setMaxLength(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
            <div>
              <p className="text-sm font-medium">Personel może dodawać wiadomości</p>
              <p className="text-xs text-muted-foreground">Wyłącz, aby tylko admin tworzył wątki.</p>
            </div>
            <Switch checked={staffCanPost} onCheckedChange={setStaffCanPost} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
            <div>
              <p className="text-sm font-medium">Personel może odpowiadać</p>
              <p className="text-xs text-muted-foreground">Odpowiedzi w wątkach handover.</p>
            </div>
            <Switch checked={staffCanReply} onCheckedChange={setStaffCanReply} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button
            disabled={saving}
            onClick={() => {
              const parsedCats = cats
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean);
              const len = Math.min(5000, Math.max(100, parseInt(maxLength, 10) || 2000));
              onSave({
                categories: parsedCats.length ? parsedCats : DEFAULT_CATEGORIES,
                maxLength: len,
                staffCanPost,
                staffCanReply,
              });
            }}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
