# Nový barbershop — playbook

Jakmile přidáš novou složku do `kadernictvi` a napíšeš co chceš, agent udělá kompletní web + backend jako u **Studio Elegance** a **Donzi**.

## Co ty dodáš (jedna zpráva stačí)

| Položka | Příklad |
|--------|---------|
| Název salonu | Barber Shop XY |
| Slug (do DB) | `barber-xy-praha` |
| Město, adresa, telefon, e-mail | … |
| Otevírací doba | Po–Pá 9–18 … |
| **Ceník** | název, cena (Kč), minuty, volitelně kategorie |
| **GitHub repo** | `Gotdopesi/barber-xy` (nový, prázdný nebo ho agent vytvoří) |
| **Admin e-mail** | vas.web@dweby.cz |
| **Vzhled** | logo, fotky, barvy (hex), případně odkaz na inspiraci |

Volitelně: texty (O nás, hero), sociální sítě, mapa.

## Co udělá agent

1. Zkopíruje projekt z `donzi-reservations-main` (aktuální šablona).
2. Předělá **celý frontend** (design, sekce, assety).
3. Nastaví **služby** v kódu + SQL v Supabase.
4. Vloží nový salon do DB → dostaneš **`VITE_BARBERSHOP_ID`**.
5. Propojí admin účet (`kadernictvi_admini`).
6. Ověří build, pushne na **nový GitHub repo**.

## Co uděláš ty potom (cca 10 min)

1. **Vercel** → Import GitHub repo → deploy.
2. **Environment variables** (stejné jako Donzi/Elegance):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BARBERSHOP_ID` (= nové ID)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`, `RESEND_FROM`, `BULKGATE_*`, `CRON_SECRET`
3. V Supabase Auth povolit stejné redirect URL jako u ostatních webů (pokud nová doména).

Hotovo — rezervace, admin, e-maily a SMS fungují na stejné infrastruktuře.

---

## Přístupy — co už máš a co stačí

| Přístup | Stav | K čemu |
|--------|------|--------|
| Supabase CLI přihlášená | ano | SQL, nový salon, služby, admin |
| Projekt `hnkcjrvqbeojegujuuyw` propojený | ano | jedna DB pro všechny salony |
| Klíče v Elegance `.env.local` | ano | agent zkopíruje do nového projektu |
| GitHub CLI (`gh auth`) | potřeba pro **nový repo + push** | jednou `gh auth login` |
| Supabase MCP v Cursoru | volitelné | bonus; CLI stačí |
| `DATABASE_URL` | **nepotřebné** | pokud funguje `npx supabase db query --linked` |

**Nové heslo k DB nebo ruční SQL Editor nepotřebuješ**, pokud CLI zůstane přihlášená.

---

## Cursor — méně potvrzování

Úplně bez potvrzení to nejde (bezpečnost), ale můžeš maximalizovat automatiku:

1. **Cursor Settings → Agents** (nebo Features):
   - zapni **auto-run** / spouštění příkazů bez dotazu (podle verze „YOLO“ nebo command allowlist),
   - přidej allowlist: `npm`, `git`, `npx`, `gh`, `node`.
2. Při dotazu na oprávnění zvol **Allow for session** nebo **Always allow** pro workspace `kadernictvi`.
3. Nech zapnutý **Supabase MCP** (přihlášení jednou v prohlížeči).

Agent stejně nebude force-pushovat, mazat produkční data bez explicitního pokynu ani commitovat `.env` s tajnými klíči.

---

## Reference projekty

| Salon | Složka | `VITE_BARBERSHOP_ID` | Repo |
|-------|--------|----------------------|------|
| Studio Elegance | `elegance-studio-showcase-main-tmp` / Desktop | 1–2 | elegance |
| Donzi | `donzi-reservations-main` | **5** | `Gotdopesi/donzi_dobruska` |

Nový salon = nová složka + nové ID + nový Git repo + vlastní design.

---

## Šablona první zprávy (zkopíruj a vyplň)

```
Nový salon ve kadernictvi:
- Složka: nazev-projektu-main
- Název: ...
- Slug: ...
- Město/adresa/kontakt: ...
- Otevírací doba: ...
- Služby: (seznam)
- Repo GitHub: Gotdopesi/...
- Admin email: ...
- Design: (barvy, logo, popis vzhledu)
```
