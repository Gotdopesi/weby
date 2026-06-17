# Admin — Studio Elegance (test)

**Vlastní admin kód tohoto testovacího projektu.** Upravuj tady.

## 3 šablony (`templates/`)

| Složka | Kdo | Co |
|--------|-----|-----|
| `templates/owner/` | Majitel | Statistiky, CRM, výkon týmu |
| `templates/staff/` | Kadeřník | Kalendář, služby, nastavení, klienti |
| `templates/combined/` | Spojené UI | Kalendář + statistiky v jedné navigaci |
| `core/` | Všichni | Login, layout, kalendáře, session |

Přepínání: `VITE_ADMIN_TEMPLATE` v `sites.config.json` (`split` | `combined` | `legacy`).

## Přihlášení / registrace / reset hesla

- **Přihlášení** — standardní e-mail + heslo
- **Založit účet** — zobrazí se jen pokud salón **nemá žádného admina** (první majitel)
- **Zapomenuté heslo** — Supabase pošle e-mail s odkazem na `/admin/reset-password`

V Supabase Dashboard → Authentication → URL Configuration přidej redirect:
`https://kadernictvi.dweby.cz/admin/reset-password` (a `http://localhost:8080/admin/reset-password` pro lokál).

### Test registrace (bez zásahu do Studio Elegance)

```powershell
npx supabase db query --linked -f testovani/studio-elegance/supabase/kadernictvi_admin_bootstrap.sql
```

V `.env.local` dočasně nastav `VITE_KADERNICTVI_ID` na id sandboxu (`slug = sandbox-registrace`).
Opakovaný test: `kadernictvi_admin_bootstrap_reset.sql`

## Po úpravě

1. Ověř lokálně nebo na `kadernictvi.dweby.cz`
2. Pro nové ostré salóny: `node scripts/sync-sablony-admin.mjs` (zkopíruje do `kadernictvi/sablony-admin/`)

**Neupravuj `kadernictvi/sablony-admin/` přímo** — je to jen exportovaná kopie.
