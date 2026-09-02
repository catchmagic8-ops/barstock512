import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useLongPress, type LongPressBind } from "@/hooks/useLongPress";
import { cn } from "@/lib/utils";

export interface LongPressAction {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  hint?: string;
  hidden?: boolean;
}

interface Props {
  title: string;
  description?: string;
  actions: LongPressAction[];
  disabled?: boolean;
  /** render-prop so this works on <tr>, <li>, <div>, … without extra wrappers */
  children: (bind: LongPressBind, open: boolean) => ReactNode;
}

/**
 * Press-and-hold (or right-click) any row/card to reveal its quick actions
 * in a bottom sheet — the manager shortcut used across the app.
 */
export default function LongPressMenu({ title, description, actions, disabled, children }: Props) {
  const [open, setOpen] = useState(false);
  const visible = actions.filter((a) => !a.hidden);
  const inactive = disabled || visible.length === 0;
  const bind = useLongPress(() => setOpen(true), { disabled: inactive });

  return (
    <>
      {children(bind, open)}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[80vh] overflow-y-auto rounded-t-2xl border-border/60 bg-card/95 backdrop-blur-xl"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="truncate font-heading text-base">{title}</SheetTitle>
            {description && (
              <SheetDescription className="truncate text-xs">{description}</SheetDescription>
            )}
          </SheetHeader>
          <div className="mt-4 space-y-1.5 pb-2">
            {visible.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    // let the sheet close before opening a dialog
                    setTimeout(() => action.onSelect(), 120);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border border-border/50 bg-background/40 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/60 active:scale-[0.99]",
                    action.destructive && "border-destructive/40 text-destructive hover:bg-destructive/10"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                  <span className="flex-1">
                    {action.label}
                    {action.hint && (
                      <span className="block text-[11px] font-normal text-muted-foreground">{action.hint}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
