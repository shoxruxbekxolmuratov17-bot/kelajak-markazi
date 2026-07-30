# Kelajak Markazi — Qamashi tumani

Web + Mobil + API (SQLite).

## Ishga tushirish

```bash
npm install
npm run setup          # seed (SQLite)
npm run dev:tunnel     # tavsiya (telefon uchun)
```

| Servis | URL |
|--------|-----|
| Web | http://localhost:5173 |
| API | http://localhost:3001/api/health |
| Mobile | Expo Go QR |

### Demo (DEMO_MODE=true)
- `admin` / `admin123`
- `komil.e` / `teacher123`
- Ota-ona: `+998 90 111 22 33` · PIN `1234`

Production: `DEMO_MODE=false` va `VITE_DEMO_MODE=false`, JWT_SECRET ni o'zgartiring.

## Render (internetda)

Bitta servis — web + API: **https://kelajak-api.onrender.com**

Batafsil: [docs/deploy-render.md](docs/deploy-render.md)

```text
GitHub Desktop → Push → Render Manual Deploy (Docker, SERVE_WEB=1)
```

## Yechilgan muammolar
- SQLite DB + backups (`server/data/`)
- Route himoya (admin sahifalar)
- Ota-ona PIN
- Mobil JWT AsyncStorage + LAN API URL avto
- Mobil o'quvchi/to'garak qo'shish
- Xabar yuborish
- Jadval/dashboard jonli ma'lumot
- Offline navbat (web)
- Maxfiylik: `/maxfiylik`
- EAS package ID tayyor (`projectId` ni `eas init` dan qo'ying)

## Play Store
```bash
cd mobile
npx eas login
npx eas init
npx eas build -p android --profile preview
```
