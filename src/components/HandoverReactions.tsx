import { useState } from "react";
import { SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🙌", "👀", "✅", "⚠️", "🔥"] as const;

export interface Reaction {
  id: string;
  note_id: string;
  emoji: string;
  username: string;
}

interface Props {
  reactions: Reaction[];
  /** Currently logged in username, used to highlight own reactions. */
  username?: string | null;
  disabled?: boolean;
  onToggle: (emoji: string) => void;
  size?: "sm" | "xs";
}

/** Emoji reactions row shown under a handover note or reply. */
export default function HandoverReactions({
  reactions,
  username,
  disabled,
  onToggle,
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);

  const grouped = REACTION_EMOJIS.map((emoji) => {
    const list = reactions.filter((r) => r.emoji === emoji);
    return {
      emoji,
      count: list.length,
      mine:
        !!username &&
        list.some((r) => r.username.toLowerCase() === username.toLowerCase()),
      who: list.map((r) => r.username).join(", "),
    };
  }).filter((g) => g.count > 0);

  const chip = size === "xs" ? "h-6 px-1.5 text-[11px]" : "h-7 px-2 text-xs";

  return (
    <div className="flex flex-wrap items-center gap-1">
      {grouped.map((g) => (
        <button
          key={g.emoji}
          type="button"
          disabled={disabled}
          title={g.who}
          onClick={() => onToggle(g.emoji)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border transition-colors disabled:opacity-60",
            chip,
            g.mine
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border/50 bg-background/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <span>{g.emoji}</span>
          <span className="font-semibold">{g.count}</span>
        </button>
      ))}

      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("gap-1 text-muted-foreground hover:text-foreground", chip)}
              title="Dodaj reakcję"
            >
              <SmilePlus className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto bg-background/90 p-1.5 backdrop-blur-xl" align="start">
            <div className="flex gap-0.5">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-lg px-1.5 py-1 text-lg transition-transform hover:scale-125"
                  onClick={() => {
                    onToggle(emoji);
                    setOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
