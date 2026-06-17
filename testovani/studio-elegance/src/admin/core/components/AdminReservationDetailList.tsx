import { useEffect, useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarClock, Clock, Mail, Phone, Sparkles, Trash2, User, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { KADERNICTVI_TABULKY } from "@/lib/kadernictvi-tables";
import {
  buildCustomerInsights,
  type CustomerInsight,
  type CustomerRecord,
} from "@/lib/customer-insights";
import type { Reservation } from "@/lib/reservations-by-day";
import { customerLabel } from "@/lib/reservations-by-day";

type Props = {
  rows: Reservation[];
  barbershopId: number;
  readOnly?: boolean;
  onDelete?: (id: string) => void;
};

export function AdminReservationDetailList({ rows, barbershopId, readOnly, onDelete }: Props) {
  const [insight, setInsight] = useState<CustomerInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const primary = rows[0];
  const emailKey = primary?.email?.trim().toLowerCase() ?? "";

  useEffect(() => {
    if (!emailKey || !barbershopId) {
      setInsight(null);
      return;
    }

    let cancelled = false;
    setLoadingInsight(true);

    void (async () => {
      const [custRes, rezRes] = await Promise.all([
        supabase
          .from(KADERNICTVI_TABULKY.zakaznici)
          .select("id, email, first_name, last_name, note")
          .eq("kadernictvi_id", barbershopId)
          .eq("email", emailKey)
          .maybeSingle(),
        supabase
          .from(REZERVACE_TABLE)
          .select("*")
          .eq("kadernictvi_id", barbershopId)
          .ilike("email", emailKey),
      ]);

      if (cancelled) return;

      const customers: CustomerRecord[] = custRes.data
        ? [custRes.data as CustomerRecord]
        : [];
      const reservations = (rezRes.data ?? []) as Reservation[];
      const map = buildCustomerInsights(reservations, customers);
      setInsight(map.get(emailKey) ?? null);
      setLoadingInsight(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [emailKey, barbershopId]);

  const noteBlock = useMemo(() => {
    if (loadingInsight) {
      return <p className="text-sm text-muted-foreground pl-6">Načítám údaje zákazníka…</p>;
    }
    if (!insight || insight.isFirstVisit) {
      return (
        <p className="text-sm pl-6 rounded-md border border-gold/50 bg-gold/15 text-gold font-medium px-3 py-2 ml-6">
          <Sparkles className="inline h-4 w-4 mr-1.5 -mt-0.5" />
          Poprvé v našem barbershopu
        </p>
      );
    }
    if (insight.note?.trim()) {
      return (
        <div className="ml-6 rounded-md border border-border/80 bg-muted/30 px-3 py-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Poznámka</p>
          <p className="text-sm whitespace-pre-wrap">{insight.note.trim()}</p>
        </div>
      );
    }
    return null;
  }, [insight, loadingInsight]);

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">Žádné rezervace.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <User className="h-4 w-4 text-gold" />
              {customerLabel(r)}
            </div>
            {!readOnly && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive shrink-0"
                onClick={() => onDelete(r.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Odebrat
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground pl-6">{r.service}</p>
          <div className="flex flex-wrap gap-3 text-sm pl-6 text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {r.booking_time}
              {r.duration_minutes ? ` · ${r.duration_minutes} min` : ""}
            </span>
            <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3.5 w-3.5" /> {r.phone}
            </a>
            <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
              <Mail className="h-3.5 w-3.5" /> {r.email}
            </a>
          </div>
          {r.total_price != null && (
            <p className="text-sm pl-6 font-medium">{Number(r.total_price).toLocaleString("cs-CZ")} Kč</p>
          )}
          {noteBlock}
          {insight && !loadingInsight && (
            <div className="pl-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {insight.completedVisits > 0 && (
                <span>{insight.completedVisits}× proběhlá návštěva</span>
              )}
              {insight.canceledCount > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <XCircle className="h-3.5 w-3.5" />
                  {insight.canceledCount}× zrušeno
                </span>
              )}
              {insight.nextAppointment && (
                <span className="inline-flex items-center gap-1 text-foreground/80">
                  <CalendarClock className="h-3.5 w-3.5 text-gold" />
                  Další termín:{" "}
                  {format(
                    parse(insight.nextAppointment.booking_date, "yyyy-MM-dd", new Date()),
                    "d. M. yyyy",
                    { locale: cs },
                  )}{" "}
                  {insight.nextAppointment.booking_time} — {insight.nextAppointment.service}
                </span>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
