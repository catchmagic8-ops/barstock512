import { supabase } from "@/integrations/supabase/client";

export const DUTIES_DEPARTMENT = "bar512";
/** Department timezone — weeks reset Monday 00:00 local time. */
export const DUTIES_TIMEZONE = "Europe/Warsaw";

export type TaskStatus = "pending" | "done" | "skipped";

export const SKIP_REASONS = [
  "brak czasu",
  "brak środków",
  "wymaga managera",
  "nie dotyczy",
  "inny",
] as const;

export const PRIORITIES = [
  { value: "low", label: "Niski" },
  { value: "normal", label: "Normalny" },
  { value: "high", label: "Wysoki" },
] as const;

export const RECURRENCES = [
  { value: "weekly", label: "Co tydzień" },
  { value: "biweekly", label: "Co dwa tygodnie" },
  { value: "monthly", label: "Co miesiąc" },
] as const;

export interface TaskTemplate {
  id: string;
  department_id: string;
  title: string;
  description: string | null;
  area: string | null;
  category: string | null;
  priority: string;
  estimated_minutes: number | null;
  recurrence: string;
  active: boolean;
  archived: boolean;
  sort_order: number;
  visible_to_all: boolean;
  assigned_usernames: string[];
  created_at: string;
}

export interface TaskInstance {
  id: string;
  template_id: string | null;
  title: string;
  description: string | null;
  area: string | null;
  category: string | null;
  priority: string;
  estimated_minutes: number | null;
  sort_order: number;
  week_start: string;
  due_date: string | null;
  status: TaskStatus;
  note: string | null;
  completed_by: string | null;
  completed_at: string | null;
  skipped_by: string | null;
  skipped_at: string | null;
  skipped_reason: string | null;
  reopened_by: string | null;
  reopened_at: string | null;
  admin_notes: string | null;
}

/** Current date in the department timezone as YYYY-MM-DD parts. */
function zonedParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: DUTIES_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    weekday: get("weekday"),
  };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Monday (00:00 department time) of the week containing `date`, as YYYY-MM-DD. */
export function weekStart(date = new Date()): string {
  const { y, m, d, weekday } = zonedParts(date);
  const dow = Math.max(0, WEEKDAYS.indexOf(weekday));
  const offset = dow === 0 ? 6 : dow - 1; // Monday-based
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() - offset);
  return iso(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
}

export function addWeeks(weekStartIso: string, weeks: number): string {
  const [y, m, d] = weekStartIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + weeks * 7);
  return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/** Sunday of the given week (due date). */
export function weekEnd(weekStartIso: string): string {
  const [y, m, d] = weekStartIso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 6);
  return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function formatWeekRange(weekStartIso: string): string {
  const fmt = (s: string) =>
    new Date(`${s}T00:00:00Z`).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  return `${fmt(weekStartIso)} – ${fmt(weekEnd(weekStartIso))}`;
}

/** Should a weekly/biweekly/monthly template run in this week? */
function templateDueThisWeek(t: TaskTemplate, week: string): boolean {
  if (t.recurrence === "weekly") return true;
  const start = new Date(`${weekStart(new Date(`${t.created_at}`))}T00:00:00Z`).getTime();
  const cur = new Date(`${week}T00:00:00Z`).getTime();
  const weeksApart = Math.round((cur - start) / (7 * 86400000));
  if (weeksApart < 0) return false;
  if (t.recurrence === "biweekly") return weeksApart % 2 === 0;
  if (t.recurrence === "monthly") return weeksApart % 4 === 0;
  return true;
}

/**
 * Make sure the given week has an instance for every active template.
 * Existing rows are never touched, so history is preserved.
 */
export async function ensureWeekInstances(week: string): Promise<void> {
  const { data: templates, error: tErr } = await (supabase as any)
    .from("weekly_task_templates")
    .select("*")
    .eq("department_id", DUTIES_DEPARTMENT)
    .eq("active", true)
    .eq("archived", false);
  if (tErr) throw tErr;

  const { data: existing, error: iErr } = await (supabase as any)
    .from("weekly_task_instances")
    .select("template_id")
    .eq("department_id", DUTIES_DEPARTMENT)
    .eq("week_start", week);
  if (iErr) throw iErr;

  const have = new Set((existing ?? []).map((r: any) => r.template_id));
  const missing = ((templates ?? []) as TaskTemplate[])
    .filter((t) => !have.has(t.id) && templateDueThisWeek(t, week))
    .map((t) => ({
      department_id: DUTIES_DEPARTMENT,
      template_id: t.id,
      title: t.title,
      description: t.description,
      area: t.area,
      category: t.category,
      priority: t.priority,
      estimated_minutes: t.estimated_minutes,
      sort_order: t.sort_order,
      week_start: week,
      due_date: weekEnd(week),
      status: "pending",
    }));

  if (!missing.length) return;
  const { error } = await (supabase as any)
    .from("weekly_task_instances")
    .upsert(missing, { onConflict: "template_id,week_start", ignoreDuplicates: true });
  if (error) throw error;
}

export async function logActivity(entry: {
  instance_id: string;
  template_id?: string | null;
  week_start?: string | null;
  action: string;
  username?: string | null;
  note?: string | null;
  reason?: string | null;
}) {
  await (supabase as any).from("weekly_task_activity_log").insert({
    department_id: DUTIES_DEPARTMENT,
    ...entry,
  });
}

export function progressOf(instances: TaskInstance[]) {
  const total = instances.length;
  const done = instances.filter((i) => i.status === "done").length;
  const skipped = instances.filter((i) => i.status === "skipped").length;
  return { total, done, skipped, remaining: total - done - skipped };
}
