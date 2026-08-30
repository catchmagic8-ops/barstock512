import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Users,
  Hash,
  Clock,
  Phone,
  Sparkles,
  AlertTriangle,
  Wine,
  Utensils,
  Star,
  BedDouble,
  Languages,
  Accessibility,
  Flower2,
  Inbox,
  Wallet,
  StickyNote,
  Armchair,
  UserCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendPush } from "@/lib/pushNotifications";
import { useDepartment } from "@/contexts/DepartmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { deptHomePath } from "@/lib/department";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TABLE = "reservations_polskie_smaki" as const;

const OCCASIONS = ["Brak", "Urodziny", "Rocznica", "Kolacja biznesowa", "Zaręczyny", "Inne"] as const;
const SEATING = ["Bez preferencji", "Przy oknie", "Spokojny kącik", "Na zewnątrz"] as const;
const DIETARY = ["Wegetariańskie", "Wegańskie", "Bezglutenowe", "Halal", "Koszerne"] as const;
const BEVERAGE = ["Brak", "Dobór win", "Szampan na powitanie", "Open bar", "Tylko napoje bezalkoholowe"] as const;
const MENU_PREF = ["Bez preferencji", "À La Carte", "Menu ustalone", "Menu degustacyjne"] as const;
const LANGUAGES = ["Polski", "Angielski", "Niemiecki", "Rosyjski", "Inny"] as const;
const MOBILITY = ["Dostęp dla wózków", "Krzesełko dla dziecka"] as const;
const SOURCES = ["Telefon", "Bez rezerwacji", "Online", "Concierge hotelowy", "Inne"] as const;
const STATUSES = ["Potwierdzona", "Oczekująca", "Odwołana", "Nieobecność"] as const;

type Reservation = {
  id: string;
  guest_name: string;
  reservation_date: string;
  arrival_time: string;
  number_of_guests: number;
  number_of_children: number | null;
  table_number: string | null;
  occasion: string | null;
  seating_request: string | null;
  dietary_requirements: string[];
  allergies: string | null;
  beverage_preference: string | null;
  pre_ordered_items: string | null;
  menu_preference: string | null;
  vip_returning: boolean;
  hotel_guest: boolean;
  room_number: string | null;
  language: string | null;
  mobility_needs: string[];
  decoration_requests: string | null;
  reservation_source: string | null;
  deposit_paid: boolean;
  deposit_amount: number | null;
  contact_phone: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by_username: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  Potwierdzona: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  Oczekująca: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  Odwołana: "bg-muted text-muted-foreground border-border",
  "Nieobecność": "bg-red-500/20 text-red-400 border-red-500/40",
};

function emptyForm(): Partial<Reservation> {
  return {
    guest_name: "",
    reservation_date: format(new Date(), "yyyy-MM-dd"),
    arrival_time: "19:00",
    number_of_guests: 2,
    number_of_children: null,
    table_number: "",
    occasion: "Brak",
    seating_request: "Bez preferencji",
    dietary_requirements: [],
    allergies: "",
    beverage_preference: "Brak",
    pre_ordered_items: "",
    menu_preference: "Bez preferencji",
    vip_returning: false,
    hotel_guest: false,
    room_number: "",
    language: "Polski",
    mobility_needs: [],
    decoration_requests: "",
    reservation_source: "Telefon",
    deposit_paid: false,
    deposit_amount: null,
    contact_phone: "",
    notes: "",
    status: "Oczekująca",
  };
}



function formatTime(t: string | null | undefined): string {
  if (!t) return "";
  // 'HH:MM:SS' or 'HH:MM' -> 'HH:MM'
  return t.slice(0, 5);
}

