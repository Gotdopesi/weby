import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@/lib/router";
import { withTimeout } from "@/lib/promise-timeout";
import {
  adminAccessErrorMessage,
  checkAdminBarbershopAccess,
} from "@/lib/admin-auth";
import { toast } from "sonner";

const AUTH_BOOT_MS = 18_000;

export function useAdminSession() {
  const { navigate } = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), AUTH_BOOT_MS, "Supabase");
        if (cancelled) return;
        if (!data.session) {
          navigate("/admin/login", { replace: true });
          return;
        }
        const check = await checkAdminBarbershopAccess(data.session.user.id);
        if (!check.ok) {
          await supabase.auth.signOut();
          toast.error(adminAccessErrorMessage(check), { duration: 14_000 });
          navigate("/admin/login", { replace: true });
          return;
        }
        setUserEmail(data.session.user.email ?? null);
        setAuthed(true);
        setReady(true);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast.error("Supabase neodpověděl včas.", { duration: 14_000 });
          navigate("/admin/login", { replace: true });
        }
      }
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session) {
        setAuthed(false);
        setUserEmail(null);
        void navigate("/admin/login", { replace: true });
        return;
      }
      void checkAdminBarbershopAccess(session.user.id).then(async (check) => {
        if (!check.ok) {
          await supabase.auth.signOut();
          toast.error(adminAccessErrorMessage(check), { duration: 14_000 });
          return;
        }
        setUserEmail(session.user.email ?? null);
        setAuthed(true);
      });
      return;
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    toast.message("Odhlášeno.");
    navigate("/admin/login", { replace: true });
  }, [navigate]);

  return { ready, authed, userEmail, signOut };
}
