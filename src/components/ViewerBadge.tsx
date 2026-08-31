import { Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** Small marker shown for demo (viewer) accounts so nobody expects to save changes. */
export default function ViewerBadge({ className = "" }: { className?: string }) {
  const { isViewer } = useAuth();
  if (!isViewer) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${className}`}
      title="Konto prezentacyjne — zapisywanie zmian jest wyłączone"
    >
      <Eye className="h-3 w-3" />
      Tryb podglądu
    </span>
  );
}
