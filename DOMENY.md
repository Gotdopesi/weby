# Více domén na jednom Vercel projektu (`weby`)

## Aktivní domény (teď)

| Doména | Složka | Build výstup |
|--------|--------|--------------|
| `dweby.cz`, `www.dweby.cz` | `dweby-main` | `dist/sites/dweby` |
| `kadernictvi.dweby.cz` | `testovani/studio-elegance` (test sandbox) | `dist/sites/kadernictvi` |
| `studioelegance.dweby.cz` | `kadernictvi/studio_Perfect` (Perfekt studio) | `dist/sites/studioelegance` |

Donzi (`donzi.dweby.cz`) je v configu připravený, ale má `"deploy": false` — zapneš později smazáním toho řádku.

## Jak to funguje

1. **`sites.config.json`** — mapa doména → složka buildu + `VITE_BARBERSHOP_ID` + výchozí `siteUrl` / `resendFrom`.
2. **`middleware.ts`** — podle `Host` přesměruje na `dist/sites/{id}/…`.
3. **`api/tenant.ts`** — podle domény volajícího API nastaví odkazy v e-mailech a odesílatele (Resend).

## Vercel — co nastavit

1. Jeden projekt **`weby`**, root repozitáře = složka `Weby` (ne `kadernictvi`).
2. **Settings → Domains** — přidej:
   - `dweby.cz`
   - `www.dweby.cz`
   - `kadernictvi.dweby.cz`
   - `studioelegance.dweby.cz`
3. **DNS** u `dweby.cz`:
   - `@` → A `76.76.21.21`
   - `www` → CNAME `cname.vercel-dns.com`
   - `kadernictvi` → CNAME `cname.vercel-dns.com` (subdoména)
   - `studioelegance` → CNAME `cname.vercel-dns.com` (subdoména)
4. Push na `main` → Vercel sám buildne oba weby a middleware je rozdělí podle `Host`.

## Domény (vše v configu)

| Doména | Projekt | `VITE_BARBERSHOP_ID` (build) |
|--------|---------|------------------------------|
| `dweby.cz`, `www.dweby.cz` | `dweby-main` | — |
| `kadernictvi.dweby.cz` | `testovani/studio-elegance` | `1` (test) |
| `studioelegance.dweby.cz` | `kadernictvi/studio_Perfect` | — (jen frontend) |
| `donzi.dweby.cz` | `donzi-reservations-main` | `5` |

## Přidat / změnit doménu

1. Otevři **`sites.config.json`**:
   - `hosts` — seznam domén (malá písmena, bez `https://`)
   - `siteUrl` — produkční URL pro odkazy „Zrušit rezervaci“
   - `resendFrom` — výchozí odesílatel e-mailu
   - `buildEnv.VITE_BARBERSHOP_ID` — ID salónu v Supabase (jen salóny s rezervacemi)
2. Ve **Vercel** → Project `weby` → **Settings → Domains** přidej novou doménu a DNS (CNAME/A dle Vercelu).
3. **Redeploy** (push na `main` nebo ruční deploy).

### Příklad: vlastní doména pro Studio Elegance

Chceš místo `kadernictvi.dweby.cz` třeba `studio-elegance.cz`? Stačí přidat host do stejného site bloku (více domén = stejný web):

```json
"hosts": [
  "kadernictvi.dweby.cz",
  "studio-elegance.cz",
  "www.studio-elegance.cz"
],
"siteUrl": "https://studio-elegance.cz"
```

**DNS u registrátora** (pro každou doménu):

| Typ | Název | Hodnota |
|-----|-------|---------|
| A | `@` | `76.76.21.21` (Vercel) |
| CNAME | `www` | `cname.vercel-dns.com` |

Ve Vercelu přidej obě domény (`studio-elegance.cz` + `www`). Po deployi middleware podle `Host` servíruje stejný build `sites/kadernictvi`.

**E-maily:** pokud chceš jiného odesílatele na vlastní doméně, nastav `resendFrom` a ověř doménu v Resend. Volitelně env `SITE_URL_KADERNICTVI=https://studio-elegance.cz` na Vercelu.

## Nový web / salón v monorepu

1. Přidej složku projektu pod `Weby/`.
2. Do `sites.config.json` nový blok `sites[]` (`id`, `projectDir`, `distPath`, `hosts`, …).
3. Do `scripts/build-all.mjs` se nový web bere automaticky z configu (nic měnit nemusíš).
4. Pokud má API (rezervace), `hasApi: true` a nastav `siteUrl` / `resendFrom`.

## Environment variables na Vercelu (jeden projekt)

**Sdílené** (všechny salóny):

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — stejné pro build všech salonů (anon klíč)
- `RESEND_API_KEY`, `CRON_SECRET`, `CANCEL_SECRET`
- `BULKGATE_APP_ID`, `BULKGATE_APP_TOKEN`

**Per salón (volitelné přepsání)** — pokud nechceš jen `sites.config.json`:

- `SITE_URL_DONZI`, `SITE_URL_KADERNICTVI`
- `RESEND_FROM_DONZI`, `RESEND_FROM_KADERNICTVI`

`VITE_BARBERSHOP_ID` **není** na Vercelu — nastavuje se při buildu v `sites.config.json` → `buildEnv`.

## Lokální vývoj

```bash
cd C:\Users\Dominik\Desktop\Weby
npm run dev:dweby
npm run dev:donzi
npm run dev:kadernictvi
npm run dev:perfekt
```

Produkční chování domén lokálně simuluje jen deploy na Vercel; jednotlivé projekty běží na vlastním portu.

## Cron SMS

Endpoint: `/api/cron/send-sms` (soubor `api/cron/send-sms.ts`).  
Ve Vercelu nastav Cron Job na tento path (stejně jako dřív u Donzi).
