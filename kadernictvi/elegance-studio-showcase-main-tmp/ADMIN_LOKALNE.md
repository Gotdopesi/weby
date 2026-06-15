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

1. `supabase/showcase_staff.sql` — tým + `staff_id` na rezervacích
2. `supabase/showcase_staff_schedule.sql` — pracovní rozvrh kadeřníků (statistiky majitele)
3. `supabase/showcase_admin_roles.sql` — role `owner` / `staff`

## 3. Účty v Supabase Auth

**Supabase → Authentication → Users → Add user**

| Účel | role v DB | staff_id |
|------|-----------|----------|
| Majitel salónu | `owner` | `NULL` |
| Kadeřník Monika | `staff` | ID z `showcase_staff` |

Propojení (nahraď `UUID` z Auth):

```sql
-- Majitel (pokud ještě není v showcase_barbershop_admins)
INSERT INTO showcase_barbershop_admins (barbershop_id, user_id, login_label, role)
SELECT id, 'UUID-MAJITELE'::uuid, 'majitel', 'owner'
FROM showcase_barbershops WHERE slug = 'studio-elegance'
ON CONFLICT (user_id) DO UPDATE SET role = 'owner', staff_id = NULL;

-- Kadeřník
INSERT INTO showcase_barbershop_admins (barbershop_id, user_id, login_label, role, staff_id)
SELECT b.id, 'UUID-KADERNIKA'::uuid, 'monika', 'staff', s.id
FROM showcase_barbershops b
JOIN showcase_staff s ON s.barbershop_id = b.id AND s.first_name = 'Monika'
WHERE b.slug = 'studio-elegance'
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  staff_id = EXCLUDED.staff_id;
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
| Kalendář | Všechny rezervace salónu | Jen rezervace s jeho `staff_id` |
| Zákazníci | Ano | Skryto (přesměruje na kalendář) |
| Statistiky | Ano | Skryto |

Stejný `barbershop_id` (Elegance = 1), jiný login → jiná data v kalendáři.

## 6. Časté problémy

- **Prázdný kalendář** — účet není v `showcase_barbershop_admins` nebo špatný `barbershop_id`.
- **Staff nevidí rezervace** — rezervace musí mít `staff_id` = jeho ID (z webu při výběru kadeřníka).
- **RLS chyba** — znovu spusť `showcase_admin_roles.sql`.
