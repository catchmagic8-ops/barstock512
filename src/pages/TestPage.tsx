import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  GraduationCap,
  Trophy,
  Check,
  X,
  RotateCcw,
  Play,
  Flame,
  Timer,
  Infinity as InfinityIcon,
  BookOpen,
  Info,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { deptHomePath } from "@/lib/department";
import { AmbientBackgroundForDepartment } from "@/components/AmbientBackground";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_pln: number;
  allergens: string[];
  dietary: string[];
};

type Question = {
  prompt: string;
  hint?: string;
  options: string[];
  answer: string;
  explanation: string;
  item: MenuItem;
};

type Mode = "untimed" | "timed" | "learn";

const QUESTIONS_PER_ROUND = 10;
const TIME_PER_QUESTION = 20; // sekundy

const MODE_LABEL: Record<Mode, string> = {
  untimed: "Bez limitu czasu",
  timed: "Na czas",
  learn: "Tryb nauki",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(pool: string[], correct: string, count: number) {
  const unique = Array.from(new Set(pool.filter((p) => p && p !== correct)));
  return shuffle(unique).slice(0, count);
}

const zl = (n: number) => `${Number(n).toFixed(2).replace(/\.00$/, "")} zł`;
const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function isBeverage(category: string) {
  return /napoje|drinki|kawa|herbata|wino|piwo|napój/i.test(category);
}

function isFood(category: string) {
  return /przystaw|zup|sałat|dan|deser|śniadanie|burger|makar|pizza|ryb|mięs|wege|vege|vegan|street|bowl|talerz|stek|grill|kuchnia/i.test(category);
}

function buildQuestions(items: MenuItem[], count: number): Question[] {
  const usable = items.filter((i) => i.name && i.category);
  const categories = Array.from(new Set(usable.map((i) => i.category)));
  const names = usable.map((i) => i.name);
  const prices = Array.from(new Set(usable.map((i) => zl(i.price_pln))));
  const allAllergens = Array.from(new Set(usable.flatMap((i) => i.allergens || [])));

  const questions: Question[] = [];

  for (const item of shuffle(usable)) {
    const kinds: Array<() => Omit<Question, "item"> | null> = [
      () => {
        if (categories.length < 4) return null;
        const opts = shuffle([item.category, ...pickDistractors(categories, item.category, 3)]);
        return {
          prompt: `Do której kategorii należy „${item.name}"?`,
          options: opts,
          answer: item.category,
          explanation: `„${item.name}" znajdziesz w kategorii ${item.category}.`,
        };
      },
      () => {
        if (!item.price_pln || prices.length < 4) return null;
        const correct = zl(item.price_pln);
        const opts = shuffle([correct, ...pickDistractors(prices, correct, 3)]);
        return {
          prompt: `Ile kosztuje „${item.name}"?`,
          hint: item.category,
          options: opts,
          answer: correct,
          explanation: `Cena „${item.name}" to ${correct}.`,
        };
      },
      () => {
        if (!item.description || item.description.length < 20 || names.length < 4) return null;
        const opts = shuffle([item.name, ...pickDistractors(names, item.name, 3)]);
        return {
          prompt: `Który to danie? „${item.description}"`,
          hint: item.category,
          options: opts,
          answer: item.name,
          explanation: `To opis pozycji „${item.name}" (${item.category}).`,
        };
      },
      () => {
        const a = (item.allergens || []).filter(Boolean);
        if (a.length === 0 || allAllergens.length < 4) return null;
        const correct = a[Math.floor(Math.random() * a.length)];
        const distract = pickDistractors(
          allAllergens.filter((x) => !a.includes(x)),
          correct,
          3,
        );
        if (distract.length < 3) return null;
        return {
          prompt: `Który alergen występuje w „${item.name}"?`,
          hint: item.category,
          options: shuffle([correct, ...distract]),
          answer: correct,
          explanation: `„${item.name}" zawiera: ${a.join(", ")}.`,
        };
      },
      () => {
        if (isBeverage(item.category)) return null;
        const d = (item.dietary || []).filter(Boolean);
        const isVegan = d.some((x) => /wega|vegan/i.test(x));
        const isVege = d.some((x) => /wegetar|vegetar/i.test(x));
        const correct = isVegan ? "Wegańskie" : isVege ? "Wegetariańskie" : "Bez oznaczenia roślinnego";
        return {
          prompt: `Jakie oznaczenie dietetyczne ma „${item.name}"?`,
          hint: item.category,
          options: ["Wegańskie", "Wegetariańskie", "Bez oznaczenia roślinnego", "Bezglutenowe"],
          answer: correct,
          explanation: d.length
            ? `Oznaczenia „${item.name}": ${d.join(", ")}.`
            : `„${item.name}" nie ma oznaczeń roślinnych w menu.`,
        };
      },
    ];

    const q = shuffle(kinds)
      .map((f) => f())
      .find((x): x is Omit<Question, "item"> => !!x && new Set(x.options).size === x.options.length);
    if (q) questions.push({ ...q, item });
    if (questions.length >= count) break;
  }

  return questions;
}

function ItemDetails({ item }: { item: MenuItem }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/40 bg-background/40 p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-base font-semibold text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.category}</p>
        </div>
        <span className="whitespace-nowrap font-semibold text-brand">{zl(item.price_pln)}</span>
      </div>
      {item.description && <p className="text-muted-foreground">{item.description}</p>}
      <div className="flex flex-wrap gap-1.5">
        {(item.dietary || []).map((d) => (
          <Badge key={d} variant="outline" className="border-emerald-500/40 text-[11px] text-emerald-500">
            {d}
          </Badge>
        ))}
        {(item.allergens || []).map((a) => (
          <Badge key={a} variant="outline" className="border-amber-500/40 text-[11px] text-amber-500">
            {a}
          </Badge>
        ))}
        {!(item.dietary || []).length && !(item.allergens || []).length && (
          <span className="text-xs text-muted-foreground">Brak oznaczeń w karcie.</span>
        )}
      </div>
    </div>
  );
}

