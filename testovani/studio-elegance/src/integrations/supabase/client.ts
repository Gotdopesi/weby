import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function missingEnvHelp(): string {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const anonKey = (
    (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as
      | string
      | undefined
  )?.trim();
  const missing = [
    ...(!url ? ["VITE_SUPABASE_URL"] : []),
    ...(!anonKey ? ["VITE_SUPABASE_ANON_KEY (nebo VITE_SUPABASE_PUBLISHABLE_KEY)"] : []),
  ];
  return `Chybí proměnné prostředí: ${missing.join(", ")}. Na Vercelu: Project → Settings → Environment Variables (Production i Preview).`;
}

/** Vrací true, pokud jsou nastavené URL a anon klíč — rezervace a admin pak volají skutečné API. */
export function isSupabaseConfigured(): boolean {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const anonKey = (
    (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as
      | string
      | undefined
  )?.trim();
  return Boolean(url && anonKey);
}

/** Nepouští síť; PostgREST / Auth dostanou srozumitelnou JSON chybu místo pádu celé aplikace. */
function unconfiguredFetch(): typeof fetch {
  const body = JSON.stringify({
    message: missingEnvHelp(),
    hint: "Nastav VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY a znovu nasaď (redeploy) projekt na Vercelu.",
  });
  return async () =>
    new Response(body, {
      status: 503,
      statusText: "Supabase not configured",
      headers: { "Content-Type": "application/json" },
    });
}

function createSupabaseClient() {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
  const anonKey = (
    (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as
      | string
      | undefined
  )?.trim();

  if (!url || !anonKey) {
    console.error(`[Supabase] ${missingEnvHelp()}`);
    // Platný tvar URL/klíče kvůli interní validaci klienta; veškerý HTTP jde přes unconfiguredFetch().
    return createClient<Database>("https://unconfigured.local", "sb-unconfigured-placeholder-key", {
      auth: {
        storage: typeof window !== "undefined" ? localStorage : undefined,
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: unconfiguredFetch() },
    });
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
