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
| Vyúčtování SMS (DB) | `showcase_sms_vyuctovani`: `amount` = `sms_unit_cost × sms_billing_multiplier` per salón |

## 4. Ověření

1. Rezervace na webu → e-mail na adresu z formuláře.  
2. V adminu `/admin` — box **Konto SMS** a případně oranžová/červená lišta.  
3. SMS cron: na [cron-job.org](https://cron-job.org) vytvoř job každou hodinu na URL výše, hlavička `Authorization: Bearer <CRON_SECRET>` (nebo `x-cron-secret: <CRON_SECRET>`). Logy: Vercel → Logs.

---

## 5. Admin — kalendář, tržby, služby (rozšíření)

> Projekt je **Vite SPA** (ne Next.js). Admin cesty: `/admin` (kalendář), `/admin/trzby` (tržby), `/admin/login`.

### SQL — spusť jako první

1. Otevři **`prompts/database_schema.sql`** v Supabase → **SQL Editor** → Run.
2. Skript vytvoří:
   - tabulku **`services`** (služby s cenou a délkou),
   - doplní u **`rezervace`**: `service_id`, `total_price`, status (`confirmed` / `completed` / `canceled`),
   - tabulku **`booking_slots`** + funkci **`generate_booking_slots`** (volné termíny na **90 dní** dopředu, bez neděl),
   - pohled **`reservations`** (alias nad `rezervace` pro export/reporting).
3. V **Database → Replication** zapni realtime pro `barbershops` (kredit SMS).

### Admin kalendář (`/admin`)

- Měsíční mřížka, šipky **Doleva / Doprava** mění měsíc.
- V buňce dne: počet rezervací + tečky; **klik** = detail (modal) se jménem, časem, službou, kontaktem.
- Kód: `src/components/admin/AdminMonthCalendar.tsx`, stránka `src/pages/admin/AdminReservationsPage.tsx`.

### Admin tržby (`/admin/trzby`)

- Menu **Tržby** v `src/components/admin/AdminNav.tsx`.
- Tři karty (měsíc volitelný šipkami):
  1. **Už vyděláno** — `completed` nebo termín už proběhl (není `canceled`), součet `total_price`.
  2. **V plánu** — `confirmed` a budoucí termín.
  3. **Historie** — sloupcový přehled minulých 6 měsíců.
- Logika: `src/lib/reservation-metrics.ts`, stránka `src/pages/admin/AdminRevenuePage.tsx`.

### Rezervace na webu

- Služby se načítají z tabulky **`services`** (fallback na pevný seznam, pokud DB ještě není).
- Uloží se `service_id`, `total_price`, status **`confirmed`**.
- Kalendář na webu: max. **90 dní** dopředu (shodně se sloty v SQL).

### Kontrola po nasazení

1. SQL proběhlo bez chyby, v tabulce `services` jsou řádky.
2. `/admin` — měsíční kalendář, klik na den s rezervacemi.
3. `/admin/trzby` — čísla sedí s `total_price` v Supabase.
4. Nová rezervace na webu → v adminu viditelná, v tržbách v „V plánu“.
