# Click / Payme / SMS — ulanish qo‘llanmasi

Kod tayyor. Siz faqat **hisob ochasiz** va kalitlarni `server/.env` ga yozasiz.

> **Muhim:** Click/Payme webhook (to‘lov tasdiqi) uchun keyinroq **HTTPS URL** kerak bo‘ladi.
> Hozir kalitlarni olish mumkin; to‘liq jangovar rejim domen+VPS dan keyin.

---

## 1) Click (tavsiya — tezroq)

1. [business.click.uz](https://business.click.uz) da ro‘yxatdan o‘ting (yuridik shaxs / YaTT).
2. «Internet-do‘kon / Merchant» xizmatiga ariza yuboring.
3. Kabinetdan oling:
   - `Merchant ID`
   - `Service ID`
   - `Secret Key`
4. Webhook URL (keyinroq, hosting bor bo‘lganda):
   ```
   https://SIZNING-DOMEN/api/payments/webhooks/click
   ```
5. `server/.env` ga yozing:
   ```env
   CLICK_MERCHANT_ID=...
   CLICK_SERVICE_ID=...
   CLICK_SECRET_KEY=...
   PAYMENT_RETURN_URL=http://localhost:5173/ota-ona
   ```
6. Serverni qayta ishga tushiring. `/api/health` da `paymentsSandbox: false` bo‘lishi uchun **Click VA Payme** ikkalasi ham to‘ldirilgan bo‘lishi kerak (yoki faqat Click bilan checkout ishlaydi, health hali sandbox ko‘rsatishi mumkin).

**Narx:** ulanish odatda bepul; komissiya to‘lovdan (~0–1%).

---

## 2) Payme

1. [b2b-partner.payme.uz](https://b2b-partner.payme.uz) da ariza.
2. Merchant (e-commerce) tasdiqlangach oling:
   - `Merchant ID`
   - `Key` (secret)
3. Callback URL (keyinroq):
   ```
   https://SIZNING-DOMEN/api/payments/webhooks/payme
   ```
4. `server/.env`:
   ```env
   PAYME_MERCHANT_ID=...
   PAYME_KEY=...
   ```

**Narx:** ulanish odatda bepul; e-commerce komissiya ~1.5–2%.

---

## 3) SMS — Eskiz (tavsiya OTP uchun)

1. [eskiz.uz](https://eskiz.uz) / [notify.eskiz.uz](https://notify.eskiz.uz) — yuridik shaxs.
2. Kabinet: email + parol (API login).
3. ~100 ta test SMS bepul bo‘lishi mumkin; keyin ~95 so‘m/SMS.
4. `server/.env`:
   ```env
   SMS_PROVIDER=eskiz
   ESKIZ_EMAIL=siz@firma.uz
   ESKIZ_PASSWORD=...
   ESKIZ_FROM=4546
   ```
5. Serverni restart → `/api/health` da `smsProvider: "eskiz"`.

### Alternativa: Playmobile

```env
SMS_PROVIDER=playmobile
PLAYMOBILE_LOGIN=...
PLAYMOBILE_PASSWORD=...
PLAYMOBILE_ORIGINATOR=3700
```

---

## 4) Kalitlarni qo‘ygach tekshirish

```powershell
cd "D:\shox\kelajak markazi\server"
# .env ni to‘ldiring, keyin:
npm run start
```

Brauzerda: `http://localhost:3001/api/health`

| Maydon | Kutilgan |
|--------|----------|
| `smsProvider` | `eskiz` yoki `playmobile` |
| `paymentsSandbox` | `false` (agar Click **va** Payme to‘ldirilgan) |

Lokalda webhook ishlashi uchun vaqtincha [ngrok](https://ngrok.com) yoki Cloudflare Tunnel ishlatishingiz mumkin — lekin bu ixtiyoriy; asosiy ish ariza + kalitlar.

---

## 5) Nima kerak bo‘ladi (hujjatlar)

Odatda Click/Payme/SMS uchun:
- Yuridik shaxs yoki YaTT
- STIR / bank hisobraqami
- Direktor/vakil pasporti
- Sayt yoki ilova tavsifi (keyinroq domen)

Agar hali yuridik shaxs yo‘q — ariza kechikadi; shunda lokal **sandbox** (`DEMO_MODE=true`) bilan ishlashda davom eting.
