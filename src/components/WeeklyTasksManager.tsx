import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  SkipForward,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useWeeklyTasks } from "@/hooks/useWeeklyTasks";
import {
  DUTIES_DEPARTMENT,
  PRIORITIES,
  RECURRENCES,
  SKIP_REASONS,
  addWeeks,
  formatWeekRange,
  progressOf,
  weekStart,
  type TaskTemplate,
} from "@/lib/weeklyTasks";

interface FormState {
  id?: string;
  title: string;
  description: string;
  area: string;
  category: string;
  priority: string;
  estimated_minutes: string;
  recurrence: string;
  active: boolean;
  visible_to_all: boolean;
  assigned: string;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  area: "",
  category: "",
  priority: "normal",
  estimated_minutes: "",
  recurrence: "weekly",
  active: true,
  visible_to_all: true,
  assigned: "",
};

function TemplatesTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["weekly-task-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("weekly_task_templates")
        .select("*")
        .eq("department_id", DUTIES_DEPARTMENT)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TaskTemplate[];
    },
  });

  const visible = templates.filter((t) => (showArchived ? t.archived : !t.archived));
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["weekly-task-templates"] });
    qc.invalidateQueries({ queryKey: ["weekly-tasks"] });
    qc.invalidateQueries({ queryKey: ["weekly-tasks-progress"] });
  };

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        department_id: DUTIES_DEPARTMENT,
        title: f.title.trim(),
        description: f.description.trim() || null,
        area: f.area.trim() || null,
        category: f.category.trim() || null,
        priority: f.priority,
        estimated_minutes: f.estimated_minutes ? Number(f.estimated_minutes) : null,
        recurrence: f.recurrence,
        active: f.active,
        visible_to_all: f.visible_to_all,
        assigned_usernames: f.visible_to_all
          ? []
          : f.assigned
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
      };
      if (f.id) {
        const { error } = await (supabase as any)
          .from("weekly_task_templates")
          .update(payload)
          .eq("id", f.id);
        if (error) throw error;
      } else {
        const maxOrder = templates.reduce((m, t) => Math.max(m, t.sort_order), 0);
        const { error } = await (supabase as any).from("weekly_task_templates").insert({
          ...payload,
          sort_order: maxOrder + 1,
          created_by: user?.username ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      setForm(null);
      toast.success("Zapisano");
    },
    onError: () => toast.error("Nie udało się zapisać"),
  });

  const patch = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await (supabase as any)
        .from("weekly_task_templates")
        .update(values)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("weekly_task_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Usunięto szablon");
    },
    onError: () => toast.error("Nie udało się usunąć"),
  });

  const move = (t: TaskTemplate, dir: -1 | 1) => {
    const list = visible;
    const idx = list.findIndex((x) => x.id === t.id);
    const other = list[idx + dir];
    if (!other) return;
    patch.mutate({ id: t.id, values: { sort_order: other.sort_order } });
    patch.mutate({ id: other.id, values: { sort_order: t.sort_order } });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch id="show-archived" checked={showArchived} onCheckedChange={setShowArchived} />
          <Label htmlFor="show-archived" className="text-xs text-muted-foreground">
            Pokaż zarchiwizowane
          </Label>
        </div>
        <Button size="sm" onClick={() => setForm({ ...EMPTY })} className="gap-1">
          <Plus className="h-4 w-4" /> Nowe zadanie
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Brak szablonów.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((t, i) => (
            <li
              key={t.id}
              className="rounded-xl border border-border/40 bg-foreground/[0.02] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium text-foreground", !t.active && "opacity-60")}>
                    {i + 1}. {t.title}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {[t.area, t.category, PRIORITIES.find((p) => p.value === t.priority)?.label,
                      t.estimated_minutes ? `${t.estimated_minutes} min` : null,
                      RECURRENCES.find((r) => r.value === t.recurrence)?.label,
                      t.active ? "aktywne" : "nieaktywne",
                      t.visible_to_all ? "wszyscy" : `przypisane: ${t.assigned_usernames.join(", ") || "—"}`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                  {t.description && (
                    <p className="mt-1 text-[11px] text-muted-foreground">{t.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!t.archived && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => move(t, -1)} title="W górę">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => move(t, 1)} title="W dół">
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Edytuj"
                    onClick={() =>
                      setForm({
                        id: t.id,
                        title: t.title,
                        description: t.description ?? "",
                        area: t.area ?? "",
                        category: t.category ?? "",
                        priority: t.priority,
                        estimated_minutes: t.estimated_minutes?.toString() ?? "",
                        recurrence: t.recurrence,
                        active: t.active,
                        visible_to_all: t.visible_to_all,
                        assigned: t.assigned_usernames.join(", "),
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title={t.archived ? "Przywróć" : "Archiwizuj"}
                    onClick={() =>
                      patch.mutate({
                        id: t.id,
                        values: { archived: !t.archived, active: t.archived ? true : false },
                      })
                    }
                  >
                    {t.archived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Usuń"
                    className="text-destructive"
                    onClick={() => {
                      if (window.confirm(`Usunąć szablon „${t.title}"? Historia wykonań zostanie zachowana.`))
                        remove.mutate(t.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edytuj zadanie" : "Nowe zadanie"}</DialogTitle>
          </DialogHeader>
          {form && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nazwa</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Opis</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Obszar</Label>
                  <Input
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    placeholder="np. Zaplecze"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kategoria</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="np. Czystość"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Priorytet</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Szacowany czas (min)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.estimated_minutes}
                    onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Powtarzalność</Label>
                  <Select
                    value={form.recurrence}
                    onValueChange={(v) => setForm({ ...form, recurrence: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    id="tpl-active"
                    checked={form.active}
                    onCheckedChange={(v) => setForm({ ...form, active: v })}
                  />
                  <Label htmlFor="tpl-active" className="text-xs">
                    Aktywne
                  </Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="tpl-all"
                  checked={form.visible_to_all}
                  onCheckedChange={(v) => setForm({ ...form, visible_to_all: v })}
                />
                <Label htmlFor="tpl-all" className="text-xs">
                  Widoczne dla całego zespołu
                </Label>
              </div>
              {!form.visible_to_all && (
                <div className="space-y-1.5">
                  <Label>Przypisani użytkownicy (nazwy, oddzielone przecinkiem)</Label>
                  <Input
                    value={form.assigned}
                    onChange={(e) => setForm({ ...form, assigned: e.target.value })}
                    placeholder="np. mateusz, anna"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Anuluj
            </Button>
            <Button
              onClick={() => {
                if (!form?.title.trim()) {
                  toast.error("Podaj nazwę zadania");
                  return;
                }
                save.mutate(form);
              }}
              disabled={save.isPending}
            >
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WeeksTab() {
  const [week, setWeek] = useState(weekStart());
  const isCurrent = week === weekStart();
  const { tasks, isLoading, reopen, skip } = useWeeklyTasks(week, isCurrent);
  const progress = progressOf(tasks);

  const [skipTarget, setSkipTarget] = useState<(typeof tasks)[number] | null>(null);
  const [reason, setReason] = useState<string>(SKIP_REASONS[0]);
  const [other, setOther] = useState("");

  const sorted = useMemo(() => [...tasks].sort((a, b) => a.sort_order - b.sort_order), [tasks]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button size="icon" variant="ghost" onClick={() => setWeek(addWeeks(week, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{formatWeekRange(week)}</p>
          <p className="text-[11px] text-muted-foreground">
            {isCurrent ? "Bieżący tydzień" : "Historia"} · {progress.done}/{progress.total} wykonane
            · {progress.skipped} pominięte
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          disabled={isCurrent}
          onClick={() => setWeek(addWeeks(week, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Brak zapisów dla tego tygodnia.
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((t) => (
            <li key={t.id} className="rounded-xl border border-border/40 bg-foreground/[0.02] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{t.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t.status === "done"
                      ? `Wykonane · ${t.completed_by ?? "—"} · ${
                          t.completed_at ? new Date(t.completed_at).toLocaleString("pl-PL") : ""
                        }`
                      : t.status === "skipped"
                        ? `Nie wykonano · ${t.skipped_reason ?? "—"} · ${t.skipped_by ?? "—"}`
                        : "Do zrobienia"}
                  </p>
                  {t.note && (
                    <p className="mt-1 text-[11px] italic text-muted-foreground">
                      Notatka: {t.note}
                    </p>
                  )}
                  {t.reopened_by && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Ponownie otwarte przez {t.reopened_by}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {t.status !== "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => reopen.mutate({ task: t })}
                    >
                      <RotateCcw className="h-4 w-4" /> Otwórz ponownie
                    </Button>
                  )}
                  {t.status !== "skipped" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => setSkipTarget(t)}
                    >
                      <SkipForward className="h-4 w-4" /> Pomiń
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!skipTarget} onOpenChange={(o) => !o && setSkipTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pominięcie — wymagany powód</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{skipTarget?.title}</p>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKIP_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {reason === "inny" && (
            <Input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Powód" />
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSkipTarget(null)}>
              Anuluj
            </Button>
            <Button
              onClick={async () => {
                const r = reason === "inny" ? other.trim() : reason;
                if (!r) {
                  toast.error("Podaj powód");
                  return;
                }
                if (!skipTarget) return;
                await skip.mutateAsync({ task: skipTarget, reason: r });
                setSkipTarget(null);
                setOther("");
                toast.success("Zapisano pominięcie");
              }}
            >
              <Check className="mr-2 h-4 w-4" /> Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WeeklyTasksManager() {
  const [tab, setTab] = useState<"templates" | "weeks">("templates");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            { key: "templates", label: "Szablony zadań" },
            { key: "weeks", label: "Tygodnie i historia" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              tab === t.key
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "templates" ? <TemplatesTab /> : <WeeksTab />}
    </div>
  );
}
