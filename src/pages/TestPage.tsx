import { useNavigate } from "react-router-dom";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDepartment } from "@/contexts/DepartmentContext";
import { deptHomePath } from "@/lib/department";
import { AmbientBackgroundForDepartment } from "@/components/AmbientBackground";

export default function TestPage() {
  const navigate = useNavigate();
  const { department, meta } = useDepartment();

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
        <div>
          <h1 className="font-heading text-lg font-bold tracking-wide text-brand sm:text-xl">TEST</h1>
          <p className="text-xs text-muted-foreground">{meta.label} · strefa testowa</p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-border/40 bg-gradient-to-b from-foreground/[0.03] to-primary/[0.06] p-8 text-center">
          <FlaskConical className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 font-heading text-lg font-bold tracking-wider text-foreground">
            SEKCJA TESTOWA
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ta kafelka jest gotowa na nowe funkcje. Napisz, co ma tu być, i to zbuduję.
          </p>
        </div>
      </main>
    </div>
  );
}
