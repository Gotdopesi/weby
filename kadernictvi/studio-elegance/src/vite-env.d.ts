/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  /** JWT anon nebo publishable key z Supabase (Dashboard → API). */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Zpětná kompatibilita; pokud není VITE_SUPABASE_ANON_KEY, použije se tento. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Název tabulky rezervací v DB (výchozí: rezervace). */
  readonly VITE_SUPABASE_REZERVACE_TABLE?: string;
  /** Čárkou oddělené e-maily účtů s přístupem jen ke čtení v /admin. */
  readonly VITE_ADMIN_READ_ONLY_EMAILS?: string;

  readonly VITE_ADMIN_LEGACY_UI_EMAILS?: string;
  /** split | combined | legacy — viz kadernictvi/_shared/admin/README.md */
  readonly VITE_ADMIN_TEMPLATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
