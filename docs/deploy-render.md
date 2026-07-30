# Render — yangidan deploy (Web + API birga)

## Natija

Bitta manzil: **https://kelajak-api.onrender.com**

- Sayt: `/`, `/login`, …
- API: `/api/health`, `/api/auth/login`, …

Alohida `kelajak-markazi-1` static servis **kerak emas**.

---

## 1. GitHub Desktop — push

1. GitHub Desktop oching
2. Barcha o‘zgarishlar ko‘rinsin
3. Commit xabari masalan: `Yangi deploy: web+api birga, Render Docker`
4. **Commit to main** → **Push origin**

---

## 2. Render — eski servislarni tozalash (ixtiyoriy)

Dashboard → eski xizmatlar (`kelajak-markazi-1`, `kelajak-web`, …) → **Suspend** yoki **Delete**

Faqat **bitta** servis qoldiring yoki yangisini yarating.

---

## 3. Render — yangi / yangilangan servis

**Settings:**

| Maydon | Qiymat |
|--------|--------|
| Name | `kelajak-markazi` yoki mavjud `kelajak-api` |
| Region | Oregon |
| Branch | `main` |
| Root Directory | *(bo‘sh — repo ildizi)* |
| Runtime | **Docker** |
| Dockerfile Path | `Dockerfile` |
| Instance | Free |

**Environment Variables:**

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `SERVE_WEB` | `1` |
| `DEMO_MODE` | `false` |
| `JWT_SECRET` | uzun tasodifiy matn (min 32 belgi) |
| `CORS_ORIGIN` | `*` |

`DATABASE_URL` qo‘ymang — SQLite ishlatiladi.

**Health Check Path:** `/api/health`

**Manual Deploy** bosing. Birinchi build 5–10 daqiqa davom etishi mumkin.

---

## 4. Tekshirish

1. https://kelajak-api.onrender.com/api/health → `{"ok":true,...}`
2. https://kelajak-api.onrender.com/login → login sahifasi
3. Login: `admin` / `admin123`

---

## 5. Lokal ish (kompyuter)

```powershell
npm run dev:tunnel
```

Brauzer: **http://localhost:5173/login** (Render emas!)

---

## Muammo bo‘lsa

- **Cannot GET /login** — `SERVE_WEB=1` yo‘q yoki eski Docker image. Qayta deploy.
- **Login xato** — `JWT_SECRET` Renderda o‘rnatilganmi tekshiring.
- **Build failed** — Render **Logs** → xato qatorini o‘qing.
