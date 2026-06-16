import { useCallback, useEffect, useState } from "react";
import { Loader2, LogOut, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { REZERVACE_TABLE } from "@/lib/rezervace";
import { useAdminBarbershop } from "@/lib/use-admin-barbershop";
import type { Reservation } from "@/lib/reservations-by-day";
import { isReadOnlyAdminSession } from "@/lib/admin-readonly";
import { useAdminSession } from "@/lib/use-admin-session";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminMonthCalendar } from "@/components/admin/AdminMonthCalendar";
import { AdminWeekCalendar } from "@/components/admin/AdminWeekCalendar";
import { AdminAddReservationDialog } from "@/components/admin/AdminAddReservationDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { withTimeout } from "@/lib/promise-timeout";
import { cn } from "@/lib/utils";

const LIST_BOOT_MS = 25_000;

export default function AdminReservationsPage() {
  const { ready, authed, userEmail, signOut } = useAdminSession();
  const [rows, setRows] = useState<Reservation[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<"month" | "week">("month");

  const { barbershopId } = useAdminBarbershop();
  const readOnly = isReadOnlyAdminSession(userEmail);

  const loadReservations = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from(REZERVACE_TABLE)
          .select("*")
          .eq("kadernictvi_id", barbershopId)
          .order("booking_date", { ascending: true })
          .order("booking_time", { ascending: true }),
        LIST_BOOT_MS,
        "Načítání rezervací",
      );
      if (error) {
        toast.error("Nepodařilo se načíst rezervace. Zkontrolujte oprávnění v Supabase (RLS).");
        return;
      }
      setRows(data ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Načítání rezervací trvalo příliš dlouho nebo selhalo.", {
        duration: 12_000,
      });
    } finally {
      setLoadingList(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    if (ready && authed) void loadReservations();
  }, [ready, authed, loadReservations]);

  const deleteReservation = async (id: string) => {
    if (readOnly) return;
    if (!confirm("Opravdu odebrat tuto rezervaci?")) return;
    const { error } = await supabase.from(REZERVACE_TABLE).delete().eq("id", id);
    if (error) {
      toast.error("Smazání selhalo.", { description: error.message });
      return;
    }
    toast.success("Rezervace odebrána.");
    void loadReservations();
  };

  if (!ready || !authed) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />
        <p className="text-sm">Ověřuji přístup…</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <p className="text-gold tracking-[0.25em] text-xs uppercase mb-2">Administrace</p>
          <h1 className="font-display text-4xl md:text-5xl">Kalendář rezervací</h1>
          <div className="hairline w-20 mt-4 mb-2" />
          <p className="text-muted-foreground text-sm max-w-xl">
            Měsíční přehled — klikněte na den s tečkami a uvidíte seznam klientů.
          </p>
          {readOnly && (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2 inline-block">
              Tento účet je v režimu jen ke čtení.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {!readOnly && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Přidat rezervaci
            </Button>
          )}
          <Button
            variant="outline"
            className="border-border"
            onClick={() => void loadReservations()}
            disabled={loadingList}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loadingList && "animate-spin")} />
            Obnovit
          </Button>
          <Button variant="outline" className="border-border" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Odhlásit se
          </Button>
        </div>
      </div>

      <AdminNav />

      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={calendarView === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setCalendarView("month")}
        >
          Měsíc
        </Button>
        <Button
          type="button"
          variant={calendarView === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setCalendarView("week")}
        >
          Týden
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card/50 shadow-sm p-4 sm:p-6">
        {calendarView === "month" ? (
          <AdminMonthCalendar
            rows={rows}
            barbershopId={barbershopId}
            loading={loadingList}
            readOnly={readOnly}
            onDelete={(id) => void deleteReservation(id)}
          />
        ) : (
          <AdminWeekCalendar
            rows={rows}
            barbershopId={barbershopId}
            loading={loadingList}
            readOnly={readOnly}
            onDelete={(id) => void deleteReservation(id)}
          />
        )}
      </div>

      <AdminAddReservationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => void loadReservations()}
      />
    </>
  );
}
