# Admin lokálně — Studio Elegance showcase

## 1. Příprava (jednorázově)

```powershell
cd C:\Users\Dominik\Desktop\Weby\kadernictvi\elegance-studio-showcase-main-tmp
npm install
```

Zkopíruj `.env.example` → `.env.local` a doplň:

```env
VITE_SUPABASE_URL=https://hnkcjrvqbeojegujuuyw.supabase.co
VITE_SUPABASE_ANON_KEY=...   # anon klíč z Supabase → Settings → API
VITE_BARBERSHOP_ID=1
```

(Volitelně pro API e-mailů lokálně: `vercel dev` v kořeni monorepa `Weby` — jinak rezervace uloží, mail nemusí jít.)

## 2. SQL v Supabase (pořadí)

V **SQL Editor** spusť:

1. `supabase/kadernictvi_pracovnici.sql` — tým + `pracovnik_id` na rezervacích
2. `supabase/kadernictvi_pracovnici_schedule.sql` — pracovní rozvrh kadeřníků (statistiky majitele)
3. `supabase/showcase_admin_roles.sql` — role `owner` / `staff`

## 3. Účty v Supabase Auth

**Supabase → Authentication → Users → Add user**

| Účel | role v DB | pracovnik_id |
|------|-----------|----------|
| Majitel salónu | `owner` | `NULL` |
| Kadeřník Monika | `staff` | ID z `kadernictvi_pracovnici` |

Propojení (nahraď `UUID` z Auth):

```sql
-- Majitel (pokud ještě není v kadernictvi_admini)
INSERT INTO kadernictvi_admini (kadernictvi_id, user_id, login_label, role)
SELECT id, 'UUID-MAJITELE'::uuid, 'majitel', 'owner'
FROM kadernictvi WHERE slug = 'studio-elegance'
ON CONFLICT (user_id) DO UPDATE SET role = 'owner', pracovnik_id = NULL;

-- Kadeřník
INSERT INTO kadernictvi_admini (kadernictvi_id, user_id, login_label, role, pracovnik_id)
SELECT b.id, 'UUID-KADERNIKA'::uuid, 'monika', 'staff', s.id
FROM kadernictvi b
JOIN kadernictvi_pracovnici s ON s.kadernictvi_id = b.id AND s.first_name = 'Monika'
WHERE b.slug = 'studio-elegance'
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  pracovnik_id = EXCLUDED.pracovnik_id;
```

## 4. Spuštění webu

```powershell
npm run dev
```

Otevři v prohlížeči:

| Co | URL |
|----|-----|
| **Veřejný web** | http://localhost:8080/ |
| **Admin přihlášení** | http://localhost:8080/admin/login |
| **Kalendář** (po login) | http://localhost:8080/admin |
| **Zákazníci** (jen majitel) | http://localhost:8080/admin/zakaznici |
| **Statistiky** (jen majitel) | http://localhost:8080/admin/statistiky |

Port **8080** je v `vite.config.ts` — pokud je obsazený, Vite vypíše jiný (např. 8081).

## 5. Co uvidíš podle role

| Sekce | Majitel (`owner`) | Kadeřník (`staff`) |
|-------|-------------------|---------------------|
| Kalendář | Všechny rezervace salónu | Jen rezervace s jeho `pracovnik_id` |
| Zákazníci | Ano | Skryto (přesměruje na kalendář) |
| Statistiky | Ano | Skryto |

Stejný `kadernictvi_id` (Elegance = 1), jiný login → jiná data v kalendáři.

## 6. Časté problémy

- **Prázdný kalendář** — účet není v `kadernictvi_admini` nebo špatný `kadernictvi_id`.
- **Staff nevidí rezervace** — rezervace musí mít `pracovnik_id` = jeho ID (z webu při výběru kadeřníka).
- **RLS chyba** — znovu spusť `showcase_admin_roles.sql`.
