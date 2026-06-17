# Struktura monorepa `Weby`

## Přehled složek

```
Weby/
├── api/                          # Sdílené serverové API (e-maily, SMS, zrušení)
├── kadernictvi/
│   ├── _shared/admin/            # ★ Sdílené admin rozhraní (3 šablony)
│   ├── studio-elegance/          # Produkční salon — veřejný web + import @admin
│   └── donzi-reservations-main/  # Šablona pro barbershop (combined admin)
├── testovani/
│   └── studio-elegance/          # Test instance — stejný web, jiná admin šablona
├── dweby-main/                   # Hlavní web dweby.cz
├── sites.config.json             # Domény, build env, admin šablony
└── middleware.ts                 # Routing podle Host headeru
```

## 3 admin šablony (`kadernictvi/_shared/admin`)

| Šablona | `VITE_ADMIN_TEMPLATE` | Pro koho | Navigace |
|---------|----------------------|----------|----------|
| **Majitel + kadeřník** | `split` | Tým s rolemi | Majitel: statistiky · Kadeřník: kalendář, služby, nastavení |
| **Spojené** | `combined` | Malý salón / solo | Kalendář · Zákazníci · Statistiky |
| **Legacy (demo)** | `legacy` | Vybrané e-maily | Jako combined, jen pro účty v `VITE_ADMIN_LEGACY_UI_EMAILS` |

Podrobnosti: [`kadernictvi/_shared/admin/README.md`](kadernictvi/_shared/admin/README.md)

## Produkce vs. test

| | Produkce | Test |
|---|----------|------|
| Salon | `kadernictvi/studio-elegance` | `testovani/studio-elegance` |
| Doména | `kadernictvi.dweby.cz` | `test.kadernictvi.dweby.cz` |
| Admin | `split` | `legacy` (chci.web@dweby.cz) |
| DB | Stejná Supabase, `kadernictvi_id=1` | Stejná |

Test **nekopíruje** zdroják — Vite `root` ukazuje na produkční salon, liší se jen `buildEnv`.

## Workflow: změna v adminu

```
1. Uprav soubory v kadernictvi/_shared/admin/
2. npm run dev:kadernictvi-test   → lokálně port 8081
3. Nebo push → test.kadernictvi.dweby.cz
4. Ověř → produkce má stejný kód po deployi
```

**Jedna úprava v `_shared/admin` = všechny salóny**, které importují `@admin`.

## Nové kadeřnictví (produkce)

1. Zkopíruj `kadernictvi/studio-elegance` nebo `donzi-reservations-main` → `kadernictvi/{slug}/`
2. Uprav branding (barvy, texty, logo)
3. SQL: záznam v `kadernictvi`, služby, admin účty
4. Přidej blok do `sites.config.json` s `VITE_KADERNICTVI_ID` a `VITE_ADMIN_TEMPLATE`
5. Vercel: nová doména + DNS

## Co je per salón vs. sdílené

| Per salón (složka v `kadernictvi/`) | Sdílené |
|-------------------------------------|---------|
| Vzhled webu, texty, fotky | `kadernictvi/_shared/admin/` |
| `VITE_KADERNICTVI_ID` při buildu | `api/` (e-maily, SMS) |
| Doména | Supabase databáze |
| `VITE_ADMIN_TEMPLATE` volba | RLS podle `kadernictvi_id` |
