import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, InfinityIcon, Info, Trophy, Clock, Flame, CheckCircle2, XCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const QUESTIONS_PER_ROUND = 10;
const TIME_LIMIT_SECONDS = 20;

interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_pln: number | null;
  allergens: string[] | null;
  dietary: string[] | null;
}

interface QuizResult {
  score: number;
  total: number;
  mode: Mode;
  timeSpent: number;
  record: number;
}

type Mode = "timed" | "untimed" | "learn";

interface Question {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  item?: MenuItem;
  isGeneral?: boolean;
}

function zl(n: number | null) {
  if (n === null || n === undefined) return "—";
  return `${n.toFixed(2)} zł`;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickDistractors<T>(pool: T[], correct: T, count: number): T[] {
  const filtered = pool.filter((x) => x !== correct);
  return shuffle(filtered).slice(0, count);
}

function isFood(category: string) {
  return /przystaw|zup|sałat|dan|deser|śniadanie|burger|makar|pizza|ryb|mięs|wege|vege|vegan|street|bowl|talerz|stek|grill|kuchnia/i.test(category);
}

const GENERAL_QUESTIONS: Omit<Question, "item" | "isGeneral">[] = [
  {
    prompt: "Co oznacza termin sous-vide w gastronomii?",
    options: ["Gotowanie w próżni w kontrolowanej temperaturze", "Smażenie na bardzo gorącej patelni", "Marynowanie w occie", "Duszenie w bulionie"],
    answer: "Gotowanie w próżni w kontrolowanej temperaturze",
    explanation: "Sous-vide to technika pakowania produktów w próżnię i gotowania w wodzie w stałej, niskiej temperaturze.",
  },
  {
    prompt: "Z jakiego mięsa przygotowuje się tradycyjny tatar?",
    options: ["Wołowina", "Cielęcina", "Wieprzowina", "Baranina"],
    answer: "Wołowina",
    explanation: "Klasyczny tatar to surowa, drobno posiekana wołowina z dodatkami.",
  },
  {
    prompt: "Co to jest mise en place?",
    options: ["Przygotowanie i ułożenie składników przed pracą", "Sposób podania deseru", "Technika filetowania ryby", "Rodzaj francuskiego sosu"],
    answer: "Przygotowanie i ułożenie składników przed pracą",
    explanation: "Mise en place to francuska zasada przygotowania wszystkich składników przed rozpoczęciem gotowania.",
  },
  {
    prompt: "Co oznacza włoskie określenie al dente?",
    options: ["Na ząb — lekko twarde", "Bardzo miękkie", "Z sosem pomidorowym", "Duszone na maśle"],
    answer: "Na ząb — lekko twarde",
    explanation: "Makaron al dente jest ugotowany tak, by zachował lekką sprężystość podczas gryzienia.",
  },
  {
    prompt: "Z czego składa się klasyczne pesto genovese?",
    options: ["Bazylia, orzeszki pinii, parmezan, oliwa, czosnek", "Bazylia, orzechy włoskie, ricotta, masło", "Szpinak, pestki dyni, feta, olej rzepakowy", "Rukola, migdały, pecorino, śmietana"],
    answer: "Bazylia, orzeszki pinii, parmezan, oliwa, czosnek",
    explanation: "Tradycyjne pesto powstaje z bazylii, orzeszków pinii, sera parmezan, oliwy i czosnku.",
  },
  {
    prompt: "Jaki jest podstawowy składnik guacamole?",
    options: ["Awokado", "Pomidor", "Ciecierzyca", "Batat"],
    answer: "Awokado",
    explanation: "Guacamole to meksykańska pasta z dojrzałych awokado z dodatkiem limonki, kolendry i pomidora.",
  },
  {
    prompt: "Który ser jest tradycyjnie dodawany do risotta?",
    options: ["Parmezan", "Mozzarella", "Camembert", "Ser żółty"],
    answer: "Parmezan",
    explanation: "Risotto dojrzewa z dodatkiem startego parmezanu, który nadaje kremowości i smaku.",
  },
  {
    prompt: "Co to jest emulsja w kuchni?",
    options: ["Połączenie dwóch niemieszających się płynów", "Rodzaj bulionu", "Technika krojenia warzyw", "Sposób mrożenia mięsa"],
    answer: "Połączenie dwóch niemieszających się płynów",
    explanation: "Emulsja to stabilne połączenie płynów, które normalnie się rozdzielają, np. majonez czy holenderski sos.",
  },
  {
    prompt: "Jakie są główne składniki klasycznego Mojito?",
    options: ["Rum, mięta, limonka, cukier, soda", "Gin, tonik, limonka", "Tequila, sok z limonki, sól", "Wódka, sok żurawinowy, limonka"],
    answer: "Rum, mięta, limonka, cukier, soda",
    explanation: "Mojito to koktajl na bazie białego rumu z miętą, limonką, cukrem i wodą sodową.",
  },
  {
    prompt: "Z czego składa się Aperol Spritz?",
    options: ["Aperol, Prosecco, woda sodowa", "Campari, wermut, soda", "Aperol, wódka, sok pomarańczowy", "Prosecco, sok brzoskwiniowy, grenadyna"],
    answer: "Aperol, Prosecco, woda sodowa",
    explanation: "Aperol Spritz to lekki aperitif z Aperolu, Prosecco i odrobiny wody sodowej.",
  },
  {
    prompt: "Jakie składniki wchodzą w skład klasycznej Margarity?",
    options: ["Tequila, triple sec, sok z limonki", "Rum, kokos, ananas", "Gin, wermut, oliwka", "Bourbon, cukier, angostura"],
    answer: "Tequila, triple sec, sok z limonki",
    explanation: "Margarita to tequila, likier pomarańczowy (triple sec) i świeży sok z limonki.",
  },
  {
    prompt: "Co to jest Old Fashioned?",
    options: ["Koktajl z bourbonu, cukru i angostury", "Drink z ginem i tonikiem", "Koktajl owocowy z rumu", "Shot z tequili z solą i limonką"],
    answer: "Koktajl z bourbonu, cukru i angostury",
    explanation: "Old Fashioned to klasyk na bazie bourbona z kostką cukru i bitterem angostura.",
  },
  {
    prompt: "Jaki napój jest bazą tradycyjnej Sangrii?",
    options: ["Czerwone wino", "Białe wino", "Rum", "Szampan"],
    answer: "Czerwone wino",
    explanation: "Sangria to hiszpański napój na bazie czerwonego wina z owocami i sokiem.",
  },
  {
    prompt: "Co oznacza określenie neat przy zamawianiu drinka?",
    options: ["Bez lodu, prosto z butelki", "Z kostkami lodu", "Z wodą sodową", "Zmieszany w shakerze"],
    answer: "Bez lodu, prosto z butelki",
    explanation: "Neat oznacza alkohol podany sam, bez lodu i dodatków, prosto z butelki.",
  },
  {
    prompt: "Z czego robi się Pina Colada?",
    options: ["Rum, mleczko kokosowe, sok ananasowy", "Tequila, sok pomarańczowy, grenadyna", "Gin, sok z cytryny, syrop cukrowy", "Wódka, sok żurawinowy, likier pomarańczowy"],
    answer: "Rum, mleczko kokosowe, sok ananasowy",
    explanation: "Pina Colada to słodki koktajl na bazie rumu, mleczka kokosowego i soku ananasowego.",
  },
  {
    prompt: "Jakie składniki zawiera Negroni?",
    options: ["Gin, Campari, słodki wermut", "Gin, tonik, limonka", "Wódka, Kahlúa, śmietanka", "Rum, mięta, cukier"],
    answer: "Gin, Campari, słodki wermut",
    explanation: "Negroni to wyrównany koktajl z ginu, Campari i słodkiego wermutu.",
  },
  {
    prompt: "Co oznacza on the rocks?",
    options: ["Drink podany z kostkami lodu", "Drink bez alkoholu", "Drink zmiksowany z lodem", "Drink podany w dużym kuflu"],
    answer: "Drink podany z kostkami lodu",
    explanation: "On the rocks oznacza podanie drinka z kostkami lodu w szklance.",
  },
  {
    prompt: "Co to jest garnish w koktajlu?",
    options: ["Dekoracja drinka", "Technika mieszania", "Rodzaj kruszonego lodu", "Sposób pomiaru alkoholu"],
    answer: "Dekoracja drinka",
    explanation: "Garnish to ozdoba drinka, np. plaster cytrusa, oliwka, gałązka mięty.",
  },
  {
    prompt: "Jakie szkło jest najczęściej używane do serwowania Martini?",
    options: ["Kieliszek koktajlowy (martini glass)", "Szklanka do whiskey", "Kieliszek do wina", "Wysoka szklanka Collins"],
    answer: "Kieliszek koktajlowy (martini glass)",
    explanation: "Martini serwuje się w charakterystycznym, rozszerzonym kieliszku koktajlowym.",
  },
  {
    prompt: "Co oznacza shaken, not stirred?",
    options: ["Drink wstrząśnięty w shakerze, nie mieszany", "Drink podany bez lodu", "Drink z dodatkiem sody", "Drink zmiksowany blenderem"],
    answer: "Drink wstrząśnięty w shakerze, nie mieszany",
    explanation: "To słynne zdanie Jamesa Bonda oznacza, że drink ma być schłodzony przez wstrząsanie, a nie mieszanie.",
  },
  {
    prompt: "Jak nazywa się sos na bazie żółtek, masła i octu/winnego?",
    options: ["Sos holenderski", "Sos beszamel", "Sos pomidorowy", "Sos tzatziki"],
    answer: "Sos holenderski",
    explanation: "Sos holenderski to emulsja z żółtek, roztopionego masła i kwasu (octu lub soku z cytryny).",
  },
  {
    prompt: "Jaki olej jest najbardziej odporny na wysokie temperatury?",
    options: ["Olej rzepakowy", "Oliwa z oliwek extra virgin", "Olej lniany", "Olej sezamowy"],
    answer: "Olej rzepakowy",
    explanation: "Olej rzepakowy ma wysoki punkt dymienia, dlatego nadaje się do smażenia.",
  },
  {
    prompt: "Co dodaje się do Gin & Tonic poza ginem?",
    options: ["Woda tonik i plaster limonki/lubu cytryny", "Sok pomarańczowy i grenadyna", "Sok ananasowy i kokos", "Cola i limonka"],
    answer: "Woda tonik i plaster limonki/lubu cytryny",
    explanation: "Gin & Tonic to połączenie ginu z wodą tonik i dekoracją cytrusową.",
  },
  {
    prompt: "Jakie mięso używa się do klasycznego Beef Wellington?",
    options: ["Polędwica wołowa", "Schab wieprzowy", "Udziec barani", "Pierś z kaczki"],
    answer: "Polędwica wołowa",
    explanation: "Beef Wellington to polędwica wołowa otoczona pasztetem i cieście francuskim.",
  },
];

function buildQuestions(items: MenuItem[], count: number): Question[] {
  const usable = items.filter((i) => i.name && i.category);
  const categories = Array.from(new Set(usable.map((i) => i.category)));
  const names = usable.map((i) => i.name);
  const prices = Array.from(new Set(usable.map((i) => zl(i.price_pln))));
  const allAllergens = Array.from(new Set(usable.flatMap((i) => i.allergens || [])));

  const menuQuestions: Question[] = [];

  for (const item of shuffle(usable)) {
    const kinds: Array<() => Omit<Question, "item" | "isGeneral"> | null> = [
      () => {
        if (categories.length < 4) return null;
        const opts = shuffle([item.category, ...pickDistractors(categories, item.category, 3)]);
        return {
          prompt: `Do której kategorii należy ${item.name}?`,
          options: opts,
          answer: item.category,
          explanation: `${item.name} znajdziesz w kategorii ${item.category}.`,
        };
      },
      () => {
        if (!item.price_pln || prices.length < 4) return null;
        const correct = zl(item.price_pln);
        const opts = shuffle([correct, ...pickDistractors(prices, correct, 3)]);
        return {
          prompt: `Ile kosztuje ${item.name}?`,
          options: opts,
          answer: correct,
          explanation: `Cena ${item.name} to ${correct}.`,
        };
      },
      () => {
        if (!item.description) return null;
        const opts = shuffle([item.name, ...pickDistractors(names, item.name, 3)]);
        return {
          prompt: `Który to danie? ${item.description}`,
          options: opts,
          answer: item.name,
          explanation: `To opis pozycji ${item.name} (${item.category}).`,
        };
      },
      () => {
        const a = item.allergens || [];
        if (a.length === 0 || allAllergens.length < 4) return null;
        const target = shuffle(a)[0];
        const opts = shuffle([target, ...pickDistractors(allAllergens, target, 3)]);
        return {
          prompt: `Który alergen występuje w ${item.name}?`,
          options: opts,
          answer: target,
          explanation: `${item.name} zawiera: ${a.join(", ")}.`,
        };
      },
      () => {
        if (!isFood(item.category)) return null;
        const d = item.dietary || [];
        const opts = shuffle(["Wegetariańskie", "Wegańskie", "Bezglutenowe", "Brak oznaczeń"]);
        const correct = d.length > 0 ? d.join(", ") : "Brak oznaczeń";
        return {
          prompt: `Jakie oznaczenie dietetyczne ma ${item.name}?`,
          options: opts,
          answer: correct,
          explanation:
            d.length > 0
              ? `Oznaczenia ${item.name}: ${d.join(", ")}.`
              : `${item.name} nie ma oznaczeń roślinnych w menu.`,
        };
      },
    ];

    const generators = shuffle(kinds);
    for (const gen of generators) {
      const q = gen();
      if (q) {
        menuQuestions.push({ ...q, item });
        break;
      }
    }
  }

  const generalCount = Math.min(Math.max(2, Math.round(count * 0.3)), GENERAL_QUESTIONS.length);
  const menuCount = count - generalCount;

  const selectedMenu = shuffle(menuQuestions).slice(0, menuCount);
  const selectedGeneral = shuffle(GENERAL_QUESTIONS).slice(0, generalCount).map((q) => ({ ...q, isGeneral: true }));

  return shuffle([...selectedMenu, ...selectedGeneral]);
}

export default function TestPage() {
  const { user } = useAuth();
  const { items } = useInventory();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [showDetails, setShowDetails] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [record, setRecord] = useState<QuizResult | null>(null);

  const bar512Items = useMemo(() => items.filter((i) => i.department === "bar512"), [items]);

  useEffect(() => {
    if (!user?.id || !mode) return;
    loadRecord();
  }, [user, mode]);

  async function loadRecord() {
    if (!user?.id || !mode) return;
    const { data, error } = await supabase
      .from("quiz_results")
      .select("score, total, mode, time_spent")
      .eq("user_id", user.id)
      .eq("mode", mode)
      .order("score", { ascending: false })
      .order("time_spent", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setRecord({
        score: data.score,
        total: data.total,
        mode: data.mode as Mode,
        timeSpent: data.time_spent,
        record: data.score,
      });
    }
  }

  async function saveResult(finalScore: number, total: number, timeSpent: number) {
    if (!user?.id || !mode) return;
    const { error } = await supabase.from("quiz_results").insert({
      user_id: user.id,
      mode,
      score: finalScore,
      total,
      time_spent: timeSpent,
    });
    if (error) console.error(error);
  }

  function start(selectedMode: Mode) {
    if (bar512Items.length < 4) {
      toast({
        title: "Za mało pozycji w menu",
        description: "Quiz wymaga co najmniej 4 pozycji w bazie Bar 512.",
        variant: "destructive",
      });
      return;
    }
    setMode(selectedMode);
    const qs = buildQuestions(bar512Items, QUESTIONS_PER_ROUND);
    setQuestions(qs);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
    setShowDetails(false);
    setStartTime(Date.now());
    setTimeLeft(TIME_LIMIT_SECONDS);
  }

  const current = questions[index];

  useEffect(() => {
    if (mode !== "timed" || finished || !current || picked) return;
    if (timeLeft <= 0) {
      handlePick("__timeout__");
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [mode, finished, current, picked, timeLeft]);

  function handlePick(option: string) {
    if (picked) return;
    setPicked(option);
    if (option === current.answer) setScore((s) => s + 1);
    if (mode === "learn") setShowDetails(true);
  }

  function next() {
    if (index + 1 >= questions.length) {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      setFinished(true);
      if (mode !== "learn") saveResult(score, questions.length, timeSpent);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
      setShowDetails(false);
      if (mode === "timed") setTimeLeft(TIME_LIMIT_SECONDS);
    }
  }

  function reset() {
    setMode(null);
    setQuestions([]);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
    setShowDetails(false);
    setRecord(null);
  }

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => (mode && !finished ? reset() : navigate("/"))} className="gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {mode && !finished ? "Zakończ" : "Powrót"}
          </Button>
          {mode && !finished && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{index + 1}</span>
              <span>/</span>
              <span>{questions.length}</span>
            </div>
          )}
        </div>

        {!mode && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-7 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-brand" />
              <h2 className="mt-4 font-heading text-xl font-bold tracking-wider text-foreground">
                POZNAJ NASZE MENU
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                {QUESTIONS_PER_ROUND} losowych pytań o kategoriach, cenach, opisach i alergenach z karty Bar 512
                oraz ogólnej wiedzy o gastronomii i klasycznych koktajlach. Wybierz tempo nauki.
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
                    icon: Clock,
                    title: "Na czas",
                    desc: `Każde pytanie na ${TIME_LIMIT_SECONDS} sekund. Sprawdź swoją szybkość!`,
                  },
                  {
                    m: "learn" as Mode,
                    icon: BookOpen,
                    title: "Tryb nauki",
                    desc: "Bez punktacji — ucz się z wyjaśnieniami i szczegółami dań.",
                  },
                ] as const
              ).map(({ m, icon: Icon, title, desc }) => (
                <button
                  key={m}
                  onClick={() => start(m)}
                  className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-gradient-to-br from-foreground/[0.03] to-primary/[0.05] p-5 text-left transition-all hover:border-brand/40 hover:from-brand/[0.08] hover:to-primary/[0.08]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {record && (
              <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-5 text-center">
                <p className="text-sm text-muted-foreground">Twój rekord w tym trybie</p>
                <p className="mt-1 font-heading text-lg font-bold text-brand">
                  {record.score}/{record.total}
                </p>
                <p className="text-xs text-muted-foreground">
                  {record.mode === "timed" ? `Czas: ${record.timeSpent}s` : "Tryb bez limitu czasu"}
                </p>
              </div>
            )}
          </div>
        )}

        {mode && !finished && current && (
          <div className="space-y-4">
            {mode === "timed" && (
              <div className="flex items-center justify-between rounded-xl border border-border/40 bg-foreground/[0.03] px-4 py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Czas</span>
                </div>
                <span className={`font-heading font-bold ${timeLeft <= 5 ? "text-destructive" : "text-foreground"}`}>
                  {timeLeft}s
                </span>
              </div>
            )}

            <Progress value={((index + 1) / questions.length) * 100} className="h-2" />

            <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-6">
              {showDetails && mode === "learn" && current.item && (
                <div className="mb-5 rounded-xl border border-border/40 bg-background/60 p-4">
                  <p className="font-heading text-sm font-semibold text-brand">{current.item.name}</p>
                  <p className="text-xs text-muted-foreground">{current.item.category}</p>
                  <p className="mt-2 text-sm text-foreground">{current.item.description || "Brak opisu."}</p>
                  <p className="mt-2 text-sm font-medium text-foreground">{zl(current.item.price_pln)}</p>
                  {(current.item.allergens?.length || 0) > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">Alergeny: {current.item.allergens?.join(", ")}</p>
                  )}
                  {(current.item.dietary?.length || 0) > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">Oznaczenia: {current.item.dietary?.join(", ")}</p>
                  )}
                </div>
              )}

              {showDetails && mode === "learn" && current.isGeneral && (
                <div className="mb-5 rounded-xl border border-border/40 bg-background/60 p-4">
                  <p className="font-heading text-sm font-semibold text-brand">Wiedza ogólna</p>
                  <p className="mt-2 text-sm text-foreground">{current.explanation}</p>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">{current.prompt}</h3>
                {mode === "learn" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails((s) => !s)}
                    className="h-7 gap-1.5 text-xs"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {showDetails ? "Pokaż pytanie" : current.item ? "Szczegóły dania" : "Wyjaśnienie"}
                  </Button>
                )}
              </div>

              <div className="mt-5 grid gap-3">
                {current.options.map((option) => {
                  const isCorrect = option === current.answer;
                  const isPicked = option === picked;
                  let variant: "default" | "outline" | "destructive" | "secondary" = "outline";
                  if (picked) {
                    if (isCorrect) variant = "default";
                    else if (isPicked) variant = "destructive";
                    else variant = "secondary";
                  }
                  return (
                    <Button
                      key={option}
                      variant={variant}
                      onClick={() => handlePick(option)}
                      disabled={!!picked}
                      className={`h-auto justify-start rounded-xl border-border/40 px-4 py-3 text-left text-sm font-medium transition-all ${
                        picked && isCorrect ? "bg-emerald-600 text-white hover:bg-emerald-600" : ""
                      } ${picked && isPicked && !isCorrect ? "bg-destructive text-white hover:bg-destructive" : ""}`}
                    >
                      <span className="flex-1">{option}</span>
                      {picked && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      {picked && isPicked && !isCorrect && <XCircle className="h-4 w-4 shrink-0" />}
                    </Button>
                  );
                })}

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
                        <Info className="h-3.5 w-3.5" /> {current.item ? "Zobacz pełne szczegóły dania" : "Zobacz wyjaśnienie"}
                      </Button>
                    )}
                    <Button onClick={next} className="w-full bg-brand text-white hover:bg-brand/90">
                      {index + 1 >= questions.length ? "Zobacz podsumowanie" : "Następne pytanie"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {finished && (
          <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-8 text-center">
            <Trophy className="mx-auto h-10 w-10 text-brand" />
            <h2 className="mt-4 font-heading text-xl font-bold tracking-wider text-foreground">
              KONIEC QUIZU
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Twój wynik: {" "}
              <span className="font-heading text-2xl font-bold text-brand">
                {score}/{questions.length}
              </span>
            </p>
            {mode === "timed" && (
              <p className="mt-1 text-xs text-muted-foreground">
                Czas: {Math.round((Date.now() - startTime) / 1000)}s
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={() => start(mode!)} className="w-full bg-brand text-white hover:bg-brand/90">
                <Flame className="mr-2 h-4 w-4" /> Spróbuj ponownie
              </Button>
              <Button variant="outline" onClick={reset} className="w-full">
                Wybierz inny tryb
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
