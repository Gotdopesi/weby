# Studio Elegance — testovací instance

Stejný veřejný web jako produkce (`kadernictvi/studio-elegance`), ale **jiná admin šablona** přes `sites.config.json` → `buildEnv`.

## Účel

- Zkoušet změny v `kadernictvi/_shared/admin/` bez rizika pro celou síť salónů
- Demo účet `chci.web@dweby.cz` — spojené admin UI (kalendář + statistiky)

## Build

Vite `root` ukazuje na `../../kadernictvi/studio-elegance` — **nekopíruje** zdroják salonu, jen jiné env při buildu.

## Produkce vs. test

| | Produkce | Test |
|---|----------|------|
| Složka | `kadernictvi/studio-elegance` | `testovani/studio-elegance` |
| Doména | `kadernictvi.dweby.cz` | `test.kadernictvi.dweby.cz` |
| Admin šablona | `split` (majitel + kadeřník) | `legacy` (spojené UI pro demo) |

## Workflow

1. Uprav `kadernictvi/_shared/admin/`
2. Push → Vercel buildne test i produkci
3. Ověř na `test.kadernictvi.dweby.cz/admin`
4. Až je to OK, produkce má stejný kód automaticky
