# Studio Elegance — testovací sandbox

**`kadernictvi.dweby.cz` je testovací projekt**, ne ostrý web zákazníka.

## Co je kde

| Složka | Účel |
|--------|------|
| `src/admin/` | **Vlastní** admin kód (3 šablony) — upravuješ tady |
| `src/` (zbytek) | Veřejný web, rezervace |
| `kadernictvi/sablony-admin/` | Vzorové šablony pro **nové ostré** salóny (kopíruješ odtud) |

## 3 admin rozhraní (v `src/admin/templates/`)

| Šablona | Env | Popis |
|---------|-----|-------|
| `split` | `VITE_ADMIN_TEMPLATE=split` | Majitel + kadeřník (role) |
| `combined` | `combined` | Spojené — kalendář + statistiky |
| `legacy` | `legacy` | Spojené jen pro vybrané e-maily |

## Workflow

```
1. Uprav src/admin/ v tomto projektu
2. npm run dev  →  localhost:8080/admin
3. Ověř na kadernictvi.dweby.cz
4. Až bude OK → zkopíruj admin do ostrého salónu v kadernictvi/{salon}/src/admin/
   (nebo z kadernictvi/sablony-admin/ po synchronizaci)
```

**Změny v testu se na ostré weby nepromítají samy** — to je záměr.

## Lokální spuštění

```powershell
cd testovani/studio-elegance
npm install
npm run dev
```

Admin: http://localhost:8080/admin/login
