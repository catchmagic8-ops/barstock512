import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TileOrderItem {
  sub: string;
  title: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: TileOrderItem[];
  onSave: (order: string[]) => void;
}

export default function TileOrderDialog({ open, onOpenChange, items, onSave }: Props) {
  const [list, setList] = useState<TileOrderItem[]>(items);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    if (open) setList(items);
  }, [open, items]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setList(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-popover/90 backdrop-blur-xl backdrop-saturate-150">
        <DialogHeader>
          <DialogTitle>Ułóż kafelki</DialogTitle>
          <DialogDescription>
            Przeciągnij kafelki lub użyj strzałek, aby ustalić kolejność na ekranie głównym.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {list.map((item, idx) => (
            <div
              key={item.sub}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragEnd={() => setDragIdx(null)}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragIdx !== null && dragIdx !== idx) {
                  move(dragIdx, idx);
                  setDragIdx(idx);
                }
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl border border-border/40 bg-foreground/[0.03] px-3 py-2",
                dragIdx === idx && "border-primary/50 opacity-70",
              )}
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {item.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={idx === 0}
                onClick={() => move(idx, idx - 1)}
                title="W górę"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={idx === list.length - 1}
                onClick={() => move(idx, idx + 1)}
                title="W dół"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            className="gap-2"
            onClick={() => {
              onSave([]);
              onOpenChange(false);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Domyślna kolejność
          </Button>
          <Button
            onClick={() => {
              onSave(list.map((i) => i.sub));
              onOpenChange(false);
            }}
          >
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
