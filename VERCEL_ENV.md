# Vercel — environment variables (jeden projekt `weby`)

Nastav v **Vercel → Project `weby` → Settings → Environment Variables**  
Pro **Production** i **Preview**. U build-time proměnných s prefixem `VITE_` musí být zaškrtnuté i pro build.

---

## Sdílené (všechna kadeřnictví)

| Proměnná | Kde | Popis |
|----------|-----|--------|
| `SUPABASE_URL` | Server (API) | `https://hnkcjrvqbeojegujuuyw.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Service role klíč (Supabase → Settings → API) |
| `VITE_SUPABASE_URL` | Build + klient | Stejné URL jako `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Build + klient | Anon / publishable klíč |
| `RESEND_API_KEY` | Server | E-maily z rezervací |
| `CRON_SECRET` | Server | Vercel Cron → `/api/cron/send-sms` |
| `CANCEL_SECRET` | Server | Odkaz zrušení rezervace v e-mailu |
| `BULKGATE_APP_ID` | Server | SMS připomínky |
| `BULKGATE_APP_TOKEN` | Server | SMS připomínky |

**Nepřidávej na Vercel:** `SUPABASE_SERVICE_ROLE_KEY` s prefixem `VITE_`  
**Nepřidávej:** `VITE_DEV_*` testovací účty

---

## ID kadeřnictví při buildu (v `sites.config.json`, ne na Vercelu)

| Web | Doména | `VITE_KADERNICTVI_ID` / `VITE_BARBERSHOP_ID` |
|-----|--------|-----------------------------------------------|
| Studio Elegance | `kadernictvi.dweby.cz` | `1` |
| Donzi | `donzi.dweby.cz` | `5` |
| Dweby hlavní | `dweby.cz` | — (bez DB salónu) |

Build script z `sites.config.json` → `buildEnv` nastaví ID automaticky. Na Vercelu **nemusíš** duplikovat `VITE_BARBERSHOP_ID`.

---

## Volitelné přepsání URL / odesílatele e-mailu

| Proměnná | Příklad |
|----------|---------|
| `SITE_URL_KADERNICTVI` | `https://kadernictvi.dweby.cz` |
| `SITE_URL_DONZI` | `https://donzi.dweby.cz` |
| `RESEND_FROM_KADERNICTVI` | `Studio Elegance <rezervace@dweby.cz>` |
| `RESEND_FROM_DONZI` | `Donzi <rezervace@dweby.cz>` |
| `RESEND_FROM` | Výchozí odesílatel, když site nemá vlastní |

---

## Volitelné — názvy tabulek (výchozí už jsou `kadernictvi_*`)

Jen když bys měl jinou DB. **Smaž na Vercelu** staré hodnoty `showcase_*` — kód je teď přemapuje, ale build je bezpečnější bez nich.

| Proměnná | Výchozí |
|----------|---------|
| `SUPABASE_REZERVACE_TABLE` | `kadernictvi_rezervace` |
| `SUPABASE_KADERNICTVI_TABLE` | `kadernictvi` |
| `SUPABASE_SMS_TABLE` | `kadernictvi_sms` |

**Nepoužívej:** `showcase_rezervace`, `showcase_barbershops` — tabulky už neexistují.

---

## Tabulky v Supabase (přehled)

| Tabulka | Účel |
|---------|------|
| `kadernictvi` | Salony (id, slug, SMS ceny…) |
| `kadernictvi_admini` | Přihlášení majitel / kadeřník |
| `kadernictvi_pracovnici` | Tým, rozvrh, fotky URL |
| `kadernictvi_sluzby` | Ceník |
| `kadernictvi_pracovnik_sluzby` | Kdo jaké služby nabízí |
| `kadernictvi_rezervace` | Rezervace |
| `kadernictvi_pracovnik_blokace` | Blokované termíny |
| `kadernictvi_zakaznici` | CRM zákazníci |
| `kadernictvi_sms` | SMS vyúčtování **per pracovník** |
| `kadernictvi_trzby` / `kadernictvi_vydelky` | Statistiky |

Migrace: `kadernictvi/elegance-studio-showcase-main-tmp/supabase/kadernictvi_prenest.sql`

---

## Cron SMS

Vercel → Cron Jobs → `0 8-20 * * *` → path `/api/cron/send-sms`  
Authorization: Bearer `CRON_SECRET` (Vercel doplňuje automaticky u cron jobů).

---

## Checklist po deployi

1. Domény ve Vercelu (`dweby.cz`, `kadernictvi.dweby.cz`, …)
2. Všechny env výše vyplněné
3. Supabase migrace `kadernictvi_prenest.sql` spuštěná
4. Test rezervace + admin login
5. `GET /api/cron/send-sms?ping=1` (s cron auth) — kontrola tabulek
