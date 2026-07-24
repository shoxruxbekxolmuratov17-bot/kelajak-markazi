import { createHash } from 'node:crypto';
import { config } from './config.js';
import { addPaymentEvent, loadDb, updatePaymentStatus } from './db.js';
import { bumpMetric } from './metrics.js';

export function uid(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function createPaymentIntent(paymentId: string, provider: 'click' | 'payme') {
  const db = loadDb();
  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error("To'lov topilmadi");
  if (payment.status === 'paid') throw new Error("To'lov allaqachon qabul qilingan");

  const amount = payment.amount;
  if (provider === 'click') {
    const merchantId = config.click.merchantId || 'SANDBOX';
    const serviceId = config.click.serviceId || '0';
    const returnUrl = encodeURIComponent(process.env.PAYMENT_RETURN_URL || 'http://localhost:5173/ota-ona');
    const url =
      config.click.merchantId
        ? `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${paymentId}&return_url=${returnUrl}`
        : null;
    return {
      paymentId,
      provider,
      amount,
      sandbox: !config.click.merchantId,
      checkoutUrl: url,
      message: url
        ? 'Click orqali to\'lang'
        : 'Sandbox: webhook yoki /api/payments/sandbox/complete orqali tasdiqlang',
    };
  }

  const merchantId = config.payme.merchantId || 'SANDBOX';
  const params = Buffer.from(
    JSON.stringify({ m: merchantId, ac: { payment_id: paymentId }, a: amount * 100 })
  ).toString('base64');
  const url = config.payme.merchantId ? `https://checkout.paycom.uz/${params}` : null;
  return {
    paymentId,
    provider,
    amount,
    sandbox: !config.payme.merchantId,
    checkoutUrl: url,
    message: url
      ? 'Payme orqali to\'lang'
      : 'Sandbox: webhook yoki /api/payments/sandbox/complete orqali tasdiqlang',
  };
}

export function markPaidFromProvider(
  paymentId: string,
  provider: string,
  providerTxn: string,
  raw: unknown
) {
  updatePaymentStatus(paymentId, 'paid', {
    paidAt: new Date().toISOString().slice(0, 10),
    provider,
    providerTxn,
  });
  addPaymentEvent({
    id: uid('pe'),
    paymentId,
    provider,
    eventType: 'paid',
    payload: raw,
  });
  bumpMetric('paymentsPaid');
}

/** Click Prepare/Complete style simplified handler */
export function handleClickWebhook(body: Record<string, unknown>) {
  const action = Number(body.action);
  const paymentId = String(body.merchant_trans_id || body.transaction_param || '');
  const clickTransId = String(body.click_trans_id || uid('click'));
  if (!paymentId) return { error: -5, error_note: 'payment not found' };

  const payment = loadDb().payments.find((p) => p.id === paymentId);
  if (!payment) return { error: -5, error_note: 'payment not found' };

  if (action === 0) {
    // Prepare
    return {
      click_trans_id: clickTransId,
      merchant_trans_id: paymentId,
      merchant_prepare_id: Date.now(),
      error: 0,
      error_note: 'Success',
    };
  }
  if (action === 1) {
    markPaidFromProvider(paymentId, 'click', clickTransId, body);
    return {
      click_trans_id: clickTransId,
      merchant_trans_id: paymentId,
      merchant_confirm_id: Date.now(),
      error: 0,
      error_note: 'Success',
    };
  }
  return { error: -3, error_note: 'invalid action' };
}

/** Payme JSON-RPC simplified */
export function handlePaymeWebhook(body: {
  method?: string;
  params?: Record<string, unknown>;
  id?: number;
}) {
  const method = body.method;
  const id = body.id ?? 0;
  const params = body.params || {};

  if (method === 'CheckPerformTransaction') {
    const account = params.account as { payment_id?: string } | undefined;
    const payment = loadDb().payments.find((p) => p.id === account?.payment_id);
    if (!payment || payment.status === 'paid') {
      return { jsonrpc: '2.0', id, error: { code: -31050, message: 'Payment not available' } };
    }
    return { jsonrpc: '2.0', id, result: { allow: true } };
  }

  if (method === 'CreateTransaction' || method === 'PerformTransaction') {
    const account = params.account as { payment_id?: string } | undefined;
    const paymentId = account?.payment_id || '';
    const paymeId = String(params.id || uid('payme'));
    const payment = loadDb().payments.find((p) => p.id === paymentId);
    if (!payment) {
      return { jsonrpc: '2.0', id, error: { code: -31050, message: 'Not found' } };
    }
    if (method === 'PerformTransaction') {
      markPaidFromProvider(paymentId, 'payme', paymeId, body);
    }
    return {
      jsonrpc: '2.0',
      id,
      result: {
        create_time: Date.now(),
        perform_time: Date.now(),
        transaction: paymeId,
        state: method === 'PerformTransaction' ? 2 : 1,
      },
    };
  }

  if (method === 'CheckTransaction') {
    return {
      jsonrpc: '2.0',
      id,
      result: { create_time: Date.now(), perform_time: Date.now(), cancel_time: 0, transaction: '0', state: 2, reason: null },
    };
  }

  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } };
}

export function verifyPaymeAuth(authHeader?: string) {
  if (!config.payme.key) return true; // sandbox
  if (!authHeader?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  return decoded.includes(config.payme.key);
}

export function clickSignOk(body: Record<string, unknown>) {
  if (!config.click.secretKey) return true;
  const signString = [
    body.click_trans_id,
    body.service_id,
    config.click.secretKey,
    body.merchant_trans_id,
    body.amount,
    body.action,
    body.sign_time,
  ].join('');
  const dig = createHash('md5').update(signString).digest('hex');
  return dig === body.sign_string;
}