function MultiCheck({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((opt) => {
        const checked = value.includes(opt);
        return (
          <label
            key={opt}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
              checked ? "border-primary/50 bg-primary/10" : "border-border bg-background"
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(c) =>
                onChange(c ? [...value, opt] : value.filter((v) => v !== opt))
              }
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4
        className="text-xs font-bold uppercase tracking-[0.18em] text-primary"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="break-words text-foreground">{value}</div>
      </div>
    </div>
  );
}

function ReservationCard({
  r,
  canAdmin,
  onEdit,
  onDelete,
  onStatusChange,
  statusUpdating,
}: {
  r: Reservation;
  canAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (newStatus: string) => void;
  statusUpdating: boolean;
}) {
  const has = (v: any) =>
    v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== "");

  const dateLabel = (() => {
    try {
      return format(new Date(r.reservation_date), "EEE, d MMM yyyy");
    } catch {
      return r.reservation_date;
    }
  })();

  return (
    <div
      className="rounded-xl border bg-card p-5 shadow-sm transition-colors"
      style={{ borderColor: "rgba(215, 76, 90, 0.25)" }}
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="truncate text-xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--foreground))" }}
            >
              {r.guest_name}
            </h3>
            {r.vip_returning && (
              <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-400">
                <Star className="mr-1 h-3 w-3" /> VIP
              </Badge>
            )}
            {r.hotel_guest && (
              <Badge className="border-cyan-500/40 bg-cyan-500/15 text-cyan-400">
                <BedDouble className="mr-1 h-3 w-3" /> Gość hotelowy
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" /> {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatTime(r.arrival_time)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {r.number_of_guests}
              {has(r.number_of_children) ? ` + ${r.number_of_children} dzieci` : ""}
            </span>
            {has(r.table_number) && (
              <span className="inline-flex items-center gap-1">
                <Hash className="h-4 w-4" /> Stolik {r.table_number}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={r.status}
            onValueChange={(v) => {
              if (v !== r.status) onStatusChange(v);
            }}
            disabled={statusUpdating}
          >
            <SelectTrigger
              title="Kliknij, aby zmienić status"
              className={cn(
                "h-7 w-auto gap-1 rounded-full border px-3 py-0 text-xs font-semibold shadow-none transition hover:opacity-90 focus:ring-0 focus:ring-offset-0",
                STATUS_STYLES[r.status] ?? STATUS_STYLES.Oczekująca,
                statusUpdating && "opacity-60"
              )}
            >
              <SelectValue>{r.status}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canAdmin && (
            <>
              <Button size="icon" variant="ghost" onClick={onEdit} title="Edytuj">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onDelete}
                title="Usuń"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {r.created_by_username && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
          <UserCircle2 className="h-3.5 w-3.5" />
          Utworzone przez <span className="font-semibold text-foreground">{r.created_by_username}</span>
        </div>
      )}

      {/* Highlight strip: occasion + allergies */}
      {(has(r.occasion) && r.occasion !== "Brak") || has(r.allergies) ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {has(r.occasion) && r.occasion !== "Brak" && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {r.occasion}
            </div>
          )}
          {has(r.allergies) && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Alergia: {r.allergies}
            </div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Food & Beverage */}
        <Section title="Jedzenie i napoje">
          {has(r.dietary_requirements) && (
            <Field
              icon={Utensils}
              label="Dieta"
              value={
                <div className="flex flex-wrap gap-1">
                  {r.dietary_requirements.map((d) => (
                    <Badge
                      key={d}
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    >
                      {d}
                    </Badge>
                  ))}
                </div>
              }
            />
          )}
          {has(r.beverage_preference) && r.beverage_preference !== "Brak" && (
            <Field icon={Wine} label="Napój" value={r.beverage_preference} />
          )}
          {has(r.menu_preference) && r.menu_preference !== "Bez preferencji" && (
            <Field icon={Utensils} label="Menu" value={r.menu_preference} />
          )}
          {has(r.pre_ordered_items) && (
            <Field icon={Inbox} label="Zamówione wcześniej" value={r.pre_ordered_items} />
          )}
        </Section>

        {/* Guest Info */}
        <Section title="Informacje o gościu">
          {has(r.seating_request) && r.seating_request !== "Bez preferencji" && (
            <Field icon={Armchair} label="Miejsce" value={r.seating_request} />
          )}
          {r.hotel_guest && has(r.room_number) && (
            <Field icon={BedDouble} label="Pokój" value={r.room_number} />
          )}
          {has(r.language) && <Field icon={Languages} label="Język" value={r.language} />}
          {has(r.mobility_needs) && (
            <Field
              icon={Accessibility}
              label="Mobilność"
              value={
                <div className="flex flex-wrap gap-1">
                  {r.mobility_needs.map((m) => (
                    <Badge key={m} variant="outline">
                      {m}
                    </Badge>
                  ))}
                </div>
              }
            />
          )}
          {has(r.decoration_requests) && (
            <Field icon={Flower2} label="Dekoracje" value={r.decoration_requests} />
          )}
        </Section>

        {/* Operational */}
        <Section title="Informacje operacyjne">
          {has(r.contact_phone) && (
            <Field icon={Phone} label="Telefon" value={r.contact_phone} />
          )}
          {has(r.reservation_source) && (
            <Field icon={Inbox} label="Źródło" value={r.reservation_source} />
          )}
          {r.deposit_paid && (
            <Field
              icon={Wallet}
              label="Zadatek"
              value={`Wpłacony${has(r.deposit_amount) ? ` · ${r.deposit_amount} PLN` : ""}`}
            />
          )}
          {has(r.notes) && <Field icon={StickyNote} label="Notatki" value={r.notes} />}
        </Section>
      </div>
    </div>
  );
}

function ReservationForm({
  initial,
  onSubmit,
  onCancel,
  saving,
}: {
  initial: Partial<Reservation>;
  onSubmit: (v: Partial<Reservation>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [f, setF] = useState<Partial<Reservation>>(initial);
  const set = (k: keyof Reservation, v: any) => setF((p) => ({ ...p, [k]: v }));

  const dateObj = f.reservation_date ? new Date(f.reservation_date) : undefined;

  return (
    <div className="space-y-6">
      {/* Essential */}
      <Section title="Podstawowe">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Imię i nazwisko gościa *</Label>
            <Input
              value={f.guest_name ?? ""}
              onChange={(e) => set("guest_name", e.target.value)}
              maxLength={120}
            />
          </div>
          <div>
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateObj && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateObj ? format(dateObj, "PPP") : "Wybierz datę"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateObj}
                  onSelect={(d) => d && set("reservation_date", format(d, "yyyy-MM-dd"))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Godzina przybycia *</Label>
            <Input
              type="time"
              value={formatTime(f.arrival_time as string)}
              onChange={(e) => set("arrival_time", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Liczba gości *</Label>
              <Input
                type="number"
                min={1}
                value={f.number_of_guests ?? 1}
                onChange={(e) => set("number_of_guests", parseInt(e.target.value || "1", 10))}
              />
            </div>
            <div>
              <Label>Dzieci</Label>
              <Input
                type="number"
                min={0}
                value={f.number_of_children ?? ""}
                onChange={(e) =>
                  set("number_of_children", e.target.value === "" ? null : parseInt(e.target.value, 10))
                }
              />
            </div>
          </div>
          <div>
            <Label>Numer stolika</Label>
            <Input
              value={f.table_number ?? ""}
              onChange={(e) => set("table_number", e.target.value)}
              maxLength={20}
            />
          </div>
          <div>
            <Label>Okazja</Label>
            {(() => {
              const current = f.occasion ?? "Brak";
              const isPreset = (OCCASIONS as readonly string[]).includes(current);
              const selectValue = isPreset ? current : "Other";
              return (
                <div className="space-y-2">
                  <Select
                    value={selectValue}
                    onValueChange={(v) => {
                      if (v === "Other") {
                        // start with empty custom text so the user can type
                        set("occasion", isPreset ? "" : current);
                      } else {
                        set("occasion", v);
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OCCASIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectValue === "Other" && (
                    <Input
                      value={isPreset ? "" : current}
                      onChange={(e) => set("occasion", e.target.value)}
                      placeholder="Podaj okazję"
                      maxLength={120}
                    />
                  )}
                </div>
              );
            })()}
          </div>
          <div className="sm:col-span-2">
            <Label>Specjalna prośba dot. miejsca</Label>
            <Select value={f.seating_request ?? "Bez preferencji"} onValueChange={(v) => set("seating_request", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SEATING.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* Food & Beverage */}
      <Section title="Jedzenie i napoje">
        <div>
          <Label>Wymagania dietetyczne</Label>
          <MultiCheck
            options={DIETARY}
            value={f.dietary_requirements ?? []}
            onChange={(v) => set("dietary_requirements", v)}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Alergie</Label>
            <Input
              value={f.allergies ?? ""}
              onChange={(e) => set("allergies", e.target.value)}
              placeholder="np. silna alergia na orzechy"
              maxLength={300}
            />
          </div>
          <div>
            <Label>Preferencje dot. napojów</Label>
            <Select value={f.beverage_preference ?? "Brak"} onValueChange={(v) => set("beverage_preference", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BEVERAGE.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Zamówione wcześniej pozycje</Label>
            <Input
              value={f.pre_ordered_items ?? ""}
              onChange={(e) => set("pre_ordered_items", e.target.value)}
              placeholder="np. tort urodzinowy, róże"
              maxLength={300}
            />
          </div>
          <div>
            <Label>Preferencje dot. menu</Label>
            <Select value={f.menu_preference ?? "Bez preferencji"} onValueChange={(v) => set("menu_preference", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MENU_PREF.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* Guest Info */}
      <Section title="Informacje o gościu">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label className="!m-0">VIP / Returning Guest</Label>
            <Switch checked={!!f.vip_returning} onCheckedChange={(c) => set("vip_returning", c)} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label className="!m-0">Gość hotelowy</Label>
            <Switch checked={!!f.hotel_guest} onCheckedChange={(c) => set("hotel_guest", c)} />
          </div>
          {f.hotel_guest && (
            <div className="sm:col-span-2">
              <Label>Numer pokoju</Label>
              <Input
                value={f.room_number ?? ""}
                onChange={(e) => set("room_number", e.target.value)}
                maxLength={20}
              />
            </div>
          )}
          <div>
            <Label>Język</Label>
            <Select value={f.language ?? "Polski"} onValueChange={(v) => set("language", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prośby dot. dekoracji</Label>
            <Input
              value={f.decoration_requests ?? ""}
              onChange={(e) => set("decoration_requests", e.target.value)}
              placeholder="np. płatki róż, świece"
              maxLength={300}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Potrzeby dot. mobilności</Label>
            <MultiCheck
              options={MOBILITY}
              value={f.mobility_needs ?? []}
              onChange={(v) => set("mobility_needs", v)}
            />
          </div>
        </div>
      </Section>

      {/* Operational */}
      <Section title="Informacje operacyjne">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Źródło rezerwacji</Label>
            <Select value={f.reservation_source ?? "Telefon"} onValueChange={(v) => set("reservation_source", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={f.status ?? "Oczekująca"} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label className="!m-0">Zadatek wpłacony</Label>
            <Switch checked={!!f.deposit_paid} onCheckedChange={(c) => set("deposit_paid", c)} />
          </div>
          {f.deposit_paid && (
            <div>
              <Label>Kwota zadatku (PLN)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={f.deposit_amount ?? ""}
                onChange={(e) =>
                  set("deposit_amount", e.target.value === "" ? null : parseFloat(e.target.value))
                }
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label>Telefon kontaktowy</Label>
            <Input
              value={f.contact_phone ?? ""}
              onChange={(e) => set("contact_phone", e.target.value)}
              maxLength={40}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notatki</Label>
            <Textarea
              value={f.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
        </div>
      </Section>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>Anuluj</Button>
        <Button
          onClick={() => {
            if (!f.guest_name?.trim()) {
              toast.error("Imię i nazwisko gościa jest wymagane");
              return;
            }
            if (!f.reservation_date || !f.arrival_time) {
              toast.error("Data i godzina przybycia są wymagane");
              return;
            }
            onSubmit(f);
          }}
          disabled={saving}
          style={{ background: "hsl(var(--brand))" }}
          className="text-white hover:opacity-90"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Zapisz rezerwację
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function Reservations() {
  const { department, meta } = useDepartment();
  const { isAdminFor, user } = useAuth();
  const canAdmin = isAdminFor("polskie_smaki");
  const canCreate = !!user; // any logged-in user (incl. staff) can create
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [toDelete, setToDelete] = useState<Reservation | null>(null);

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["reservations", department],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .order("reservation_date", { ascending: true })
        .order("arrival_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (v: Partial<Reservation>) => {
      // Clean data
      const payload: any = {
        guest_name: v.guest_name?.trim(),
        reservation_date: v.reservation_date,
        arrival_time: v.arrival_time,
        number_of_guests: v.number_of_guests ?? 1,
        number_of_children: v.number_of_children ?? null,
        table_number: v.table_number?.trim() || null,
        occasion: v.occasion || null,
        seating_request: v.seating_request || null,
        dietary_requirements: v.dietary_requirements ?? [],
        allergies: v.allergies?.trim() || null,
        beverage_preference: v.beverage_preference || null,
        pre_ordered_items: v.pre_ordered_items?.trim() || null,
        menu_preference: v.menu_preference || null,
        vip_returning: !!v.vip_returning,
        hotel_guest: !!v.hotel_guest,
        room_number: v.hotel_guest ? (v.room_number?.trim() || null) : null,
        language: v.language || null,
        mobility_needs: v.mobility_needs ?? [],
        decoration_requests: v.decoration_requests?.trim() || null,
        reservation_source: v.reservation_source || null,
        deposit_paid: !!v.deposit_paid,
        deposit_amount: v.deposit_paid ? (v.deposit_amount ?? null) : null,
        contact_phone: v.contact_phone?.trim() || null,
        notes: v.notes?.trim() || null,
        status: v.status || "Oczekująca",
      };
      if (editing?.id) {
        const { error } = await (supabase as any).from(TABLE).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from(TABLE)
          .insert({ ...payload, created_by_username: user?.username ?? null });
        if (error) throw error;
        void sendPush("reservation", {
          title: "Nowa rezerwacja",
          body: `${payload.guest_name} · ${payload.reservation_date} ${payload.arrival_time ?? ""} · ${payload.number_of_guests} os.`,
          path: `/${department}/reservations`,
          actorUsername: user?.username,
          department,
        });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Rezerwacja zaktualizowana" : "Rezerwacja utworzona");
      qc.invalidateQueries({ queryKey: ["reservations", department] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.message ?? "Nie udało się zapisać"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rezerwacja usunięta");
      qc.invalidateQueries({ queryKey: ["reservations", department] });
      setToDelete(null);
    },
    onError: (err: any) => toast.error(err?.message ?? "Nie udało się usunąć"),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from(TABLE)
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      const r = reservations.find((x) => x.id === id);
      void sendPush("reservation", {
        title: "Zmiana statusu rezerwacji",
        body: `${r?.guest_name ?? "Rezerwacja"} · ${r?.reservation_date ?? ""} → ${status}`,
        path: `/${department}/reservations`,
        actorUsername: user?.username,
        department,
      });
    },
    onSuccess: (_d, vars) => {
      toast.success(`Status ustawiony na ${vars.status}`);
      qc.invalidateQueries({ queryKey: ["reservations", department] });
    },
    onError: (err: any) => toast.error(err?.message ?? "Nie udało się zaktualizować statusu"),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reservations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.guest_name.toLowerCase().includes(q) ||
        (r.contact_phone || "").toLowerCase().includes(q) ||
        (r.table_number || "").toLowerCase().includes(q) ||
        (r.occasion || "").toLowerCase().includes(q) ||
        (r.notes || "").toLowerCase().includes(q)
      );
    });
  }, [reservations, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (r: Reservation) => {
    setEditing(r);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Link to={deptHomePath(department)}>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1
              className="text-xl font-bold sm:text-2xl"
              style={{ fontFamily: "'Playfair Display', serif", color: "hsl(var(--brand))" }}
            >
              Rezerwacje stolików
            </h1>
            <p className="text-xs text-muted-foreground">{meta.label}</p>
          </div>
        </div>
        {canCreate && (
          <Button
            onClick={openCreate}
            style={{ background: "hsl(var(--brand))" }}
            className="text-white hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" /> Nowa rezerwacja
          </Button>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj po gościu, telefonie, stoliku, okazji…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Brak rezerwacji.{canCreate && " Kliknij \"Nowa rezerwacja\", aby dodać pierwszą."}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <ReservationCard
                key={r.id}
                r={r}
                canAdmin={canAdmin}
                onEdit={() => openEdit(r)}
                onDelete={() => setToDelete(r)}
                onStatusChange={(status) => statusMutation.mutate({ id: r.id, status })}
                statusUpdating={
                  statusMutation.isPending && statusMutation.variables?.id === r.id
                }
              />
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }}>
              {editing ? "Edytuj rezerwację" : "Nowa rezerwacja"}
            </DialogTitle>
          </DialogHeader>
          <ReservationForm
            initial={editing ?? emptyForm()}
            saving={saveMutation.isPending}
            onCancel={() => { setDialogOpen(false); setEditing(null); }}
            onSubmit={(v) => saveMutation.mutate(v)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć rezerwację?</AlertDialogTitle>
            <AlertDialogDescription>
              To trwale usunie rezerwację dla{" "}
              <strong>{toDelete?.guest_name}</strong>. Tej czynności nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}