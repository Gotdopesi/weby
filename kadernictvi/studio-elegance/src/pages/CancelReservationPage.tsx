import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarX2, Home, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLink } from "@/lib/router";

type Preview = {
  id: string;
  customerName: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  barbershopName: string;
  hoursUntil: number;
  canCancel: boolean;
  minHoursBefore: number;
};

export default function CancelReservationPage() {
  const token = useMemo(
    () => new URLSearchParams(window.location.search).get("token")?.trim() ?? "",
    [],
  );
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError("Chybí platný odkaz z e-mailu.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cancel-booking?token=${encodeURIComponent(token)}`);
      const body = (await res.json().catch(() => ({}))) as Preview & { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Rezervaci se nepodařilo načíst.");
        setPreview(null);
        return;
      }
      setPreview(body);
    } catch {
      setError("Nepodařilo se spojit se serverem.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmCancel = async () => {
    if (!token) return;
    setCanceling(true);
    try {
      const res = await fetch("/api/cancel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Zrušení se nepodařilo.");
        setConfirmOpen(false);
        return;
      }
      setDone(true);
      setConfirmOpen(false);
      setPreview(null);
    } catch {
      setError("Nepodařilo se spojit se serverem.");
    } finally {
      setCanceling(false);
    }
  };

  const dateLabel = preview
    ? format(parse(preview.bookingDate, "yyyy-MM-dd", new Date()), "EEEE d. MMMM yyyy", {
        locale: cs,
      })
    : "";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <p className="text-gold tracking-[0.25em] text-xs uppercase text-center mb-2">Rezervace</p>
        <h1 className="font-display text-3xl text-center mb-8">Zrušení termínu</h1>

        {loading && (
          <div className="flex flex-col items-center gap-3 text-muted-foreground py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-sm">Načítám rezervaci…</p>
          </div>
        )}

        {!loading && error && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <CalendarX2 className="h-5 w-5 text-gold" />
                {done ? "Hotovo" : "Nelze pokračovat"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button asChild variant="outline" className="w-full">
                <AppLink to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Na úvodní stránku
                </AppLink>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && done && !error && (
          <Card className="border-gold/30">
            <CardContent className="pt-6 space-y-4 text-center">
              <p className="font-display text-xl">Rezervace byla zrušena</p>
              <p className="text-sm text-muted-foreground">
                Termín je znovu volný a může si ho rezervovat někdo jiný.
              </p>
              <Button asChild className="w-full">
                <AppLink to="/">Rezervovat nový termín</AppLink>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && preview && !done && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">{preview.barbershopName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                <span className="text-muted-foreground">Jméno:</span> {preview.customerName}
              </p>
              <p>
                <span className="text-muted-foreground">Služba:</span> {preview.service}
              </p>
              <p>
                <span className="text-muted-foreground">Termín:</span>{" "}
                <span className="capitalize">{dateLabel}</span> v {preview.bookingTime}
              </p>
              {preview.canCancel ? (
                <>
                  <p className="text-muted-foreground text-xs">
                    Do termínu zbývá přibližně {Math.floor(preview.hoursUntil)} h — online zrušení je
                    možné (min. {preview.minHoursBefore} h předem).
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() => setConfirmOpen(true)}
                  >
                    Zrušit rezervaci
                  </Button>
                </>
              ) : (
                <p className="text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2 text-xs">
                  Méně než {preview.minHoursBefore} hodin před termínem — online zrušení už není
                  možné. Ozvěte se prosím telefonicky na salón.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Opravdu zrušit rezervaci?</AlertDialogTitle>
              <AlertDialogDescription>
                Tato akce je nevratná. Termín se uvolní a bude znovu k dispozici k rezervaci na webu.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={canceling}>Ne, ponechat</AlertDialogCancel>
              <AlertDialogAction
                disabled={canceling}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  void confirmCancel();
                }}
              >
                {canceling ? "Ruším…" : "Ano, zrušit rezervaci"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
