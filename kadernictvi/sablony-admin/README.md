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

## Po úpravě

1. Ověř lokálně nebo na `kadernictvi.dweby.cz`
2. Pro nové ostré salóny: `node scripts/sync-sablony-admin.mjs` (zkopíruje do `kadernictvi/sablony-admin/`)

**Neupravuj `kadernictvi/sablony-admin/` přímo** — je to jen exportovaná kopie.
