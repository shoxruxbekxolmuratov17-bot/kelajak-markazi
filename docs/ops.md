# Kelajak Markazi — Operations

## Stack

- API: Express (`server/`)
- DB: **SQLite relational** (default) yoki **Postgres** (`DATABASE_URL`)
- Cache/queue: **Redis** (`REDIS_URL`) yoki memory fallback
- Clients: Vite web + Expo mobile

## Quick start

```bash
# 1) Infra (ixtiyoriy, lekin tavsiya)
docker compose up -d

# 2) Env
cp server/.env.example server/.env
# DATABASE_URL va REDIS_URL ni oching (Docker ishlaganda)

# 3) API
cd server
npm install
npm run seed
npm run start
```

`GET /api/health` → `db: postgres|sqlite-relational`, `cache: redis|memory`.

## Environment

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Prod da majburiy kuchli secret |
| `DEMO_MODE` | Prod da default `false`; faqat demo uchun `true` |
| `NODE_ENV=production` | JWT secret majburiyati |
| `DATABASE_URL` | Postgres; bo‘sh = SQLite |
| `REDIS_URL` | Rate-limit / OTP / queue; bo‘sh = memory |
| `SMS_PROVIDER` | `stub` \| `eskiz` \| `playmobile` |
| `ESKIZ_*` / `PLAYMOBILE_*` | SMS kalitlari |
| `CLICK_*` / `PAYME_*` | To‘lov; bo‘sh = sandbox |

## Backup / DR

```bash
cd server
npm run backup          # JSON snapshot → data/backups/
npm run backup:pg       # pg_dump (Postgres rejimida)
```

## Payments

1. `POST /api/payments/intent`
2. Click/Payme redirect (kalitlar bo‘lsa)
3. Webhooks: `/api/payments/webhooks/click|payme`
4. Sandbox: `/api/payments/sandbox/complete`

Ota-ona `paid` ni o‘zi qo‘ymaydi — faqat server/webhook.

## Multi-tenant

- Seed: `d-qamashi`, `d-kitob`
- Rollar: `superadmin`, `district_admin`, `admin`, `teacher`, `parent`
- Superadmin UI: Header da tuman tanlash → `X-District-Id`
- Demo: `superadmin`/`super123`, `admin`/`admin123`

## Repo layer

- `server/src/repo/` — entity CRUD (circles/students/payments)
- Murakkab tranzaksiyalar hali `mutate` (enrollment)
- Postgres yozuvlari async queue + `flushDb()` shutdown da

## Worker

```bash
cd server && npm run worker
```

## Health / metrics / load

- `GET /api/health`
- `GET /api/metrics`
- `npm run load:smoke` (root)
