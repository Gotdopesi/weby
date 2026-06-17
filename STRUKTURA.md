# Struktura monorepa `Weby`

## Hlavní myšlenka

- **`kadernictvi.dweby.cz` = testovací sandbox** (Studio Elegance), ne ostrý web zákazníka
- **Ostré salóny** zatím nemáš — až přijdou, každý dostane **vlastní složku** s **vlastní kopií** adminu
- **3 admin rozhraní** (majitel / kadeřník / spojené) — v testu i u ostrých, ale **kód se nesdílí automaticky**

```
Weby/
├── testovani/
│   └── studio-elegance/          ← TEST (kadernictvi.dweby.cz)
│       └── src/admin/            ← upravuješ TADY
│
├── kadernictvi/
│   ├── sablony-admin/            ← vzory (kopie z testu po sync)
│   ├── donzi-reservations-main/  ← budoucí ostrý web
│   └── {novy-salon}/             ← každý ostrý = vlastní src/admin/
│
└── api/                          ← sdílené (e-maily, SMS) — společné pro všechny
```

## Test vs. ostré

| | Test (Studio Elegance) | Ostré salóny (až budou) |
|---|------------------------|-------------------------|
| Složka | `testovani/studio-elegance` | `kadernictvi/{salon}/` |
| Doména | `kadernictvi.dweby.cz` | vlastní domény |
| Admin | `src/admin/` vlastní | `src/admin/` vlastní kopie |
| Auto-sync | **Ne** | **Ne** |

## Workflow vývoje adminu

```
1. Uprav testovani/studio-elegance/src/admin/
2. npm run dev:kadernictvi  →  localhost:8080/admin
3. Ověř na kadernictvi.dweby.cz
4. (volitelně) node scripts/sync-sablony-admin.mjs  →  aktualizuj vzory
5. Až bude hotovo → zkopíruj src/admin/ do ostrého salónu v kadernictvi/{salon}/
```

**Změna v testu se na ostré weby nepromítá sama** — to je záměr.

## 3 admin šablony (v kódu)

| `VITE_ADMIN_TEMPLATE` | Popis |
|----------------------|-------|
| `split` | Majitel (statistiky) + kadeřník (vlastní sekce) |
| `combined` | Spojené — kalendář + zákazníci + statistiky |
| `legacy` | Spojené jen pro vybrané e-maily (demo) |

Přepíná se v `sites.config.json` → `buildEnv` per doména.

## Co je sdílené

- Supabase (jedna DB, `kadernictvi_id`)
- `api/` na Vercelu (e-maily, zrušení, SMS)

## Co NENÍ sdílené

- Admin React kód (každý projekt má vlastní `src/admin/`)
- Vzhled veřejného webu (barvy, texty, fotky)
