# Supabase Auth — redirect URL (reset hesla adminu)

V **Supabase Dashboard** → **Authentication** → **URL Configuration** nastav:

| Pole | Hodnota |
|------|---------|
| **Site URL** | `https://kadernictvi.dweby.cz` (pro test; u ostrých salónů jejich doména) |

**Redirect URLs** (Add URL — každou zvlášť):

```
https://kadernictvi.dweby.cz/admin/reset-password
https://kadernictvi.dweby.cz/**
http://localhost:8080/admin/reset-password
https://donzi.dweby.cz/admin/reset-password
https://donzi.dweby.cz/**
```

Od června 2026 e-mail reset hesla posílá **přímý odkaz** na `/admin/reset-password?token_hash=…` (bez mezilehlého Supabase redirectu), takže 404 by nemělo vznikat. Redirect URLs výše jsou záloha pro PKCE (`?code=`).
