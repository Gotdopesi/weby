import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  addYears,
  format,
  parse,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { cs } from "date-fns/locale";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Crown,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  User,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import {
  buildCustomerInsights,
  completedVisitsInPeriod,
  filterCustomersForPeriod,
  type CustomerInsight,
  type CustomerListPeriod,
  type CustomerRecord,
} from "@/lib/customer-insights";
import { useAdminBarbershop } from "@/admin/core/lib/use-admin-barbershop";
import { useAdminSession } from "@/admin/core/lib/use-admin-session";
import { AdminNav } from "@/admin/core/components/AdminNav";
import { AdminPeriodToggle } from "@/admin/core/components/AdminPeriodToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/lib/reservations-by-day";
import { toast } from "sonner";

type CustomerRow = CustomerRecord & { insight: CustomerInsight };

function periodLabel(period: CustomerListPeriod, anchor: Date): string {
  if (period === "year") return format(startOfYear(anchor), "yyyy");
  return format(startOfMonth(anchor), "LLLL yyyy", { locale: cs });
}

function shiftAnchor(period: CustomerListPeriod, anchor: Date, delta: number): Date {
  return period === "year" ? addYears(anchor, delta) : addMonths(anchor, delta);
}

export default function AdminCustomersPage() {
  const { ready, authed, signOut } = useAdminSession();
  const { barbershopId, shopName } = useAdminBarbershop();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [listPeriod, setListPeriod] = useState<CustomerListPeriod>("month");
  const [periodAnchor, setPeriodAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const scopeLabel = periodLabel(listPeriod, periodAnchor);

  const load = useCallback(async () => {
    setLoading(true);
    const [cust, rez] = await Promise.all([
      supabase
        .from(KADERNICTVI_TABULKY.zakaznici)
        .select("id, email, first_name, last_name, note")
        .eq("kadernictvi_id", barbershopId)
        .order("last_name"),
      supabase.from(REZERVACE_TABLE).select("*").eq("kadernictvi_id", barbershopId),
    ]);
    setLoading(false);

    if (cust.error) {
      toast.error("Nepodařilo se načíst zákazníky.", { description: cust.error.message });
      return;
    }
    if (rez.error) {
      toast.error("Nepodařilo se načíst rezervace.", { description: rez.error.message });
      return;
    }

    setCustomers((cust.data ?? []) as CustomerRecord[]);
    setReservations((rez.data ?? []) as Reservation[]);
  }, [barbershopId]);

  useEffect(() => {
    if (ready && authed) void load();
  }, [ready, authed, load]);

  const insights = useMemo(
    () => buildCustomerInsights(reservations, customers),
    [reservations, customers],
  );

  const listRows = useMemo(() => {
    const filtered = filterCustomersForPeriod(customers, reservations, listPeriod, periodAnchor);
    const rows: CustomerRow[] = filtered.map((c) => {
      const email = c.email.trim().toLowerCase();
      const insight = insights.get(email) ?? {
        email,
        completedVisits: 0,
        canceledCount: 0,
        note: c.note,
        nextAppointment: null,
        isFirstVisit: true,
        lastCompletedDate: null,
      };
      return { ...c, insight };
    });
    rows.sort(
      (a, b) =>
        completedVisitsInPeriod(reservations, b.email, listPeriod, periodAnchor) -
        completedVisitsInPeriod(reservations, a.email, listPeriod, periodAnchor),
    );
    return rows;
  }, [customers, reservations, insights, listPeriod, periodAnchor]);

  const topCustomers = useMemo(() => listRows.slice(0, 5), [listRows]);

  const openCustomer = (row: CustomerRow) => {
    setSelected(row);
    setNoteDraft(row.note ?? "");
    setDetailOpen(true);
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    const note = noteDraft.trim() || null;
    const { error } = await supabase
      .from(KADERNICTVI_TABULKY.zakaznici)
      .update({ note, updated_at: new Date().toISOString() })
      .eq("id", selected.id);

    setSaving(false);
    if (error) {
      toast.error("Poznámku se nepodařilo uložit.", { description: error.message });
      return;
    }

    const updated = { ...selected, note };
    setSelected(updated);
    setCustomers((prev) => prev.map((c) => (c.id === selected.id ? { ...c, note } : c)));
    toast.success("Poznámka uložena.");
  };

  if (!ready || !authed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <p className="text-sm">Ověřuji přístup…</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-gold tracking-[0.25em] text-xs uppercase mb-2">Administrace</p>
          <h1 className="font-display text-4xl md:text-5xl">Zákazníci</h1>
          <div className="hairline w-20 mt-4 mb-2" />
          <p className="text-muted-foreground text-sm">
            {shopName ?? "Salón"} — {listRows.length} zákazníků v období
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Obnovit
          </Button>
          <Button variant="outline" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Odhlásit se
          </Button>
        </div>
      </div>

      <AdminNav />

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <AdminPeriodToggle
          value={listPeriod}
          onChange={(p) => {
            if (p === "week") return;
            setListPeriod(p);
            setPeriodAnchor(new Date());
          }}
          modes={["month", "year"]}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPeriodAnchor((a) => shiftAnchor(listPeriod, a, -1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-display text-lg capitalize min-w-[160px] text-center">{scopeLabel}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPeriodAnchor((a) => shiftAnchor(listPeriod, a, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {topCustomers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-gold/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                <Crown className="h-4 w-4 text-gold" />
                Nejvěrnější — {scopeLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-xl">
                {topCustomers[0].first_name} {topCustomers[0].last_name}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {completedVisitsInPeriod(
                  reservations,
                  topCustomers[0].email,
                  listPeriod,
                  periodAnchor,
                )}{" "}
                proběhlých návštěv
              </p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">Top 5</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {topCustomers.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openCustomer(c)}
                  className="rounded-full border border-border px-3 py-1 text-xs hover:border-gold/50 hover:bg-gold/10 transition-colors"
                >
                  {i + 1}. {c.first_name} (
                  {completedVisitsInPeriod(reservations, c.email, listPeriod, periodAnchor)}×)
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-gold" />
          </div>
        ) : listRows.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">
            V tomto období žádné proběhlé návštěvy.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {listRows.map((c) => {
              const inPeriod = completedVisitsInPeriod(
                reservations,
                c.email,
                listPeriod,
                periodAnchor,
              );
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => openCustomer(c)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {c.first_name} {c.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {c.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-sm font-medium">{inPeriod}× v období</p>
                      <p className="text-xs text-muted-foreground">
                        celkem {c.insight.completedVisits} proběhlých
                      </p>
                      {c.insight.canceledCount > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {c.insight.canceledCount}× zrušeno
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {selected.first_name} {selected.last_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">{selected.email}</p>
                <div className="rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Proběhlé návštěvy
                  </p>
                  <p className="font-display text-3xl text-foreground">
                    {selected.insight.completedVisits}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    V období {scopeLabel}:{" "}
                    {completedVisitsInPeriod(
                      reservations,
                      selected.email,
                      listPeriod,
                      periodAnchor,
                    )}
                  </p>
                  {selected.insight.lastCompletedDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Naposledy:{" "}
                      {format(
                        parse(selected.insight.lastCompletedDate, "yyyy-MM-dd", new Date()),
                        "d. M. yyyy",
                        { locale: cs },
                      )}
                    </p>
                  )}
                </div>
                {selected.insight.canceledCount > 0 && (
                  <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <XCircle className="h-4 w-4 shrink-0" />
                    Zrušených rezervací: {selected.insight.canceledCount}
                  </p>
                )}
                {selected.insight.nextAppointment ? (
                  <p className="flex items-start gap-2 rounded-md border border-border/80 bg-muted/20 px-3 py-2">
                    <CalendarClock className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                    <span>
                      Další termín:{" "}
                      <strong>
                        {format(
                          parse(
                            selected.insight.nextAppointment.booking_date,
                            "yyyy-MM-dd",
                            new Date(),
                          ),
                          "d. M. yyyy",
                          { locale: cs },
                        )}{" "}
                        {selected.insight.nextAppointment.booking_time}
                      </strong>
                      <br />
                      <span className="text-muted-foreground">
                        {selected.insight.nextAppointment.service}
                      </span>
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">Žádná budoucí rezervace.</p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="customer-note">Poznámka</Label>
                  <Textarea
                    id="customer-note"
                    rows={4}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Preference, alergie, styl střihu…"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDetailOpen(false)}>
                  Zavřít
                </Button>
                <Button type="button" onClick={() => void saveNote()} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Ukládám…" : "Uložit poznámku"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
