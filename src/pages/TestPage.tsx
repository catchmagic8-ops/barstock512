import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, Trophy, Check, X, RotateCcw, Play, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useDepartment } from "@/contexts/DepartmentContext";
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
};

const QUESTIONS_PER_ROUND = 10;
const HIGHSCORE_KEY = "menu-quiz-highscore-bar512";

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

function buildQuestions(items: MenuItem[]): Question[] {
  const usable = items.filter((i) => i.name && i.category);
  const categories = Array.from(new Set(usable.map((i) => i.category)));
  const names = usable.map((i) => i.name);
  const prices = Array.from(new Set(usable.map((i) => zl(i.price_pln))));
  const allAllergens = Array.from(new Set(usable.flatMap((i) => i.allergens || [])));

  const questions: Question[] = [];

  for (const item of shuffle(usable)) {
    const kinds: Array<() => Question | null> = [
      // Kategoria
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
      // Cena
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
      // Opis -> nazwa
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
      // Alergen
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
      // Wege / dieta
      () => {
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
      .find((x): x is Question => !!x && new Set(x.options).size === x.options.length);
    if (q) questions.push(q);
    if (questions.length >= QUESTIONS_PER_ROUND) break;
  }

  return questions;
}

export default function TestPage() {
  const navigate = useNavigate();
  const { department, meta } = useDepartment();

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

  const [round, setRound] = useState(0);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [highscore, setHighscore] = useState(0);

  useEffect(() => {
    const stored = Number(localStorage.getItem(HIGHSCORE_KEY) || 0);
    if (!Number.isNaN(stored)) setHighscore(stored);
  }, []);

  const questions = useMemo(() => (items.length ? buildQuestions(items) : []), [items, round]);

  const current = questions[index];
  const finished = started && questions.length > 0 && index >= questions.length;

  useEffect(() => {
    if (finished && score > highscore) {
      setHighscore(score);
      localStorage.setItem(HIGHSCORE_KEY, String(score));
    }
  }, [finished, score, highscore]);

  const start = () => {
    setRound((r) => r + 1);
    setStarted(true);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
  };

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === current.answer) {
      setScore((s) => s + 1);
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
    setIndex((i) => i + 1);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackgroundForDepartment intensity={0.4} blur={3} />

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/40 bg-background/50 px-5 py-4 backdrop-blur-xl backdrop-saturate-150 sm:px-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(deptHomePath(department))}
          title="Powrót"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-lg font-bold tracking-wide text-brand sm:text-xl">MENU QUIZ</h1>
          <p className="text-xs text-muted-foreground">{meta.label} · szkolenie z karty menu</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-foreground/[0.04] px-3 py-1.5 text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-brand" />
          <span className="font-semibold text-foreground">{highscore}</span>/{QUESTIONS_PER_ROUND}
        </div>
      </header>

      <main className="flex flex-1 justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-xl">
          {!started && (
            <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-8 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-brand" />
              <h2 className="mt-4 font-heading text-xl font-bold tracking-wider text-foreground">
                POZNAJ NASZE MENU
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                {QUESTIONS_PER_ROUND} losowych pytań o kategorie, ceny, opisy, alergeny i oznaczenia
                dietetyczne z karty Bar 512. Idealne dla nowych osób w zespole.
              </p>
              <Button
                onClick={start}
                disabled={isLoading || items.length === 0}
                className="mt-6 gap-2 bg-brand text-white hover:bg-brand/90"
              >
                <Play className="h-4 w-4" />
                {isLoading ? "Ładowanie menu..." : "Zacznij grę"}
              </Button>
              {!isLoading && items.length === 0 && (
                <p className="mt-3 text-xs text-destructive">Brak pozycji menu w bazie.</p>
              )}
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
                    <span>
                      Punkty: <span className="font-semibold text-foreground">{score}</span>
                    </span>
                  </span>
                </div>
                <Progress value={(index / questions.length) * 100} className="h-1.5" />
              </div>

              <div className="rounded-2xl border border-border/40 bg-foreground/[0.03] p-6">
                {current.hint && (
                  <Badge variant="outline" className="mb-3 border-border/50 text-[11px] text-muted-foreground">
                    {current.hint}
                  </Badge>
                )}
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
                    <p className="text-sm text-muted-foreground">{current.explanation}</p>
                    <Button onClick={next} className="w-full bg-brand text-white hover:bg-brand/90">
                      {index + 1 >= questions.length ? "Zobacz wynik" : "Następne pytanie"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {finished && (
            <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-8 text-center">
              <Trophy className="mx-auto h-10 w-10 text-brand" />
              <h2 className="mt-4 font-heading text-xl font-bold tracking-wider text-foreground">
                {score === questions.length
                  ? "PERFEKCYJNIE!"
                  : score >= questions.length * 0.7
                    ? "DOBRA ROBOTA!"
                    : "JESZCZE TROCHĘ NAUKI"}
              </h2>
              <p className="mt-3 text-3xl font-bold text-brand">
                {score}/{questions.length}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Najdłuższa seria: {bestStreak} · Rekord: {highscore}/{QUESTIONS_PER_ROUND}
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={start} className="gap-2 bg-brand text-white hover:bg-brand/90">
                  <RotateCcw className="h-4 w-4" /> Zagraj ponownie
                </Button>
                <Button variant="outline" onClick={() => navigate("/a-la-carte")}>
                  Otwórz kartę menu
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
