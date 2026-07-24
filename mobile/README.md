# Kelajak Markazi — Mobil ilova (Expo Go)

Qamashi tumani Kelajak Markazi uchun Expo Go orqali ishlaydigan mobil ilova.

## Talablar

- [Node.js](https://nodejs.org/) 18+
- Telefonda [Expo Go](https://expo.dev/go) ilovasi (Android yoki iOS)
- **Expo Go SDK 54** — Play Store dagi Expo Go bilan mos keladi
- Kompyuter va telefon **bir xil Wi-Fi** tarmog'ida (yoki tunnel rejimi)

## Ishga tushirish

Asosiy papkadan **web + mobil** bir vaqtda:

```bash
cd ..
npm run dev
```

Faqat mobil (tunnel, tablet uchun):

```bash
npm install
npm run start:tunnel
```

Faqat mobil (LAN):

```bash
npm start
```

Agar `Port 8081 is being used` xatosi chiqsa — avvalgi serverni to'xtating (`Ctrl+C`) yoki:
```bash
npx expo start --go --port 8082
```

**QR kod ko'rinmasa:** Terminalda `exp://172.x.x.x:8087` kabi manzil chiqadi — Expo Go da "Enter URL" orqali kiriting. Yoki:
```bash
npm run dev:tunnel
```

Wi-Fi ishlamasa:
```bash
npm run start:tunnel
```

Terminalda QR kod chiqadi.

## Expo Go bilan ulanish

### Android
1. Expo Go ilovasini oching
2. **Scan QR code** tugmasini bosing
3. Terminaldagi QR kodni skanerlang

### iPhone
1. Kamera ilovasini oching
2. QR kodni skanerlang
3. "Open in Expo Go" havolasini bosing

## Demo hisoblar

| Rol | Login | Parol |
|-----|-------|-------|
| Direktor | `admin` | `admin123` |
| Murabbiy | `komil.e` | `teacher123` |
| Ota-ona | `+998 90 111 22 33` | — |

## Mobil funksiyalar

- **Pastki navigatsiya:** Panel, To'garaklar, O'quvchilar, Xabarlar, Profil
- **Profil bo'limi:** Jadval, To'lovlar, Laboratoriya, Sozlamalar va boshqalar
- **Qorong'u rejim:** Profil → toggle
- **Ota-ona portali:** alohida interfeys

## Muammo bo'lsa

### "Incompatible SDK version" / "Project is incompatible with Expo Go"
Loyiha **Expo SDK 54** da ishlaydi (Play Store Expo Go bilan mos).
1. Play Store dan **Expo Go** ni yangilang
2. Serverni qayta ishga tushiring: `npm run start:tunnel`
3. Yangi QR kodni skanerlang

### "Failed to download remote update" (tarmoq xatosi)
Bu xato tablet kompyuterga ulanolmaganda chiqadi. **Tunnel rejimini** ishlating:

```bash
npm run start:tunnel
```

Yangi QR kodni skanerlang. Tunnel rejimi Wi-Fi dan qat'iy nazar ishlaydi.

Agar LAN rejimida ishlatmoqchi bo'lsangiz:
- Kompyuter va tablet **bir xil Wi-Fi** da bo'lishi kerak
- Windows Firewall da Node.js uchun ruxsat bering (8081-8090 portlar)
- Terminalda `exp://172.x.x.x:8082` manzili tablet tarmog'ida ochilishi kerak

### Boshqa xatolar

- **"Something went wrong" (ko'k ekran):** cache tozalab qayta ishga tushiring:
  ```bash
  npm run start:clear
  ```
- Expo Go ilovasi yangilangan bo'lishi kerak (SDK 57)
- **`w` tugmasini bosingmang** — bu web rejimini ochadi; faqat QR kod + Expo Go ishlating

## Texnik eslatma

Mobil ilova ma'lumotlari `mobile/src/shared/` papkasida saqlanadi (web bilan bir xil demo ma'lumotlar).

## Web versiya

Kompyuter uchun web ilova asosiy papkada:

```bash
cd ..
npm run dev
```
