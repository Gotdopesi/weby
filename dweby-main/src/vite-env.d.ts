/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Základ URL projektu z Supabase → Project Settings → API (bez koncového /) */
  readonly VITE_SUPABASE_URL?: string;
  /** anon public key z téhož místa */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Volitelné: název tabulky pro krátký formulář na React webu (výchozí portfolio_poptavky) */
  readonly VITE_SUPABASE_PORTFOLIO_TABLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
