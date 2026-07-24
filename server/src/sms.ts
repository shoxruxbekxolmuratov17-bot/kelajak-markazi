import { config } from './config.js';
import { logJson } from './metrics.js';

/**
 * SMS gateway interface.
 * - stub: logs only (default)
 * - eskiz / playmobile: real HTTP when credentials in env
 */
export async function sendSms(phone: string, text: string) {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('998') ? digits : `998${digits.slice(-9)}`;

  if (config.smsProvider === 'stub') {
    logJson('info', 'sms_stub', { phone: normalized, text });
    return { ok: true, provider: 'stub' as const };
  }

  if (config.smsProvider === 'eskiz') {
    const email = process.env.ESKIZ_EMAIL;
    const password = process.env.ESKIZ_PASSWORD;
    if (!email || !password) {
      logJson('warn', 'sms_eskiz_missing_creds', { phone: normalized });
      return { ok: false, provider: 'eskiz' as const, error: 'ESKIZ_EMAIL/PASSWORD kerak' };
    }
    try {
      const tokenRes = await fetch('https://notify.eskiz.uz/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const tokenJson = (await tokenRes.json()) as { data?: { token?: string } };
      const token = tokenJson.data?.token;
      if (!token) throw new Error('Eskiz token yo‘q');
      const sendRes = await fetch('https://notify.eskiz.uz/api/message/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobile_phone: normalized,
          message: text,
          from: process.env.ESKIZ_FROM || '4546',
        }),
      });
      if (!sendRes.ok) throw new Error(`Eskiz HTTP ${sendRes.status}`);
      logJson('info', 'sms_eskiz_sent', { phone: normalized });
      return { ok: true, provider: 'eskiz' as const };
    } catch (e) {
      logJson('error', 'sms_eskiz_failed', { error: String(e) });
      return { ok: false, provider: 'eskiz' as const, error: String(e) };
    }
  }

  if (config.smsProvider === 'playmobile') {
    const login = process.env.PLAYMOBILE_LOGIN;
    const password = process.env.PLAYMOBILE_PASSWORD;
    if (!login || !password) {
      logJson('warn', 'sms_playmobile_missing_creds', { phone: normalized });
      return { ok: false, provider: 'playmobile' as const, error: 'PLAYMOBILE_LOGIN/PASSWORD kerak' };
    }
    try {
      const auth = Buffer.from(`${login}:${password}`).toString('base64');
      const sendRes = await fetch(
        process.env.PLAYMOBILE_URL || 'https://send.smsxabar.uz/broker-api/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            messages: [
              {
                recipient: normalized,
                'message-id': `km-${Date.now()}`,
                sms: { originator: process.env.PLAYMOBILE_ORIGINATOR || '3700', content: { text } },
              },
            ],
          }),
        }
      );
      if (!sendRes.ok) throw new Error(`Playmobile HTTP ${sendRes.status}`);
      logJson('info', 'sms_playmobile_sent', { phone: normalized });
      return { ok: true, provider: 'playmobile' as const };
    } catch (e) {
      logJson('error', 'sms_playmobile_failed', { error: String(e) });
      return { ok: false, provider: 'playmobile' as const, error: String(e) };
    }
  }

  logJson('warn', 'sms_provider_unknown', { provider: config.smsProvider });
  return { ok: false, provider: config.smsProvider };
}
