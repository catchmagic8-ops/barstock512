import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DUTIES_DEPARTMENT,
  ensureWeekInstances,
  logActivity,
  weekStart,
  type TaskInstance,
} from "@/lib/weeklyTasks";
import { useAuth } from "@/contexts/AuthContext";

async function fetchInstances(week: string): Promise<TaskInstance[]> {
  const { data, error } = await (supabase as any)
    .from("weekly_task_instances")
    .select("*")
    .eq("department_id", DUTIES_DEPARTMENT)
    .eq("week_start", week)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TaskInstance[];
}

/** Current-week duties for the tile / staff page. `ensure` creates missing rows. */
export function useWeeklyTasks(week: string = weekStart(), ensure = true) {
  const qc = useQueryClient();
  const { user, isViewer } = useAuth();

  const query = useQuery({
    queryKey: ["weekly-tasks", week],
    queryFn: () => fetchInstances(week),
  });

  useEffect(() => {
    if (!ensure || isViewer) return;
    let cancelled = false;
    ensureWeekInstances(week)
      .then(() => {
        if (!cancelled) qc.invalidateQueries({ queryKey: ["weekly-tasks", week] });
      })
      .catch(() => {
        /* non-blocking */
      });
    return () => {
      cancelled = true;
    };
  }, [week, ensure, isViewer, qc]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["weekly-tasks"] });
    qc.invalidateQueries({ queryKey: ["weekly-tasks-progress"] });
  };

  const complete = useMutation({
    mutationFn: async ({ task, note }: { task: TaskInstance; note?: string | null }) => {
      const { error } = await (supabase as any)
        .from("weekly_task_instances")
        .update({
          status: "done",
          note: note?.trim() ? note.trim() : null,
          completed_by: user?.username ?? null,
          completed_at: new Date().toISOString(),
          skipped_by: null,
          skipped_at: null,
          skipped_reason: null,
        })
        .eq("id", task.id);
      if (error) throw error;
      await logActivity({
        instance_id: task.id,
        template_id: task.template_id,
        week_start: task.week_start,
        action: "completed",
        username: user?.username ?? null,
        note: note?.trim() || null,
      });
    },
    onSuccess: invalidate,
  });

  const skip = useMutation({
    mutationFn: async ({
      task,
      reason,
      note,
    }: {
      task: TaskInstance;
      reason: string;
      note?: string | null;
    }) => {
      const { error } = await (supabase as any)
        .from("weekly_task_instances")
        .update({
          status: "skipped",
          skipped_reason: reason,
          note: note?.trim() ? note.trim() : null,
          skipped_by: user?.username ?? null,
          skipped_at: new Date().toISOString(),
          completed_by: null,
          completed_at: null,
        })
        .eq("id", task.id);
      if (error) throw error;
      await logActivity({
        instance_id: task.id,
        template_id: task.template_id,
        week_start: task.week_start,
        action: "skipped",
        username: user?.username ?? null,
        reason,
        note: note?.trim() || null,
      });
    },
    onSuccess: invalidate,
  });

  const reopen = useMutation({
    mutationFn: async ({ task }: { task: TaskInstance }) => {
      const { error } = await (supabase as any)
        .from("weekly_task_instances")
        .update({
          status: "pending",
          completed_by: null,
          completed_at: null,
          skipped_by: null,
          skipped_at: null,
          skipped_reason: null,
          reopened_by: user?.username ?? null,
          reopened_at: new Date().toISOString(),
        })
        .eq("id", task.id);
      if (error) throw error;
      await logActivity({
        instance_id: task.id,
        template_id: task.template_id,
        week_start: task.week_start,
        action: "reopened",
        username: user?.username ?? null,
      });
    },
    onSuccess: invalidate,
  });

  return { ...query, tasks: query.data ?? [], complete, skip, reopen };
}

/** Lightweight progress for the home tile (no writes). */
export function useWeeklyTasksProgress() {
  const week = weekStart();
  return useQuery({
    queryKey: ["weekly-tasks-progress", week],
    queryFn: async () => {
      const rows = await fetchInstances(week);
      return {
        total: rows.length,
        done: rows.filter((r) => r.status === "done").length,
        skipped: rows.filter((r) => r.status === "skipped").length,
      };
    },
  });
}
