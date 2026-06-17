# E-maily (Resend) a SMS (BulkGate)

Projekt je **Vite SPA na Vercelu** (ne Next.js). Serverové endpointy jsou ve složce `api/`.

## 1. Supabase SQL

Spusť v **Supabase → SQL Editor**:

- `supabase/barbershops_setup.sql`  
  nebo migraci `supabase/migrations/20260520100000_barbershops_and_sms.sql`

Zapni **Realtime** pro tabulku `barbershops` (Database → Replication), aby se kredit v adminu aktualizoval sám.

## 2. Proměnné na Vercelu

| Proměnná | Kde |
|----------|-----|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | už máte |
| `VITE_BARBERSHOP_ID` | `1` (Studio Elegance) |
| `SUPABASE_URL` | stejné URL jako Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → service_role |
| `RESEND_API_KEY` | Resend dashboard |
| `RESEND_FROM` | `Rezervace <onboarding@resend.dev>` |
| `BULKGATE_APP_ID`, `BULKGATE_APP_TOKEN` | BulkGate |
| `CRON_SECRET` | vlastní náhodný řetězec (stejný na Vercelu i v cron-job.org) |

Lokálně: zkopíruj `.env.example` → `.env.local` (soubor je v `.gitignore`).

## 3. Co kde běží

| Funkce | Soubor / URL |
|--------|----------------|
| Potvrzovací e-mail po rezervaci | `POST /api/send-booking-email` — volá `BookingDialog` po uložení |
| SMS 24 h předem (1×/hod) | `GET https://váš-web.vercel.app/api/cron/send-sms` — volá **cron-job.org** (Hobby Vercel nemá vlastní crony) |
| Vyúčtování SMS (DB) | `kadernictvi_sms`: `amount` = `sms_unit_cost × sms_billing_multiplier` per salón |

## 4. Ověření

1. Rezervace na webu → e-mail na adresu z formuláře.  
2. V adminu `/admin` — box **Konto SMS** a případně oranžová/červená lišta.  
3. SMS cron: na [cron-job.org](https://cron-job.org) vytvoř job každou hodinu na URL výše, hlavička `Authorization: Bearer <CRON_SECRET>` (nebo `x-cron-secret: <CRON_SECRET>`). Logy: Vercel → Logs.
