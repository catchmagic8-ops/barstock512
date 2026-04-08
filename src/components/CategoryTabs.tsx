import type { Category } from "@/lib/inventory";
import { Wine, Beer, GlassWater, Coffee, Recycle, Martini } from "lucide-react";
import { cn } from "@/lib/utils";

const categories: { key: Category; label: string; icon: React.ElementType }[] = [
  { key: "spirits", label: "Spirits", icon: Martini },
  { key: "wine", label: "Wine", icon: Wine },
  { key: "beer", label: "Beer", icon: Beer },
  { key: "soft-drinks", label: "Soft Drinks", icon: GlassWater },
  { key: "tea-coffee", label: "Tea & Coffee", icon: Coffee },
  { key: "reusables", label: "Reusables", icon: Recycle },
];

interface Props {
  active: Category;
  onSelect: (cat: Category) => void;
  counts: Record<Category, number>;
}

export default function CategoryTabs({ active, onSelect, counts }: Props) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all whitespace-nowrap",
            active === key
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          <span
            className={cn(
              "ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold",
              active === key
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {counts[key]}
          </span>
        </button>
      ))}
    </div>
  );
}
