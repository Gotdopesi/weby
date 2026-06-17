import { useEffect, useState } from "react";
import { Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function hasRecoveryInUrl(): boolean {
  const hash = window.location.hash.replace(/^#/, "");
  if (hash) {
    const params = new URLSearchParams(hash);
    if (params.get("type") === "recovery" && params.get("access_token")) return true;
  }
  const search = new URLSearchParams(window.location.search);
  return Boolean(search.get("code"));
}

export default function AdminResetPasswordPage() {
  const { navigate } = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const markReady = (recovery: boolean) => {
      if (cancelled) return;
      setHasRecovery(recovery);
      setReady(true);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY") {
        markReady(true);
        return;
      }
      if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN") && hasRecoveryInUrl()) {
        markReady(true);
      }
    });

    void (async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            console.error(error);
            toast.error("Odkaz pro reset hesla je neplatný nebo vypršel.");
            markReady(false);
            return;
          }
          window.history.replaceState({}, "", window.location.pathname);
          markReady(true);
          return;
        }

        if (window.location.hash.includes("access_token")) {
          await new Promise((r) => setTimeout(r, 150));
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error(error);
          markReady(false);
          return;
        }

        if (data.session && (hasRecoveryInUrl() || window.location.hash.includes("type=recovery"))) {
          window.history.replaceState({}, "", window.location.pathname);
          markReady(true);
          return;
        }

        markReady(false);
      } catch (e) {
        console.error(e);
        markReady(false);
      }
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !passwordConfirm) {
      toast.error("Vyplňte obě pole hesla.");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Hesla se neshodují.");
      return;
    }
    if (password.length < 8) {
      toast.error("Heslo musí mít alespoň 8 znaků.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Nepodařilo se uložit nové heslo. Zkuste znovu požádat o reset.");
      return;
    }
    toast.success("Heslo bylo změněno. Můžete se přihlásit.");
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />
      </div>
    );
  }

  if (!hasRecovery) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center space-y-4">
          <h1 className="font-display text-2xl">Reset hesla</h1>
          <p className="text-sm text-muted-foreground">
            Odkaz pro obnovení hesla chybí nebo vypršel. Požádejte o nový na přihlašovací stránce.
          </p>
          <Button
            type="button"
            className="bg-gold text-primary hover:bg-gold/90"
            onClick={() => navigate("/admin/login", { replace: true })}
          >
            Zpět na přihlášení
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <KeyRound className="h-6 w-6 text-gold" />
          </div>
          <h1 className="font-display text-3xl mb-2">Nové heslo</h1>
          <p className="text-sm text-muted-foreground">Zadejte nové heslo k admin účtu.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nové heslo</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password-confirm">Nové heslo znovu</Label>
            <Input
              id="new-password-confirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full bg-gold text-primary hover:bg-gold/90" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Uložit heslo
          </Button>
        </form>
      </div>
    </div>
  );
}
