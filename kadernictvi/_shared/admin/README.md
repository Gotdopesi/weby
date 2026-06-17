# Sdílené admin rozhraní (`kadernictvi/_shared/admin`)

Jeden zdroj pravdy pro admin všech kadeřnictví. Salonové projekty importují přes alias `@admin`.

## Struktura

```
_shared/admin/
├── config.ts                 # VITE_ADMIN_TEMPLATE (split | combined | legacy)
├── router/
│   └── AdminApp.tsx          # Všechny /admin/* cesty
├── core/                     # Společné pro všechny šablony
│   ├── pages/                # Login, Layout, Kalendář
│   ├── components/           # Nav, kalendáře, dialogy
│   └── lib/                  # Session, role, readonly
└── templates/
    ├── combined/             # Spojené UI (kalendář + statistiky v navigaci)
    │   └── components/AdminLegacyNav.tsx
    ├── owner/                # Majitel — statistiky, CRM, výkon týmu
    │   ├── pages/
    │   ├── components/
    │   └── lib/
    └── staff/                # Kadeřník — vlastní kalendář, služby, nastavení
        ├── pages/
        ├── components/
        └── lib/
```

## 3 šablony

| `VITE_ADMIN_TEMPLATE` | Popis | Typický salón |
|----------------------|-------|----------------|
| `split` | Majitel → statistiky; kadeřník → vlastní sekce | Studio s týmem (produkce) |
| `combined` | Všichni majitelé: Kalendář / Zákazníci / Statistiky | Malý salón, solo |
| `legacy` | Jako `combined`, ale jen pro e-maily v `VITE_ADMIN_LEGACY_UI_EMAILS` | Demo účet na testu |

## Workflow změn v adminu

1. Uprav soubory v **`kadernictvi/_shared/admin/`**
2. Otestuj na **`testovani/studio-elegance`** (doména test)
3. Po ověření deploy — produkční salóny používají stejný `@admin` automaticky

## Napojení v salonu

```tsx
// src/App.tsx
import { AdminApp, isAdminPath } from "@admin/router/AdminApp";

if (isAdminPath(pathname)) return <AdminApp />;
```

```ts
// vite.config.ts
alias: {
  "@": resolve("./src"),
  "@admin": resolve("../_shared/admin"),
}
```
