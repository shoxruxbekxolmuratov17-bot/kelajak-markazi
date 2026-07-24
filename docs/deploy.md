# Deploy / production runbook

## Current local stack (ready)

- API on port 3001
- Default DB: SQLite relational tables
- With Docker + env: Postgres + Redis
- Payments: sandbox if Click/Payme keys are empty
- SMS: stub unless `SMS_PROVIDER` + credentials set

## Go public — what YOU must provide

These cannot be completed from code alone:

1. **Domain** (e.g. `kelajak.uz` + `api.kelajak.uz`)
2. **VPS / cloud server** (Linux, 2GB+ RAM recommended)
3. **HTTPS certificates** (Let's Encrypt / Cloudflare)
4. Optional for real money/SMS:
   - Click merchant ID + secret
   - Payme merchant ID + key
   - Eskiz or Playmobile SMS credentials

## Deploy sequence (after VPS + domain exist)

1. Install Docker + Node on the VPS
2. Copy project, create `server/.env.production` from the example
3. Set strong `JWT_SECRET`, `DEMO_MODE=false`, real `CORS_ORIGIN`
4. `docker compose -f docker-compose.prod.yml up -d`
5. `npm run seed` once (or migrate from SQLite backup)
6. Put Nginx/Caddy in front of API + built Vite `dist/`
7. Point DNS A records to the VPS
8. Build mobile with production profile (`eas build --profile production`)

## Backup

```bash
cd server
npm run backup          # JSON snapshot
npm run backup:pg       # pg_dump when using Postgres
```

See also `docs/ops.md`.
