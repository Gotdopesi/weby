# Supabase — tabulky `kadernictvi_*`

| Tabulka | Účel |
|---------|------|
| `kadernictvi` | Salony (id, slug, SMS ceny) |
| `kadernictvi_admini` | Auth uživatelé — majitel / kadeřník |
| `kadernictvi_pracovnici` | Tým, rozvrh, fotky URL |
| `kadernictvi_sluzby` | Ceník |
| `kadernictvi_pracovnik_sluzby` | Kdo jaké služby nabízí |
| `kadernictvi_rezervace` | Rezervace |
| `kadernictvi_pracovnik_blokace` | Blokované termíny |
| `kadernictvi_zakaznici` | Zákazníci |
| `kadernictvi_sms` | SMS vyúčtování (sloupec `pracovnik_id`) |
| `kadernictvi_trzby` / `kadernictvi_vydelky` | Statistiky |

Sloupce: **`kadernictvi_id`**, **`pracovnik_id`**.

## Pořadí (nová DB)

1. `showcase_schema.sql` nebo `kadernictvi_schema.sql` — základ
2. `showcase_admin_roles.sql` — role adminů
3. `studio_elegance_team.sql` — tým + rozvrh + služby

## Migrace ze starých `showcase_*`

Jednorázově: `kadernictvi_prenest.sql` (už aplikováno v produkční DB).
