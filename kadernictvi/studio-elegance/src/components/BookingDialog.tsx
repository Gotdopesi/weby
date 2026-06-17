import { useEffect, useRef, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarIcon, Check, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { StylistPicker } from "@/components/StylistPicker";
import { cn } from "@/lib/utils";
import {
  type BookedInterval,
  type BookedIntervalWithStaff,
  fetchBookedIntervalsWithStaffForDate,
  fetchStaffBlocksForBooking,
  filterAvailableStartTimes,
  filterAvailableStartTimesAnyStaff,
  normalizeBookingTime,
} from "@/lib/booking-slots";
import { hoursForStaffOnDay, parseStaffWorkSchedule } from "@/lib/staff-schedule";
import { DEFAULT_KADERNICTVI_ID } from "@/lib/barbershop";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { fetchServicesForBooking } from "@admin/templates/staff/lib/staff-services";
import { withTimeout } from "@/lib/promise-timeout";
import {
  STAFF_ANY,
  fetchActiveStaff,
  staffDisplayName,
  type StaffMember,
  type StaffSelection,
} from "@/lib/staff";
import { toast } from "sonner";
import type { StaffBlock } from "@admin/templates/staff/lib/staff-blocks";

const SUBMIT_MS = 25_000;
const FETCH_SLOTS_MS = 15_000;
const MAX_BOOKING_DAYS = 90;

type ServiceOption = { id: number; name: string; price: number; duration_minutes: number };

const FALLBACK_SERVICES: ServiceOption[] = [
  { id: 0, name: "Dámský střih", price: 890, duration_minutes: 60 },
  { id: 0, name: "Pánský střih", price: 590, duration_minutes: 45 },
  { id: 0, name: "Barvení", price: 1490, duration_minutes: 120 },
  { id: 0, name: "Balayage", price: 2890, duration_minutes: 180 },
  { id: 0, name: "Melír", price: 1790, duration_minutes: 150 },
  { id: 0, name: "Společenský účes", price: 1290, duration_minutes: 90 },
];

function formatServicePrice(price: number) {
  return `${price.toLocaleString("cs-CZ")} Kč`;
}

const schema = z.object({
  name: z.string().trim().min(2, "Zadejte jméno").max(100),
  email: z.string().trim().email("Neplatný e-mail").max(255),
  phone: z.string().trim().min(6, "Zadejte telefon").max(30),
  note: z.string().trim().max(500).optional(),
});

function splitFullName(full: string): { first_name: string; last_name: string } {
  const t = full.trim().replace(/\s+/g, " ");
  const i = t.lastIndexOf(" ");
  if (i <= 0) return { first_name: t, last_name: "Neuvedeno" };
  return { first_name: t.slice(0, i), last_name: t.slice(i + 1) };
}

type Props = {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialStaffId?: StaffSelection;
  initialServiceName?: string;
};

export function BookingDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  initialStaffId = STAFF_ANY,
  initialServiceName,
}: Props) {
  const timesSectionRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [service, setService] = useState<string>("");
  const [staffSelection, setStaffSelection] = useState<StaffSelection>(STAFF_ANY);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookedIntervals, setBookedIntervals] = useState<BookedInterval[]>([]);
  const [bookedWithStaff, setBookedWithStaff] = useState<BookedIntervalWithStaff[]>([]);
  const [staffBlocks, setStaffBlocks] = useState<StaffBlock[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [servicesList, setServicesList] = useState<ServiceOption[]>([]);

  const maxBookingDate = addDays(startOfDay(new Date()), MAX_BOOKING_DAYS);
  const resolvedStaffId = staffSelection === STAFF_ANY ? null : staffSelection;

  const reset = () => {
    setStep(1);
    setService("");
    setStaffSelection(initialStaffId);
    setDate(undefined);
    setTime("");
    setName("");
    setEmail("");
    setPhone("");
    setNote("");
    setLoading(false);
    setConfirmed(false);
    setBookedIntervals([]);
    setBookedWithStaff([]);
    setStaffBlocks([]);
    setLoadingTimes(false);
  };

  useEffect(() => {
    if (!open) return;
    setStaffSelection(initialStaffId);
    const hasStaff = initialStaffId !== STAFF_ANY;
    const hasService = Boolean(initialServiceName?.trim());
    if (hasStaff && hasService) setStep(3);
    else if (hasStaff) setStep(2);
    else setStep(1);
  }, [open, initialStaffId, initialServiceName]);

  useEffect(() => {
    if (!open) return;
    setLoadingStaff(true);
    void fetchActiveStaff()
      .then(setStaffList)
      .finally(() => setLoadingStaff(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!isSupabaseConfigured()) {
      setServicesList(
        FALLBACK_SERVICES.map((s, i) => ({ ...s, id: -(i + 1), duration_minutes: 60 })),
      );
      return;
    }
    void fetchServicesForBooking(DEFAULT_KADERNICTVI_ID, resolvedStaffId)
      .then((list) => {
        if (!list.length) {
          setServicesList(
            FALLBACK_SERVICES.map((s, i) => ({ ...s, id: -(i + 1), duration_minutes: 60 })),
          );
          return;
        }
        setServicesList(
          list.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            duration_minutes: s.duration_minutes,
          })),
        );
      })
      .catch(() => {
        setServicesList(
          FALLBACK_SERVICES.map((s, i) => ({ ...s, id: -(i + 1), duration_minutes: 60 })),
        );
      });
  }, [open, resolvedStaffId]);

  useEffect(() => {
    if (!service || servicesList.length === 0) return;
    if (!servicesList.some((s) => String(s.id) === service)) {
      setService("");
      setTime("");
    }
  }, [servicesList, service]);

  useEffect(() => {
    if (!open || !initialServiceName?.trim() || servicesList.length === 0) return;
    const needle = initialServiceName.trim().toLowerCase();
    const match = servicesList.find((s) => s.name.trim().toLowerCase() === needle)
      ?? servicesList.find((s) => s.name.trim().toLowerCase().includes(needle)
        || needle.includes(s.name.trim().toLowerCase()));
    if (match) setService(String(match.id));
  }, [open, initialServiceName, servicesList]);

  const submit = async () => {
    const parsed = schema.safeParse({ name, email, phone, note: note || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!service || !date || !time) {
      toast.error("Vyplňte prosím všechny kroky rezervace.");
      return;
    }
    if (!isSupabaseConfigured()) {
      toast.error("Rezervace zatím není zapnutá.", {
        description:
          "Na Vercelu nastav VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY, pak redeploy.",
        duration: 14_000,
      });
      return;
    }
    setLoading(true);
    try {
      const svc = servicesList.find((s) => String(s.id) === service);
      const serviceLabel = svc?.name || service;
      const totalPrice = svc?.price ?? null;
      const serviceId = svc && svc.id > 0 ? svc.id : null;
      const durationMinutes = svc?.duration_minutes ?? 60;
      const { first_name, last_name } = splitFullName(parsed.data.name);
      const { data: created, error } = await withTimeout(
        supabase
          .from(REZERVACE_TABLE)
          .insert({
            first_name,
            last_name,
            email: parsed.data.email,
            phone: parsed.data.phone,
            service: serviceLabel,
            service_id: serviceId,
            total_price: totalPrice,
            duration_minutes: durationMinutes,
            booking_date: format(date, "yyyy-MM-dd"),
            booking_time: time,
            status: "confirmed",
            kadernictvi_id: DEFAULT_KADERNICTVI_ID,
            pracovnik_id: resolvedStaffId,
            sms_sent: false,
          })
          .select("id")
          .single(),
        SUBMIT_MS,
        "Odeslání rezervace",
      );
      if (error || !created?.id) {
        console.error("[rezervace insert]", error);
        toast.error("Rezervaci se nepodařilo odeslat.", {
          description: error?.message ?? "Chybí ID rezervace.",
          duration: 12_000,
        });
        return;
      }

      try {
        const mailRes = await fetch("/api/send-booking-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId: created.id }),
        });
        if (!mailRes.ok) {
          const errBody = (await mailRes.json().catch(() => ({}))) as { error?: string };
          toast.message("Rezervace uložena.", {
            description: errBody.error ?? "Potvrzovací e-mail se nepodařilo odeslat.",
          });
        } else {
          toast.success("Rezervace potvrzena — e-mail odeslán.");
        }
      } catch (mailErr) {
        console.warn("[booking email]", mailErr);
      }

      setConfirmed(true);
    } catch (e) {
      console.error("[rezervace insert]", e);
      toast.error("Rezervaci se nepodařilo odeslat.", {
        description: e instanceof Error ? e.message : String(e),
        duration: 14_000,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedService = servicesList.find((s) => String(s.id) === service);
  const serviceDuration = selectedService?.duration_minutes ?? 60;
  const serviceLabel = selectedService?.name;
  const selectedStaffMember =
    staffSelection === STAFF_ANY
      ? null
      : staffList.find((s) => s.id === staffSelection) ?? null;
  const staffSchedule =
    selectedStaffMember != null
      ? parseStaffWorkSchedule(selectedStaffMember.work_schedule)
      : null;
  const staffWorksSelectedDay =
    date && selectedStaffMember != null
      ? hoursForStaffOnDay(date, staffSchedule) != null
      : true;
  const availableTimes =
    date && service
      ? staffSelection === STAFF_ANY
        ? filterAvailableStartTimesAnyStaff(
            date,
            serviceDuration,
            staffList,
            bookedWithStaff,
            staffBlocks,
          )
        : staffWorksSelectedDay
          ? filterAvailableStartTimes(
              date,
              serviceDuration,
              bookedIntervals,
              new Date(),
              staffSchedule,
            )
          : []
      : [];
  const staffLabel =
    staffSelection === STAFF_ANY
      ? "Nejbližší volný termín"
      : selectedStaffMember
        ? staffDisplayName(selectedStaffMember)
        : "Vybraný kadeřník";

  useEffect(() => {
    if (step !== 3 || !date) return;
    let cancelled = false;
    const dayKey = format(date, "yyyy-MM-dd");
    setLoadingTimes(true);
    void (async () => {
      try {
        const [reservations, blocks] = await withTimeout(
          Promise.all([
            fetchBookedIntervalsWithStaffForDate(dayKey, DEFAULT_KADERNICTVI_ID, resolvedStaffId),
            fetchStaffBlocksForBooking(dayKey, DEFAULT_KADERNICTVI_ID, resolvedStaffId),
          ]),
          FETCH_SLOTS_MS,
          "Načítání volných časů",
        );
        if (cancelled) return;

        setBookedWithStaff(reservations);
        setStaffBlocks(blocks);

        if (resolvedStaffId != null) {
          const forStaff = reservations
            .filter((r) => r.staffId == null || r.staffId === resolvedStaffId)
            .map(({ startMinutes, durationMinutes }) => ({ startMinutes, durationMinutes }));
          setBookedIntervals([
            ...forStaff,
            ...blocks.filter((b) => b.pracovnik_id === resolvedStaffId).map((b) => ({
              startMinutes: b.start_minutes,
              durationMinutes: b.end_minutes - b.start_minutes,
            })),
          ]);
        } else {
          setBookedIntervals([]);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast.error("Nepodařilo se načíst obsazené časy.", {
            description: "Zkuste vybrat datum znovu.",
            duration: 10_000,
          });
          setBookedIntervals([]);
          setBookedWithStaff([]);
          setStaffBlocks([]);
        }
      } finally {
        if (!cancelled) setLoadingTimes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, date, resolvedStaffId, staffSelection, staffList]);

  useEffect(() => {
    if (step !== 3 || !date || !time || !service) return;
    const stillOk =
      staffSelection === STAFF_ANY
        ? filterAvailableStartTimesAnyStaff(
            date,
            serviceDuration,
            staffList,
            bookedWithStaff,
            staffBlocks,
          ).includes(normalizeBookingTime(time))
        : filterAvailableStartTimes(
            date,
            serviceDuration,
            bookedIntervals,
            new Date(),
            staffSchedule,
          ).includes(normalizeBookingTime(time));
    if (!stillOk) setTime("");
  }, [step, date, time, service, serviceDuration, bookedIntervals, bookedWithStaff, staffBlocks, staffSchedule, staffSelection, staffList]);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setTimeout(reset, 200);
  };

  const dialogBody = (
    <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
      {confirmed ? (
        <div className="text-center py-6">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full gradient-gold">
            <Check className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h3 className="font-display text-3xl mb-2">Rezervace potvrzena</h3>
          <p className="text-muted-foreground mb-6">
            Těšíme se na vás! Brzy vám pošleme potvrzovací e-mail.
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-5 text-left text-sm space-y-1.5 max-w-sm mx-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Služba</span>
              <span className="font-medium">{serviceLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kadeřník</span>
              <span className="font-medium text-right max-w-[55%]">{staffLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Datum</span>
              <span className="font-medium">
                {date && format(date, "EEEE d. MMMM yyyy", { locale: cs })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Čas</span>
              <span className="font-medium">{time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jméno</span>
              <span className="font-medium">{name}</span>
            </div>
          </div>
          <Button type="button" className="mt-6" onClick={() => handleOpenChange(false)}>
            Zavřít
          </Button>
        </div>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" /> Rezervace termínu
            </DialogTitle>
            <DialogDescription>Krok {step} ze 4</DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Vyberte službu</Label>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zvolte službu..." />
                  </SelectTrigger>
                  <SelectContent>
                    {servicesList.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} —{" "}
                        <span className="text-muted-foreground">
                          {formatServicePrice(s.price)} · {s.duration_minutes} min
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" disabled={!service} onClick={() => setStep(2)}>
                  Pokračovat
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Kdo vás bude čekat?</Label>
                {loadingStaff ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-gold" />
                    Načítám tým…
                  </div>
                ) : (
                  <>
                    {staffList.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Seznam kadeřníků se načítá z databáze — zatím je k dispozici volba „Je mi to
                        jedno“.
                      </p>
                    )}
                    <StylistPicker
                      staff={staffList}
                      value={staffSelection}
                      onChange={setStaffSelection}
                    />
                  </>
                )}
              </div>
              <DialogFooter className="flex-row sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  Zpět
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  Pokračovat
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Vyberte datum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: cs }) : "Vyberte datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        setDate(d);
                        setTime("");
                        if (d) {
                          requestAnimationFrame(() => {
                            timesSectionRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          });
                        }
                      }}
                      disabled={(d) => {
                        const today = startOfDay(new Date());
                        if (d < today || d > maxBookingDate || d.getDay() === 0) return true;
                        if (staffSelection !== STAFF_ANY && selectedStaffMember) {
                          const sched = parseStaffWorkSchedule(selectedStaffMember.work_schedule);
                          return hoursForStaffOnDay(d, sched) == null;
                        }
                        if (staffSelection === STAFF_ANY && staffList.length > 0) {
                          return !staffList.some((member) => {
                            const sched = parseStaffWorkSchedule(member.work_schedule);
                            return hoursForStaffOnDay(d, sched) != null;
                          });
                        }
                        return false;
                      }}
                      locale={cs}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {date && (
                <div ref={timesSectionRef} className="space-y-2 scroll-mt-4">
                  <Label>
                    Dostupné časy
                    {staffSelection !== STAFF_ANY && selectedStaffMember && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        — {staffDisplayName(selectedStaffMember)}
                      </span>
                    )}
                  </Label>
                  {loadingTimes ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-gold" />
                      Kontroluji volné termíny…
                    </div>
                  ) : !service ? (
                    <p className="text-sm text-muted-foreground">Nejdřív vyberte službu v kroku 1.</p>
                  ) : staffSelection !== STAFF_ANY && !staffWorksSelectedDay ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedStaffMember
                        ? `${staffDisplayName(selectedStaffMember)} v tento den nepracuje. Zkuste jiný den.`
                        : "Vybraný kadeřník v tento den nepracuje."}
                    </p>
                  ) : availableTimes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Pro tento den bohužel nemáme volný termín. Zkuste jiný den nebo „Je mi to jedno“.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {availableTimes.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTime(t)}
                          className={cn(
                            "px-3 py-2 rounded-md border text-sm transition-all",
                            time === t
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:border-gold hover:text-gold",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="flex-row sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                  Zpět
                </Button>
                <Button
                  type="button"
                  disabled={!date || !time || loadingTimes}
                  onClick={() => setStep(4)}
                >
                  Pokračovat
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Jméno a příjmení</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jana Nováková"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+420 ..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vas@email.cz"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Poznámka (volitelné)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Přání, alergie, preference..."
                />
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Služba:</span> {serviceLabel}
                </div>
                <div>
                  <span className="text-muted-foreground">Kadeřník:</span> {staffLabel}
                </div>
                <div>
                  <span className="text-muted-foreground">Termín:</span>{" "}
                  {date && format(date, "d. M. yyyy", { locale: cs })} v {time}
                </div>
              </div>

              <DialogFooter className="flex-row sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                  Zpět
                </Button>
                <Button type="button" onClick={() => void submit()} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Potvrdit rezervaci
                </Button>
              </DialogFooter>
            </div>
          )}
        </>
      )}
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {dialogBody}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {dialogBody}
    </Dialog>
  );
}
