import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { cs } from "date-fns/locale";
import {
  Ban,
  CalendarIcon,
  CalendarOff,
  Clock,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  RefreshCw,
  Save,
  Unlock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { minutesToTime, timeToMinutes } from "@/lib/booking-slots";
import { localDateKey } from "@/lib/local-date";
import { isWholeDayBlock } from "@/lib/staff-block-hours";
import {
  fetchStaffBlocks,
  staffBulkCancelAndNotify,
  unblockStaffSlot,
  type StaffBlock,
} from "@/lib/staff-blocks";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import {
  formFieldsToSchedule,
  scheduleToFormFields,
  type DayScheduleField,
} from "@/lib/work-schedule-form";
import { useAdminBarbershop } from "@/lib/use-admin-barbershop";
import { useAdminSession } from "@/lib/use-admin-session";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminStaffSettingsPage() {
  const { ready, authed, signOut } = useAdminSession();
  const { barbershopId, staffId, staffName } = useAdminBarbershop();

  const [scheduleFields, setScheduleFields] = useState<DayScheduleField[]>(() =>
    scheduleToFormFields({}),
  );
  const [workScheduleRaw, setWorkScheduleRaw] = useState<unknown>({});
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [blocks, setBlocks] = useState<StaffBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const [blockDay, setBlockDay] = useState<Date | undefined>();
  const [blockFrom, setBlockFrom] = useState("09:00");
  const [blockTo, setBlockTo] = useState("17:00");
  const [wholeDay, setWholeDay] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [blocking, setBlocking] = useState(false);

  const todayKey = localDateKey();

  const blockDate = blockDay ? format(blockDay, "yyyy-MM-dd") : "";

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const [staffRes, blocksRes] = await Promise.all([
        supabase
          .from(KADERNICTVI_TABULKY.pracovnici)
          .select("work_schedule")
          .eq("id", staffId)
          .single(),
        fetchStaffBlocks(staffId, barbershopId, todayKey),
      ]);

      const raw = staffRes.data?.work_schedule ?? {};
      setWorkScheduleRaw(raw);
      setScheduleFields(scheduleToFormFields(raw));
      setBlocks(blocksRes);
    } finally {
      setLoading(false);
    }
  }, [staffId, barbershopId, todayKey]);

  useEffect(() => {
    if (ready && authed && staffId) void load();
  }, [ready, authed, staffId, load]);

  const patchDay = (dow: number, patch: Partial<DayScheduleField>) => {
    setScheduleFields((prev) => prev.map((d) => (d.dow === dow ? { ...d, ...patch } : d)));
  };

  const saveSchedule = async () => {
    if (!staffId) return;
    setSavingSchedule(true);
    const work_schedule = formFieldsToSchedule(scheduleFields);
    const { error } = await supabase
      .from(KADERNICTVI_TABULKY.pracovnici)
      .update({ work_schedule })
      .eq("id", staffId)
      .eq("kadernictvi_id", barbershopId);
    setSavingSchedule(false);
    if (error) {
      toast.error("Rozvrh se nepodařilo uložit.", { description: error.message });
      return;
    }
    setWorkScheduleRaw(work_schedule);
    toast.success("Pracovní doba uložena.");
  };

  const blockSummary = useMemo(() => {
    if (!blockDate) return "";
    if (wholeDay) return `${blockDate} — celý pracovní den`;
    return `${blockDate} ${blockFrom}–${blockTo}`;
  }, [blockDate, wholeDay, blockFrom, blockTo]);

  const runBlock = async () => {
    if (!staffId) {
      toast.error("Účet není propojen s kadeřníkem v databázi.");
      return;
    }
    if (!blockDay || !blockDate) {
      toast.error("Vyberte datum v kalendáři.");
      return;
    }

    const notifyParts: string[] = [];
    if (sendEmail) notifyParts.push("e-maily");
    if (sendSms) notifyParts.push("SMS");
    const notifyHint =
      notifyParts.length > 0
        ? ` Klientům odejdou: ${notifyParts.join(" a ")}.`
        : " Klientům se nic neposílá.";

    const confirmText = wholeDay
      ? `Zrušit všechny rezervace v celý den ${blockDate} a zablokovat termíny?${notifyHint}`
      : `Zrušit rezervace ${blockDate} ${blockFrom}–${blockTo} a zablokovat?${notifyHint}`;

    if (!confirm(confirmText)) return;

    setBlocking(true);
    try {
      const result = await staffBulkCancelAndNotify({
        barbershopId,
        staffId,
        blockDate,
        wholeDay,
        startMinutes: timeToMinutes(blockFrom),
        endMinutes: timeToMinutes(blockTo),
        workSchedule: workScheduleRaw,
        message: blockMessage.trim(),
        sendEmail,
        sendSms,
      });

      const parts = [
        result.canceledCount > 0
          ? `Zrušeno ${result.canceledCount} rezervací`
          : "Termíny zablokovány (bez rezervací v úseku)",
        result.emailsSent > 0 ? `${result.emailsSent} e-mailů` : null,
        result.smsSent > 0 ? `${result.smsSent} SMS` : null,
      ].filter(Boolean);

      toast.success(parts.join(" · "));

      if (result.notifyErrors?.length) {
        toast.message("Upozornění klientům", {
          description: result.notifyErrors.slice(0, 2).join("; "),
          duration: 12_000,
        });
      }

      setBlockMessage("");
      setBlocks(await fetchStaffBlocks(staffId, barbershopId, todayKey));
    } catch (e) {
      toast.error("Blokace selhala.", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBlocking(false);
    }
  };

  const removeBlock = async (block: StaffBlock) => {
    const label = isWholeDayBlock(block.start_minutes, block.end_minutes)
      ? "celý den"
      : `${minutesToTime(block.start_minutes)}–${minutesToTime(block.end_minutes)}`;
    if (!confirm(`Odblokovat ${block.block_date} (${label})?`)) return;
    try {
      await unblockStaffSlot(block.id);
      toast.success("Termíny odblokovány.");
      if (staffId) {
        setBlocks(await fetchStaffBlocks(staffId, barbershopId, todayKey));
      }
    } catch (e) {
      toast.error("Odblokování selhalo.", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  if (!ready || !authed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Ověřuji přístup…</p>
      </div>
    );
  }

  if (!staffId) {
    return (
      <div className="pb-4 md:pb-0">
        <AdminNav />
        <p className="text-center text-muted-foreground py-12 max-w-md mx-auto">
          Váš účet není propojen s profilem kadeřníka. Spusťte v Supabase{" "}
          <code className="text-xs bg-muted px-1 rounded">kadernictvi_admini</code> a propojte
          účet se záznamem v <code className="text-xs bg-muted px-1 rounded">kadernictvi_pracovnici</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-4 md:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-gold tracking-[0.25em] text-xs uppercase mb-2">Profil</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl">Nastavení</h1>
          <div className="hairline w-20 mt-4 mb-2" />
          <p className="text-muted-foreground text-sm max-w-xl">
            {staffName ? `${staffName} — ` : ""}
            pracovní doba a blokace termínů
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Obnovit
          </Button>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Odhlásit
          </Button>
        </div>
      </div>

      <AdminNav />

      <div className="grid gap-6 lg:grid-cols-2 max-w-5xl">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <Clock className="h-5 w-5 text-gold" />
              Pracovní doba
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground -mt-1 mb-2">
              Zaškrtněte dny, kdy pracujete, a nastavte od–do. Uloží se do vašeho profilu a ovlivní
              volné termíny na webu.
            </p>
            {scheduleFields.map((day) => (
              <div
                key={day.dow}
                className={cn(
                  "rounded-lg border p-3 space-y-2 transition-colors",
                  day.enabled ? "border-border bg-card/40" : "border-border/50 bg-muted/20 opacity-80",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-sm">{day.fullLabel}</span>
                  <Switch
                    checked={day.enabled}
                    onCheckedChange={(v) => patchDay(day.dow, { enabled: v })}
                    aria-label={`Pracuji ${day.fullLabel}`}
                  />
                </div>
                {day.enabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Od</Label>
                      <Input
                        type="time"
                        value={day.open}
                        onChange={(e) => patchDay(day.dow, { open: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Do</Label>
                      <Input
                        type="time"
                        value={day.close}
                        onChange={(e) => patchDay(day.dow, { close: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <Button
              className="w-full bg-gold text-primary hover:bg-gold/90"
              disabled={savingSchedule}
              onClick={() => void saveSchedule()}
            >
              {savingSchedule ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Uložit rozvrh
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-display">
                <Ban className="h-5 w-5 text-amber-600" />
                Zrušit a zablokovat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nemoc, lékař nebo jiná překážka? Zruší se dotčené rezervace a termíny se zablokují.
                Klienty můžete upozornit e-mailem a/nebo SMS — vyberte níže.
              </p>

              <div className="space-y-2">
                <Label>Datum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !blockDay && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {blockDay
                        ? format(blockDay, "EEEE d. MMMM yyyy", { locale: cs })
                        : "Vyberte datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={blockDay}
                      onSelect={setBlockDay}
                      disabled={(d) => localDateKey(d) < todayKey}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
                <Checkbox
                  id="whole-day"
                  checked={wholeDay}
                  onCheckedChange={(v) => setWholeDay(v === true)}
                />
                <Label htmlFor="whole-day" className="text-sm font-normal cursor-pointer leading-snug">
                  Celý pracovní den (dle vašeho rozvrhu nahoře)
                </Label>
              </div>

              {!wholeDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="block-from">Od</Label>
                    <Input
                      id="block-from"
                      type="time"
                      value={blockFrom}
                      onChange={(e) => setBlockFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block-to">Do</Label>
                    <Input
                      id="block-to"
                      type="time"
                      value={blockTo}
                      onChange={(e) => setBlockTo(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="block-msg" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Zpráva pro klienty
                </Label>
                <Textarea
                  id="block-msg"
                  placeholder="Např.: Omlouvám se, musím jít k lékaři. Ozvěte se prosím pro nový termín."
                  value={blockMessage}
                  onChange={(e) => setBlockMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {(sendEmail || sendSms) &&
                    `Odešle se${sendEmail && sendSms ? " v e-mailu i SMS" : sendEmail ? " e-mailem" : " SMS"}. `}
                  Prázdné = výchozí text o zrušení termínu.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Upozornit klienty</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
                    <Checkbox
                      id="send-email"
                      checked={sendEmail}
                      onCheckedChange={(v) => setSendEmail(v === true)}
                    />
                    <Label
                      htmlFor="send-email"
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Poslat e-maily
                    </Label>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
                    <Checkbox
                      id="send-sms"
                      checked={sendSms}
                      onCheckedChange={(v) => setSendSms(v === true)}
                    />
                    <Label
                      htmlFor="send-sms"
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      Poslat SMS
                    </Label>
                  </div>
                </div>
                {!sendEmail && !sendSms && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Rezervace se zruší a termíny zablokují, ale klienti nedostanou žádné upozornění.
                  </p>
                )}
              </div>

              {blockSummary && (
                <p className="text-sm rounded-md bg-muted/50 px-3 py-2">
                  Blokace: <span className="font-medium">{blockSummary}</span>
                </p>
              )}

              <Button
                variant="destructive"
                className="w-full"
                disabled={blocking || !blockDay}
                onClick={() => void runBlock()}
              >
                {blocking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CalendarOff className="mr-2 h-4 w-4" />
                )}
                Zrušit rezervace a zablokovat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Aktivní blokace</CardTitle>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Žádné budoucí blokace.
                </p>
              ) : (
                <ul className="space-y-2">
                  {blocks.map((b) => (
                    <li
                      key={b.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/80 p-3"
                    >
                      <div className="text-sm min-w-0">
                        <p className="font-medium">
                          {format(parseISO(b.block_date), "EEEE d. M.", { locale: cs })}
                        </p>
                        <p className="text-muted-foreground">
                          {isWholeDayBlock(b.start_minutes, b.end_minutes)
                            ? "Celý den"
                            : `${minutesToTime(b.start_minutes)} – ${minutesToTime(b.end_minutes)}`}
                        </p>
                        {b.note && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.note}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => void removeBlock(b)}
                      >
                        <Unlock className="mr-2 h-3.5 w-3.5" />
                        Odblokovat
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
