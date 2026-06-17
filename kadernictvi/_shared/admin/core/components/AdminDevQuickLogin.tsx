import { useState } from "react";
import { Loader2, UserRound, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDevQuickLogins } from "@admin/core/lib/dev-admin-logins";
import { useRouter } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AdminDevQuickLogin() {
  const { navigate } = useRouter();
  const logins = getDevQuickLogins();
  const [loading, setLoading] = useState<string | null>(null);

  if (logins.length === 0) return null;

  const signInAs = async (email: string, password: string, label: string) => {
    setLoading(email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(null);
    if (error) {
      toast.error(`Přihlášení (${label}) selhalo.`, {
        description: "Spusť scripts/seed-dev-admins.mjs nebo vytvoř účty v Supabase Auth.",
        duration: 12_000,
      });
      return;
    }
    toast.success(`Přihlášeno: ${label}`);
    navigate("/admin", { replace: true });
  };

  return (
    <div className="mt-6 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/5 p-4">
      <p className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-3 font-medium">
        Dev — rychlé přihlášení (lokálně)
      </p>
      <div className="flex flex-col gap-2">
        {logins.map((acc) => (
          <Button
            key={acc.email}
            type="button"
            variant="outline"
            className="w-full justify-start border-amber-500/30 hover:bg-amber-500/10"
            disabled={loading !== null}
            onClick={() => void signInAs(acc.email, acc.password, acc.label)}
          >
            {loading === acc.email ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : acc.role === "owner" ? (
              <Users className="mr-2 h-4 w-4 text-gold" />
            ) : (
              <UserRound className="mr-2 h-4 w-4 text-gold" />
            )}
            {acc.label}
          </Button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
        Viditelné jen při <code className="text-[10px]">npm run dev</code>. Před pushem na Vercel smaž z{" "}
        <code className="text-[10px]">.env.local</code> řádky <code className="text-[10px]">VITE_DEV_*</code>.
      </p>
    </div>
  );
}
