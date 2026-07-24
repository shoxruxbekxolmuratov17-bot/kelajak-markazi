import bcrypt from 'bcryptjs';
import { cacheDel, cacheGet, cacheSet } from './redis.js';
import { sendSms } from './sms.js';
import { DEFAULT_DISTRICT_ID } from './types.js';
import { dbPath } from './db.js';
import { DatabaseSync } from 'node:sqlite';

async function storeOtp(phoneNorm: string, districtId: string, code: string) {
  const hash = bcrypt.hashSync(code, 8);
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await cacheSet(`otp:${districtId}:${phoneNorm}`, hash, 300);
  try {
    const db = new DatabaseSync(dbPath());
    db.prepare(
      `INSERT INTO otp_codes (phone_norm, district_id, code_hash, expires_at, attempts)
       VALUES (?, ?, ?, ?, 0)
       ON CONFLICT(phone_norm, district_id) DO UPDATE SET
         code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0`
    ).run(phoneNorm, districtId, hash, expires);
    db.close();
  } catch {
    // ignore
  }
}

export async function requestOtp(phone: string, districtId = DEFAULT_DISTRICT_ID) {
  const phoneNorm = phone.replace(/\D/g, '');
  if (phoneNorm.length < 9) throw new Error("Telefon raqam noto'g'ri");
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await storeOtp(phoneNorm, districtId, code);
  await sendSms(phoneNorm, `Kelajak Markazi kod: ${code}`);
  const demo = process.env.DEMO_MODE === 'true';
  return { ok: true, expiresInSec: 300, ...(demo ? { demoCode: code } : {}) };
}

export async function verifyOtp(phone: string, code: string, districtId = DEFAULT_DISTRICT_ID) {
  const phoneNorm = phone.replace(/\D/g, '');
  const key = `otp:${districtId}:${phoneNorm}`;
  let hash = await cacheGet(key);
  if (!hash) {
    try {
      const db = new DatabaseSync(dbPath());
      const row = db
        .prepare(
          'SELECT code_hash, expires_at, attempts FROM otp_codes WHERE phone_norm = ? AND district_id = ?'
        )
        .get(phoneNorm, districtId) as
        | { code_hash: string; expires_at: string; attempts: number }
        | undefined;
      if (row) {
        db.prepare(
          'UPDATE otp_codes SET attempts = attempts + 1 WHERE phone_norm = ? AND district_id = ?'
        ).run(phoneNorm, districtId);
      }
      db.close();
      if (!row) return false;
      if (new Date(row.expires_at).getTime() < Date.now()) return false;
      if (row.attempts >= 5) return false;
      hash = row.code_hash;
    } catch {
      return false;
    }
  }
  const ok = bcrypt.compareSync(code, hash);
  if (ok) await cacheDel(key);
  return ok;
}