export default function TestPage() {
  const navigate = useNavigate();
  const { department, meta } = useDepartment();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const username = user?.username || "gość";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["menu-quiz-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("a_la_carte_bar512")
        .select("id,name,category,description,price_pln,allergens,dietary");
      if (error) throw error;
      return (data || []) as MenuItem[];
    },
  });

  const { data: results = [] } = useQuery({
    queryKey: ["quiz-results", username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("username", username)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const scored = results.filter((r) => r.mode !== "learn");
  const best = scored.reduce(
    (acc, r) => (r.score > (acc?.score ?? -1) ? r : acc),
    null as (typeof scored)[number] | null,
  );
  const bestTimed = scored
    .filter((r) => r.mode === "timed" && r.duration_seconds != null)
    .sort((a, b) => (a.duration_seconds! - b.duration_seconds!))[0];

  const [mode, setMode] = useState<Mode>("untimed");
  const [round, setRound] = useState(0);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [questionLeft, setQuestionLeft] = useState(TIME_PER_QUESTION);
  const [showDetails, setShowDetails] = useState(false);
  const savedRound = useRef(0);

  const questions = useMemo(
    () => (items.length ? buildQuestions(items, QUESTIONS_PER_ROUND) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, round],
  );

  const current = questions[index];
  const finished = started && questions.length > 0 && index >= questions.length;

  // Licznik czasu (tylko tryb na czas)
  useEffect(() => {
    if (!started || finished || mode !== "timed") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [started, finished, mode]);

  // Limit czasu na pytanie (tryb na czas)
  useEffect(() => {
    if (!started || finished || mode !== "timed" || picked) return;
    setQuestionLeft(TIME_PER_QUESTION);
    const t = setInterval(() => {
      setQuestionLeft((left) => {
        if (left <= 1) {
          clearInterval(t);
          setPicked("__timeout__");
          setStreak(0);
          return 0;
        }
        return left - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, finished, mode, index, picked]);

  const saveResult = useCallback(async () => {
    await supabase.from("quiz_results").insert({
      username,
      department,
      mode,
      score,
      total: questions.length,
      duration_seconds: mode === "timed" ? elapsed : null,
      best_streak: bestStreak,
    });
    queryClient.invalidateQueries({ queryKey: ["quiz-results", username] });
    queryClient.invalidateQueries({ queryKey: ["quiz-best"] });
  }, [username, department, mode, score, questions.length, elapsed, bestStreak, queryClient]);

  useEffect(() => {
    if (!finished || mode === "learn") return;
    if (savedRound.current === round) return;
    savedRound.current = round;
    void saveResult();
  }, [finished, mode, round, saveResult]);

  const start = (m: Mode) => {
    setMode(m);
    setRound((r) => r + 1);
    setStarted(true);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setElapsed(0);
    setShowDetails(false);
    setQuestionLeft(TIME_PER_QUESTION);
  };

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === current.answer) {
      if (mode !== "learn") setScore((s) => s + 1);
      setStreak((s) => {
        const n = s + 1;
        setBestStreak((b) => Math.max(b, n));
        return n;
      });
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    setPicked(null);
    setShowDetails(false);
    setIndex((i) => i + 1);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackgroundForDepartment intensity={0.4} blur={3} />

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/40 bg-background/50 px-5 py-4 backdrop-blur-xl backdrop-saturate-150 sm:px-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (started ? setStarted(false) : navigate(deptHomePath(department)))}
          title="Powrót"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-lg font-bold tracking-wide text-brand sm:text-xl">MENU QUIZ</h1>
          <p className="text-xs text-muted-foreground">
            {meta.label} · {started ? MODE_LABEL[mode] : "szkolenie z karty menu"}
          </p>
        </div>
        {started && mode === "timed" && (
          <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-foreground/[0.04] px-3 py-1.5 text-xs">
            <Timer className="h-3.5 w-3.5 text-brand" />
            <span className="font-semibold text-foreground">{fmtTime(elapsed)}</span>
          </div>
        )}
        {!started && (
          <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-foreground/[0.04] px-3 py-1.5 text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-brand" />
            <span className="font-semibold text-foreground">{best ? `${best.score}/${best.total}` : "—"}</span>
          </div>
        )}
      </header>

      <main className="flex flex-1 justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-xl">
          {!started && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-7 text-center">
                <GraduationCap className="mx-auto h-10 w-10 text-brand" />
                <h2 className="mt-4 font-heading text-xl font-bold tracking-wider text-foreground">
                  POZNAJ NASZE MENU
                </h2>
                <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                  {QUESTIONS_PER_ROUND} losowych pytań o kategorie, ceny, opisy, alergeny i oznaczenia
                  dietetyczne z karty Bar 512. Wybierz tempo nauki.
                </p>
              </div>

              <div className="grid gap-3">
                {(
                  [
                    {
                      m: "untimed" as Mode,
                      icon: InfinityIcon,
                      title: "Bez limitu czasu",
                      desc: "Spokojne tempo — odpowiadasz bez zegara, wynik jest zapisywany.",
                    },
                    {
                      m: "timed" as Mode,
                      icon: Timer,
                      title: "Na czas",
                      desc: `${TIME_PER_QUESTION} s na pytanie, mierzymy łączny czas rundy.`,
                    },
                    {
                      m: "learn" as Mode,
                      icon: BookOpen,
                      title: "Tryb nauki",
                      desc: "Bez punktacji — przy każdym pytaniu przełączasz się na szczegóły dania z karty.",
                    },
                  ]
                ).map(({ m, icon: Icon, title, desc }) => (
                  <button
                    key={m}
                    onClick={() => start(m)}
                    disabled={isLoading || items.length === 0}
                    className="group flex items-center gap-4 rounded-xl border border-border/40 bg-foreground/[0.03] p-4 text-left transition-all hover:border-brand/60 hover:bg-brand/5 disabled:opacity-50"
                  >
                    <span className="rounded-lg bg-brand/10 p-2.5 text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-heading text-sm font-semibold text-foreground">{title}</span>
                      <span className="block text-xs text-muted-foreground">{desc}</span>
                    </span>
                    {isLoading ? (
                      <span className="text-xs text-muted-foreground">…</span>
                    ) : (
                      <Play className="h-4 w-4 text-muted-foreground group-hover:text-brand" />
                    )}
                  </button>
                ))}
              </div>

              {!isLoading && items.length === 0 && (
                <p className="text-center text-xs text-destructive">Brak pozycji menu w bazie.</p>
              )}

              <div className="rounded-2xl border border-border/40 bg-foreground/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-semibold tracking-wide text-foreground">
                    TWOJE WYNIKI
                  </h3>
                  <span className="text-xs text-muted-foreground">{username}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                    <p className="text-[11px] uppercase text-muted-foreground">Rekord</p>
                    <p className="font-heading text-lg font-bold text-brand">
                      {best ? `${best.score}/${best.total}` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/40 bg-background/40 p-3">
                    <p className="text-[11px] uppercase text-muted-foreground">Najlepszy czas</p>
                    <p className="font-heading text-lg font-bold text-foreground">
                      {bestTimed ? fmtTime(bestTimed.duration_seconds!) : "—"}
                    </p>
                  </div>
                </div>
                {scored.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {scored.slice(0, 5).map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/30 px-3 py-2 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("pl-PL", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {MODE_LABEL[(r.mode as Mode) ?? "untimed"]}
                        </span>
                        <span className="flex items-center gap-2">
                          {r.duration_seconds != null && (
                            <span className="text-muted-foreground">{fmtTime(r.duration_seconds)}</span>
                          )}
                          <span className="font-semibold text-foreground">
                            {r.score}/{r.total}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Brak zapisanych wyników — zagraj pierwszą rundę.
                  </p>
                )}
              </div>
            </div>
          )}

          {started && !finished && current && (
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Pytanie {index + 1} / {questions.length}
                  </span>
                  <span className="flex items-center gap-3">
                    {streak >= 2 && (
                      <span className="flex items-center gap-1 text-brand">
                        <Flame className="h-3.5 w-3.5" /> {streak}
                      </span>
                    )}
                    {mode === "timed" && !picked && (
                      <span className={cn(questionLeft <= 5 ? "text-destructive" : "")}>{questionLeft}s</span>
                    )}
                    {mode === "learn" ? (
                      <span>Tryb nauki</span>
                    ) : (
                      <span>
                        Punkty: <span className="font-semibold text-foreground">{score}</span>
                      </span>
                    )}
                  </span>
                </div>
                <Progress value={(index / questions.length) * 100} className="h-1.5" />
              </div>

              <div className="rounded-2xl border border-border/40 bg-foreground/[0.03] p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  {current.hint ? (
                    <Badge variant="outline" className="border-border/50 text-[11px] text-muted-foreground">
                      {current.hint}
                    </Badge>
                  ) : (
                    <span />
                  )}
                  {mode === "learn" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetails((s) => !s)}
                      className="h-7 gap-1.5 text-xs"
                    >
                      <Info className="h-3.5 w-3.5" />
                      {showDetails ? "Pokaż pytanie" : "Szczegóły dania"}
                    </Button>
                  )}
                </div>

                {mode === "learn" && showDetails ? (
                  <div className="space-y-4">
                    <ItemDetails item={current.item} />
                    <Button onClick={next} variant="outline" className="w-full gap-2">
                      Dalej <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="font-heading text-base font-semibold leading-relaxed text-foreground sm:text-lg">
                      {current.prompt}
                    </p>

                    <div className="mt-5 grid gap-2.5">
                      {current.options.map((opt) => {
                        const isAnswer = opt === current.answer;
                        const isPicked = opt === picked;
                        return (
                          <button
                            key={opt}
                            onClick={() => choose(opt)}
                            disabled={!!picked}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all",
                              !picked && "border-border/40 bg-background/40 hover:border-brand/60 hover:bg-brand/5",
                              picked && isAnswer && "border-emerald-500/60 bg-emerald-500/10 text-foreground",
                              picked && isPicked && !isAnswer && "border-destructive/60 bg-destructive/10",
                              picked && !isAnswer && !isPicked && "border-border/30 opacity-50",
                            )}
                          >
                            <span>{opt}</span>
                            {picked && isAnswer && <Check className="h-4 w-4 shrink-0 text-emerald-500" />}
                            {picked && isPicked && !isAnswer && <X className="h-4 w-4 shrink-0 text-destructive" />}
                          </button>
                        );
                      })}
                    </div>

                    {picked && (
                      <div className="mt-5 space-y-4 border-t border-border/40 pt-4">
                        {picked === "__timeout__" && (
                          <p className="text-sm font-medium text-destructive">Czas minął!</p>
                        )}
                        <p className="text-sm text-muted-foreground">{current.explanation}</p>
                        {mode === "learn" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(true)}
                            className="gap-1.5 text-xs text-brand"
                          >
                            <Info className="h-3.5 w-3.5" /> Zobacz pełne szczegóły dania
                          </Button>
                        )}
                        <Button onClick={next} className="w-full bg-brand text-white hover:bg-brand/90">
                          {index + 1 >= questions.length ? "Zobacz podsumowanie" : "Następne pytanie"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {finished && (
            <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-8 text-center">
              <Trophy className="mx-auto h-10 w-10 text-brand" />
              <h2 className="mt-4 font-heading text-xl font-bold tracking-wider text-foreground">
                {mode === "learn"
                  ? "KONIEC SESJI NAUKI"
                  : score === questions.length
                    ? "PERFEKCYJNIE!"
                    : score >= questions.length * 0.7
                      ? "DOBRA ROBOTA!"
                      : "JESZCZE TROCHĘ NAUKI"}
              </h2>
              {mode !== "learn" && (
                <p className="mt-3 text-3xl font-bold text-brand">
                  {score}/{questions.length}
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {MODE_LABEL[mode]}
                {mode === "timed" && ` · czas: ${fmtTime(elapsed)}`}
                {mode !== "learn" && ` · najdłuższa seria: ${bestStreak}`}
              </p>
              {mode !== "learn" && (
                <p className="mt-1 text-xs text-muted-foreground">Wynik zapisany dla: {username}</p>
              )}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={() => start(mode)} className="gap-2 bg-brand text-white hover:bg-brand/90">
                  <RotateCcw className="h-4 w-4" /> Zagraj ponownie
                </Button>
                <Button variant="outline" onClick={() => setStarted(false)}>
                  Zmień tryb
                </Button>
                <Button variant="ghost" onClick={() => navigate("/a-la-carte")}>
                  Karta menu
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
