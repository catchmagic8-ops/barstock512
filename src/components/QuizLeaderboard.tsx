import { useCallback, useEffect, useState } from "react";
import { Crown, Medal, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export type QuizMode = "timed" | "untimed" | "learn";

const MODES: { m: QuizMode; label: string }[] = [
  { m: "untimed", label: "Bez limitu" },
  { m: "timed", label: "Na czas" },
  { m: "learn", label: "Tryb nauki" },
];

interface Row {
  username: string;
  score: number;
  total: number;
  duration: number | null;
  streak: number;
  plays: number;
}

function medal(i: number) {
  if (i === 0) return "text-amber-400";
  if (i === 1) return "text-zinc-300";
  if (i === 2) return "text-amber-700";
  return "text-muted-foreground";
}

export default function QuizLeaderboard({ currentUsername }: { currentUsername?: string }) {
  const [mode, setMode] = useState<QuizMode>("untimed");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("quiz_results")
      .select("username, score, total, duration_seconds, best_streak, mode")
      .eq("mode", mode)
      .order("score", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }

    const best = new Map<string, Row>();
    for (const r of data ?? []) {
      const pct = r.total > 0 ? r.score / r.total : 0;
      const existing = best.get(r.username);
      const candidate: Row = {
        username: r.username,
        score: r.score,
        total: r.total,
        duration: r.duration_seconds ?? null,
        streak: r.best_streak ?? 0,
        plays: (existing?.plays ?? 0) + 1,
      };
      if (!existing) {
        best.set(r.username, candidate);
        continue;
      }
      const existingPct = existing.total > 0 ? existing.score / existing.total : 0;
      const better =
        pct > existingPct ||
        (pct === existingPct &&
          (existing.duration === null
            ? false
            : (r.duration_seconds ?? Number.MAX_SAFE_INTEGER) < existing.duration));
      best.set(r.username, better ? candidate : { ...existing, plays: candidate.plays });
    }

    const sorted = [...best.values()].sort((a, b) => {
      const pa = a.total > 0 ? a.score / a.total : 0;
      const pb = b.total > 0 ? b.score / b.total : 0;
      if (pb !== pa) return pb - pa;
      if (b.score !== a.score) return b.score - a.score;
      return (a.duration ?? 99999) - (b.duration ?? 99999);
    });

    setRows(sorted);
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  const myIndex = rows.findIndex((r) => r.username === currentUsername);

  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-brand" />
          <h3 className="font-heading text-sm font-bold tracking-wider text-foreground">RANKING</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={load} className="h-7 gap-1.5 px-2 text-xs text-muted-foreground">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Odśwież
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {MODES.map(({ m, label }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-xl border px-2 py-2 text-xs font-medium transition-all ${
              mode === m
                ? "border-brand/60 bg-brand/15 text-brand"
                : "border-border/40 bg-foreground/[0.02] text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-1.5">
        {loading && <p className="py-4 text-center text-xs text-muted-foreground">Wczytywanie…</p>}
        {!loading && rows.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Brak wyników w tym trybie — bądź pierwszy!
          </p>
        )}
        {!loading &&
          rows.slice(0, 10).map((r, i) => {
            const isMe = r.username === currentUsername;
            return (
              <div
                key={r.username}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                  isMe ? "border-brand/50 bg-brand/10" : "border-border/30 bg-foreground/[0.02]"
                }`}
              >
                <div className="flex w-6 shrink-0 items-center justify-center">
                  {i < 3 ? (
                    i === 0 ? (
                      <Crown className={`h-4 w-4 ${medal(i)}`} />
                    ) : (
                      <Medal className={`h-4 w-4 ${medal(i)}`} />
                    )
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">{i + 1}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.username}
                    {isMe && <span className="ml-1.5 text-[10px] uppercase text-brand">Ty</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.plays} {r.plays === 1 ? "podejście" : "podejścia"}
                    {mode === "timed" && r.duration !== null ? ` · ${r.duration}s` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading text-sm font-bold text-foreground">
                    {r.score}/{r.total}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.total > 0 ? Math.round((r.score / r.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            );
          })}

        {!loading && myIndex >= 10 && (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-brand/50 bg-brand/10 px-3 py-2">
            <span className="w-6 text-center text-xs font-medium text-brand">{myIndex + 1}</span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {rows[myIndex].username} <span className="ml-1 text-[10px] uppercase text-brand">Ty</span>
            </p>
            <p className="font-heading text-sm font-bold text-foreground">
              {rows[myIndex].score}/{rows[myIndex].total}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
