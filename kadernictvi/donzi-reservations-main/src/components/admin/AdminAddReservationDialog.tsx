import { useEffect, useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { cs } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminBarbershop } from "@/lib/use-admin-barbershop";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import {
  type BookedInterval,
  fetchBookedIntervalsForDate,
  filterAvailableStartTimes,
} from "@/lib/booking-slots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type ServiceOption = { id: number; name: string; price: number; duration_minutes: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

function splitFullName(full: string): { first_name: string; last_name: string } {
  const t = full.trim().replace(/\s+/g, " ");
  const i = t.lastIndexOf(" ");
  if (i <= 0) return { first_name: t, last_name: "Neuvedeno" };
  return { first_name: t.slice(0, i), last_name: t.slice(i + 1) };
}

export function AdminAddReservationDialog({ open, onOpenChange, onCreated }: Props) {
  const { barbershopId } = useAdminBarbershop();
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [bookedIntervals, setBookedIntervals] = useState<BookedInterval[]>([]);

  const selectedService = services.find((s) => String(s.id) === serviceId);
  const dayDate = bookingDate ? parse(bookingDate, "yyyy-MM-dd", new Date()) : null;

  const timeOptions = useMemo(() => {
    if (!dayDate || !selectedService) return [];
    return filterAvailableStartTimes(dayDate, selectedService.duration_minutes, bookedIntervals);
  }, [dayDate, selectedService, bookedIntervals]);

  useEffect(() => {
    if (!open) return;
    void supabase
      .from(KADERNICTVI_TABULKY.sluzby)
      .select("id, name, price, duration_minutes")
      .eq("kadernictvi_id", barbershopId)
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setServices(
          (data ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            duration_minutes: Number(s.duration_minutes),
          })),
        );
      });
  }, [open, barbershopId]);

  useEffect(() => {
    if (!open || !bookingDate) {
      setBookedIntervals([]);
      return;
    }
    void fetchBookedIntervalsForDate(bookingDate, barbershopId)
      .then(setBookedIntervals)
      .catch(() => setBookedIntervals([]));
  }, [open, bookingDate, barbershopId]);

  const reset = () => {
    setServiceId("");
    setBookingDate("");
    setBookingTime("");
    setName("");
    setEmail("");
    setPhone("");
  };

  const submit = async () => {
    const svc = services.find((s) => String(s.id) === serviceId);
    if (!svc || !bookingDate || !bookingTime || !name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Vyplňte všechna pole.");
      return;
    }
    const { first_name, last_name } = splitFullName(name);
    setSaving(true);
    const { error } = await supabase.from(REZERVACE_TABLE).insert({
      kadernictvi_id: barbershopId,
      service_id: svc.id,
      service: svc.name,
      total_price: svc.price,
      duration_minutes: svc.duration_minutes,
      first_name,
      last_name,
      email: email.trim(),
      phone: phone.trim(),
      booking_date: bookingDate,
      booking_time: bookingTime,
      status: "confirmed",
      sms_sent: false,
    });
    setSaving(false);
    if (error) {
      toast.error("Rezervaci se nepodařilo vytvořit.", { description: error.message });
      return;
    }
    toast.success("Rezervace přidána.");
    reset();
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nová rezervace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Služba</Label>
            <Select
              value={serviceId}
              onValueChange={(v) => {
                setServiceId(v);
                setBookingTime("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Vyberte službu…" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} — {s.price.toLocaleString("cs-CZ")} Kč · {s.duration_minutes} min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input
                type="date"
                value={bookingDate}
                onChange={(e) => {
                  setBookingDate(e.target.value);
                  setBookingTime("");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Čas</Label>
              <Select value={bookingTime} onValueChange={setBookingTime} disabled={!serviceId || !bookingDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Čas" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Jméno a příjmení</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jana Nováková" />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {bookingDate && (
            <p className="text-xs text-muted-foreground capitalize">
              {format(new Date(bookingDate + "T12:00:00"), "EEEE d. MMMM yyyy", { locale: cs })}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Uložit rezervaci
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
