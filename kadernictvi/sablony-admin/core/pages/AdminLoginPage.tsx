import { useState, useEffect } from "react";
import { Loader2, Lock } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { withTimeout } from "@/lib/promise-timeout";
import { AdminDevQuickLogin } from "@/admin/core/components/AdminDevQuickLogin";

const AUTH_BOOT_MS = 18_000;

export default function AdminLoginPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), AUTH_BOOT_MS, "Supabase");
        if (!cancelled && data.session) {
          navigate("/admin", { replace: true });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast.error("Supabase neodpověděl včas nebo není dostupný.", {
            description: "Zkontroluj na Vercelu proměnné VITE_SUPABASE_* a zkus znovu načíst stránku.",
            duration: 14_000,
          });
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Vyplňte e-mail a heslo.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Přihlášení se nezdařilo. Zkontrolujte údaje.");
      return;
    }
    toast.success("Přihlášení proběhlo úspěšně.");
    navigate("/admin", { replace: true });
  };

  if (checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      {!isSupabaseConfigured() && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        >
          <strong className="font-medium">Supabase není na serveru nastavený.</strong>{" "}
          Na Vercelu doplň <code className="text-xs">VITE_SUPABASE_URL</code> a{" "}
          <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> u Environment Variables (Production i Preview) a
          znovu nasaď projekt.
        </div>
      )}
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Lock className="h-6 w-6 text-gold" />
          </div>
          <h1 className="font-display text-3xl mb-2">Přihlášení</h1>
          <p className="text-sm text-muted-foreground">
            Přihlaste se e-mailem a heslem přiřazeným k vašemu salónu.
          </p>
        </div>
        <form onSubmit={signIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">E-mail</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.cz"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Heslo</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full bg-gold text-primary hover:bg-gold/90" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Přihlásit se
          </Button>
        </form>
        <AdminDevQuickLogin />
      </div>
    </div>
  );
}
