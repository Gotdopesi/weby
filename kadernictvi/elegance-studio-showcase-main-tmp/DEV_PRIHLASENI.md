# Dočasné testovací přihlášení (majitel + kadeřník)

**Nepushuj na Vercel** dokud nemáš hotové reálné účty. Dev tlačítka fungují jen při `npm run dev`.

## 1. Doplň do `.env.local`

```env
# Existující Supabase klíče…
VITE_SUPABASE_URL=https://hnkcjrvqbeojegujuuyw.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_BARBERSHOP_ID=1

# Service role (jen lokálně, NIKDY na Vercel s VITE_)
SUPABASE_SERVICE_ROLE_KEY=...

# Dočasné testovací účty
VITE_DEV_OWNER_EMAIL=dev.majitel@studio-elegance.test
VITE_DEV_OWNER_PASSWORD=DevMajitel26!
VITE_DEV_STAFF_EMAIL=dev.monika@studio-elegance.test
VITE_DEV_STAFF_PASSWORD=DevMonika26!
```

`SUPABASE_SERVICE_ROLE_KEY` zkopíruj z `elegance-studio-showcase-main/.env.local` nebo Supabase → Settings → API → service_role.

## 2. Vytvoř účty v Auth + propojení v DB (jednou)

```powershell
cd C:\Users\Dominik\Desktop\Weby\kadernictvi\elegance-studio-showcase-main-tmp
node scripts/seed-dev-admins.mjs
```

Skript vytvoří / aktualizuje **4 účty** v Supabase Auth a propojí je v `showcase_barbershop_admins`.

Předtím měj v DB: `showcase_staff.sql`, `showcase_admin_roles.sql`, pak `studio_elegance_team.sql`.

## 3. Přihlášení

```powershell
npm run dev
```

Otevři **http://localhost:8080/admin/login**

Uvidíš žlutý box **„Dev — rychlé přihlášení“** s majitelem a všemi 3 kadeřníky.

Nebo ručně:

| Role | E-mail | Heslo |
|------|--------|-------|
| Majitel | `dev.majitel@studio-elegance.test` | `DevMajitel26!` |
| Klára | `dev.klara@studio-elegance.test` | `DevKlara26!` |
| Monika | `dev.monika@studio-elegance.test` | `DevMonika26!` |
| Eliška | `dev.eliska@studio-elegance.test` | `DevEliska26!` |

## 4. Před nasazením na Vercel smaž

- [ ] Řádky `VITE_DEV_*` z `.env.local` (a z Vercelu je nedávej)
- [ ] Soubor `src/lib/dev-admin-logins.ts`
- [ ] Soubor `src/components/admin/AdminDevQuickLogin.tsx`
- [ ] `scripts/seed-dev-admins.mjs` + tento `DEV_PRIHLASENI.md` (volitelně)
- [ ] V `AdminLoginPage.tsx` odstraň import `AdminDevQuickLogin`
- [ ] V Supabase Auth smaž testovací uživatele `dev.*@studio-elegance.test`
