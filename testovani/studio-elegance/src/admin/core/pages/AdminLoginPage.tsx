import { useState, useEffect } from "react";
import { Loader2, Lock, KeyRound, UserPlus } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { withTimeout } from "@/lib/promise-timeout";
import { AdminDevQuickLogin } from "@/admin/core/components/AdminDevQuickLogin";
import {
  fetchCanRegisterOwner,
  registerOwnerAccount,
  requestAdminPasswordReset,
} from "@/admin/core/lib/admin-auth-api";

const AUTH_BOOT_MS = 18_000;

type Mode = "login" | "register" | "forgot";

export default function AdminLoginPage() {
  const { navigate } = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canRegister, setCanRegister] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), AUTH_BOOT_MS, "Supabase");
        if (!cancelled && data.session) {
          navigate("/admin", { replace: true });
          return;
        }
        const allowed = await fetchCanRegisterOwner();
        if (!cancelled) setCanRegister(allowed);
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

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !passwordConfirm) {
      toast.error("Vyplňte všechna pole.");
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
    const { error: regErr, emailSent } = await registerOwnerAccount(email, password);
    if (regErr) {
      setLoading(false);
      toast.error(regErr);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.success(
        emailSent
          ? "Účet byl vytvořen. Na e-mail jsme poslali potvrzení — přihlaste se."
          : "Účet byl vytvořen. Přihlaste se e-mailem a heslem.",
      );
      setMode("login");
      setPassword("");
      setPasswordConfirm("");
      return;
    }
    toast.success(
      emailSent
        ? "Účet vytvořen, přihlášení proběhlo. Potvrzení jsme poslali na e-mail."
        : "Účet vytvořen a přihlášení proběhlo úspěšně.",
    );
    navigate("/admin", { replace: true });
  };

  const sendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Zadejte e-mail účtu.");
      return;
    }
    setLoading(true);
    const err = await requestAdminPasswordReset(email);
    setLoading(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success("Odkaz pro obnovení hesla byl odeslán.", {
      description: "Zkontrolujte doručenou poštu (i spam).",
      duration: 12_000,
    });
    setMode("login");
  };

  if (checking) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" aria-hidden />
      </div>
    );
  }

  const title =
    mode === "register" ? "Založit účet majitele" : mode === "forgot" ? "Zapomenuté heslo" : "Přihlášení";
  const subtitle =
    mode === "register"
      ? "První přístup k salónu — vytvořte si majitelský účet."
      : mode === "forgot"
        ? "Na e-mail pošleme odkaz pro nastavení nového hesla."
        : "Přihlaste se e-mailem a heslem přiřazeným k vašemu salónu.";

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
            {mode === "register" ? (
              <UserPlus className="h-6 w-6 text-gold" />
            ) : mode === "forgot" ? (
              <KeyRound className="h-6 w-6 text-gold" />
            ) : (
              <Lock className="h-6 w-6 text-gold" />
            )}
          </div>
          <h1 className="font-display text-3xl mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {mode === "login" && (
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
              <div className="flex items-center justify-between">
                <Label htmlFor="admin-password">Heslo</Label>
                <button
                  type="button"
                  className="text-xs text-gold hover:underline"
                  onClick={() => setMode("forgot")}
                >
                  Zapomenuté heslo?
                </button>
              </div>
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
        )}

        {mode === "register" && (
          <form onSubmit={signUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-email">E-mail (přihlašovací jméno)</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="majitel@salon.cz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Heslo</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password-confirm">Heslo znovu</Label>
              <Input
                id="register-password-confirm"
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-gold text-primary hover:bg-gold/90" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Založit účet
            </Button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={sendResetEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">E-mail účtu</Label>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.cz"
              />
            </div>
            <Button type="submit" className="w-full bg-gold text-primary hover:bg-gold/90" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Poslat odkaz pro reset
            </Button>
          </form>
        )}

        <div className="mt-6 space-y-2 text-center text-sm">
          {mode === "login" && canRegister && (
            <button
              type="button"
              className="text-gold hover:underline"
              onClick={() => {
                setMode("register");
                setPassword("");
                setPasswordConfirm("");
              }}
            >
              Nemáte účet? Založit majitelský přístup
            </button>
          )}
          {mode !== "login" && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => {
                setMode("login");
                setPassword("");
                setPasswordConfirm("");
              }}
            >
              ← Zpět na přihlášení
            </button>
          )}
        </div>

        {mode === "login" && <AdminDevQuickLogin />}
      </div>
    </div>
  );
}
