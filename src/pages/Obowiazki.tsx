import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  Clock,
  Loader2,
  MapPin,
  RotateCcw,
  SkipForward,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";
import { AmbientBackgroundForDepartment } from "@/components/AmbientBackground";
import ViewerBadge from "@/components/ViewerBadge";
import { useWeeklyTasks } from "@/hooks/useWeeklyTasks";
import {
  PRIORITIES,
  SKIP_REASONS,
  formatWeekRange,
  progressOf,
  weekStart,
  type TaskInstance,
} from "@/lib/weeklyTasks";

const priorityLabel = (p: string) => PRIORITIES.find((x) => x.value === p)?.label ?? p;

function StatusBadge({ task }: { task: TaskInstance }) {
  if (task.status === "done") {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
        Wykonane
      </span>
    );
  }
  if (task.status === "skipped") {
    return (
      <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">
        Nie wykonano
      </span>
    );
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      Do zrobienia
    </span>
  );
}

export default function Obowiazki() {
  const navigate = useNavigate();
  const { department, meta } = useDepartment();
  const { isViewer } = useAuth();
  const week = weekStart();
  const { tasks, isLoading, complete, skip, reopen } = useWeeklyTasks(week);

  const [doneTask, setDoneTask] = useState<TaskInstance | null>(null);
  const [doneNote, setDoneNote] = useState("");
  const [skipTask, setSkipTask] = useState<TaskInstance | null>(null);
  const [skipReason, setSkipReason] = useState<string>(SKIP_REASONS[0]);
  const [skipOther, setSkipOther] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "done" | "skipped">("all");

  const progress = progressOf(tasks);
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  const visible = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  );

  const submitDone = async () => {
    if (!doneTask) return;
    try {
      await complete.mutateAsync({ task: doneTask, note: doneNote });
      toast.success("Zadanie oznaczone jako wykonane");
      setDoneTask(null);
      setDoneNote("");
    } catch {
      /* handled globally */
    }
  };

  const submitSkip = async () => {
    if (!skipTask) return;
    const reason = skipReason === "inny" ? skipOther.trim() : skipReason;
    if (!reason) {
      toast.error("Podaj powód");
      return;
    }
    try {
      await skip.mutateAsync({ task: skipTask, reason });
      toast.success("Zadanie oznaczone jako niewykonane");
      setSkipTask(null);
      setSkipOther("");
      setSkipReason(SKIP_REASONS[0]);
    } catch {
      /* handled globally */
    }
  };

  const filters: Array<{ key: typeof filter; label: string; count: number }> = [
    { key: "all", label: "Wszystkie", count: progress.total },
    { key: "pending", label: "Pozostałe", count: progress.remaining },
    { key: "done", label: "Wykonane", count: progress.done },
    { key: "skipped", label: "Niewykonane", count: progress.skipped },
  ];

  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackgroundForDepartment intensity={0.4} blur={3} />

      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/40 bg-background/40 px-5 py-4 backdrop-blur-xl backdrop-saturate-150 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(deptHomePath(department))}
            className="text-muted-foreground hover:text-foreground"
            title="Powrót"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-xl font-bold tracking-wide text-brand sm:text-2xl">
              OBOWIĄZKI
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {meta.label} · tydzień {formatWeekRange(week)}
            </p>
          </div>
          <ViewerBadge />
        </div>
        <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
          {progress.done}/{progress.total} wykonane
        </span>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-6 sm:px-8">
        <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-5">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold text-foreground">{pct}%</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-semibold text-emerald-400">
              Wykonane: {progress.done}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
              Pozostałe: {progress.remaining}
            </span>
            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 font-semibold text-warning">
              Pominięte: {progress.skipped}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                filter === f.key
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Brak zadań w tym widoku.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {visible.map((task) => (
              <li
                key={task.id}
                className={cn(
                  "rounded-2xl border p-4 transition-colors",
                  task.status === "done"
                    ? "border-emerald-500/30 bg-emerald-500/[0.05]"
                    : task.status === "skipped"
                      ? "border-warning/30 bg-warning/[0.05]"
                      : "border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.05]",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "font-medium text-foreground",
                        task.status === "done" && "line-through opacity-70",
                      )}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <StatusBadge task={task} />
                      {task.area && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {task.area}
                        </span>
                      )}
                      {task.category && <span>· {task.category}</span>}
                      {task.priority !== "normal" && <span>· {priorityLabel(task.priority)}</span>}
                      {task.estimated_minutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {task.estimated_minutes} min
                        </span>
                      ) : null}
                    </div>
                    {task.status === "done" && task.completed_by && (
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" />
                        {task.completed_by} ·{" "}
                        {task.completed_at
                          ? new Date(task.completed_at).toLocaleString("pl-PL")
                          : ""}
                      </p>
                    )}
                    {task.status === "skipped" && (
                      <p className="mt-2 text-[11px] text-warning">
                        Powód: {task.skipped_reason}
                        {task.skipped_by ? ` · ${task.skipped_by}` : ""}
                      </p>
                    )}
                    {task.note && (
                      <p className="mt-1 text-[11px] italic text-muted-foreground">
                        Notatka: {task.note}
                      </p>
                    )}
                  </div>

                  {!isViewer && (
                    <div className="flex shrink-0 gap-2">
                      {task.status === "pending" ? (
                        <>
                          <Button size="sm" onClick={() => setDoneTask(task)} className="gap-1">
                            <Check className="h-4 w-4" /> Wykonane
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSkipTask(task)}
                            className="gap-1"
                          >
                            <SkipForward className="h-4 w-4" /> Nie wykonano
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => reopen.mutate({ task })}
                          className="gap-1 text-muted-foreground"
                        >
                          <RotateCcw className="h-4 w-4" /> Cofnij
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Dialog open={!!doneTask} onOpenChange={(o) => !o && setDoneTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Oznacz jako wykonane</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{doneTask?.title}</p>
          <div className="space-y-2">
            <Label htmlFor="done-note">Notatka (opcjonalnie)</Label>
            <Textarea
              id="done-note"
              value={doneNote}
              onChange={(e) => setDoneNote(e.target.value)}
              placeholder="np. wymieniono uszczelkę"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDoneTask(null)}>
              Anuluj
            </Button>
            <Button onClick={submitDone} disabled={complete.isPending}>
              {complete.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zatwierdź
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!skipTask} onOpenChange={(o) => !o && setSkipTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nie wykonano — podaj powód</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{skipTask?.title}</p>
          <div className="space-y-2">
            <Label>Powód</Label>
            <Select value={skipReason} onValueChange={setSkipReason}>
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
            {skipReason === "inny" && (
              <Input
                value={skipOther}
                onChange={(e) => setSkipOther(e.target.value)}
                placeholder="Wpisz powód"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSkipTask(null)}>
              Anuluj
            </Button>
            <Button onClick={submitSkip} disabled={skip.isPending}>
              {skip.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
