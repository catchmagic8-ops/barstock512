import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Plus, Trash2, Loader2, Calendar, Clock, DollarSign, Tag, Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

const EVENT_CATEGORIES = ["General", "Happy Hour", "Live Music", "Sports", "Private", "Promotion"];
const RECURRENCE_OPTIONS = ["weekly", "biweekly", "monthly"];

export default function Events() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [category, setCategory] = useState("General");
  const [price, setPrice] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("weekly");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setCategory("General");
    setPrice("");
    setIsRecurring(false);
    setRecurrenceRule("weekly");
  };

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addEvent = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").insert({
        title,
        description: description || null,
        event_date: eventDate,
        event_time: eventTime || null,
        category,
        price: price ? parseFloat(price) : null,
        is_recurring: isRecurring,
        recurrence_rule: isRecurring ? recurrenceRule : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
      resetForm();
      toast.success("Event added");
    },
    onError: () => toast.error("Failed to add event"),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
    },
  });

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      "Happy Hour": "bg-amber-500/15 text-amber-400 border-amber-500/30",
      "Live Music": "bg-purple-500/15 text-purple-400 border-purple-500/30",
      "Sports": "bg-green-500/15 text-green-400 border-green-500/30",
      "Private": "bg-red-500/15 text-red-400 border-red-500/30",
      "Promotion": "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };
    return colors[cat] || "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-heading text-lg font-bold text-foreground">What's New</h1>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg">No events yet</p>
            <p className="text-sm">Add your first event or promotion</p>
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              {/* Top row: title + delete */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-bold text-foreground text-base">{ev.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive flex-shrink-0 -mt-1"
                  onClick={() => deleteEvent.mutate(ev.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Description */}
              {ev.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{ev.description}</p>
              )}

              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={categoryColor(ev.category || "General")}>
                  <Tag className="h-3 w-3 mr-1" />
                  {ev.category || "General"}
                </Badge>

                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(ev.event_date), "EEE, d MMM yyyy")}
                </Badge>

                {ev.event_time && (
                  <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">
                    <Clock className="h-3 w-3 mr-1" />
                    {ev.event_time.slice(0, 5)}
                  </Badge>
                )}

                {ev.price != null && (
                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {Number(ev.price).toFixed(2)}
                  </Badge>
                )}

                {ev.is_recurring && (
                  <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">
                    <Repeat className="h-3 w-3 mr-1" />
                    {ev.recurrence_rule || "recurring"}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Add Event Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Add Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary border-border"
            />

            <Textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border"
              rows={3}
            />

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Time (optional)</Label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Price (optional)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-4 py-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm text-foreground">Recurring event</Label>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Repeat frequency" />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addEvent.mutate()}
              disabled={!title || !eventDate || addEvent.isPending}
            >
              {addEvent.isPending ? "Adding…" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
