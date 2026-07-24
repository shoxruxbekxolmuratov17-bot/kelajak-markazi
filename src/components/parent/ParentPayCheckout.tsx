import { useEffect, useState } from 'react';
import { Button, Input, Modal } from '../ui';
import { MONTHLY_FEE } from '../../types';
import type { Payment, Student } from '../../types';

function formatMoney(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
}

export type PayProvider = 'click' | 'payme';

type Step = 'details' | 'provider' | 'gateway' | 'success';

interface Props {
  open: boolean;
  onClose: () => void;
  payment: Payment;
  student: Student;
  parentPhone: string;
  onSuccess: (info: {
    provider: PayProvider;
    amount: number;
    transactionId: string;
    phone: string;
  }) => void;
}

/**
 * Click / Payme to'lov oynasi.
 * Forma avtomatik: F.I.Sh, sinf, to'garak, summa (61800).
 * Merchant kalitlari .env orqali ulanganda haqiqiy gatewayga yo'naltiriladi.
 */
export function ParentPayCheckout({
  open,
  onClose,
  payment,
  student,
  parentPhone,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>('details');
  const [provider, setProvider] = useState<PayProvider | null>(null);
  const [payPhone, setPayPhone] = useState(parentPhone);
  const [processing, setProcessing] = useState(false);
  const [txId, setTxId] = useState('');

  const amount = payment.amount || MONTHLY_FEE;
  const fullName = `${student.firstName} ${student.lastName}`;

  useEffect(() => {
    if (open) {
      setStep('details');
      setProvider(null);
      setPayPhone(parentPhone);
      setProcessing(false);
      setTxId('');
    }
  }, [open, parentPhone, payment.id]);

  const clickServiceId = import.meta.env.VITE_CLICK_SERVICE_ID as string | undefined;
  const clickMerchantId = import.meta.env.VITE_CLICK_MERCHANT_ID as string | undefined;
  const paymeMerchant = import.meta.env.VITE_PAYME_MERCHANT_ID as string | undefined;

  const openExternalGateway = (p: PayProvider) => {
    const returnUrl = encodeURIComponent(window.location.origin + '/ota-ona#tolovlar');
    if (p === 'click' && clickServiceId && clickMerchantId) {
      const url =
        `https://my.click.uz/services/pay?service_id=${clickServiceId}` +
        `&merchant_id=${clickMerchantId}` +
        `&amount=${amount}` +
        `&transaction_param=${payment.id}` +
        `&return_url=${returnUrl}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }
    if (p === 'payme' && paymeMerchant) {
      // Payme checkout: amount in tiyin
      const amountTiyin = amount * 100;
      const url =
        `https://checkout.paycom.uz/${btoa(JSON.stringify({
          m: paymeMerchant,
          ac: { payment_id: payment.id },
          a: amountTiyin,
          c: window.location.origin + '/ota-ona#tolovlar',
        }))}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }
    return false;
  };

  const startGateway = (p: PayProvider) => {
    setProvider(p);
    const opened = openExternalGateway(p);
    if (opened) {
      // Tashqi gateway ochildi — ichki tasdiq bosqichi ham qoladi (callback kelguncha)
      setStep('gateway');
    } else {
      setStep('gateway');
    }
  };

  const confirmPay = async () => {
    if (!provider || !payPhone.trim()) return;
    setProcessing(true);
    try {
      const { api } = await import('../../api/client');
      const intent = await api.paymentIntent(payment.id, provider);
      if (intent.checkoutUrl) {
        window.open(intent.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
      // Sandbox yoki webhook kutish: server tasdig'i
      const done = await api.sandboxCompletePayment(payment.id, provider);
      const id = done.payment?.providerTxn || `${provider.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      setTxId(id);
      setStep('success');
      onSuccess({
        provider,
        amount,
        transactionId: id,
        phone: payPhone.trim(),
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "To'lov xatosi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={() => !processing && onClose()} title="Onlayn to‘lov" size="md">
      {step === 'details' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            To‘lov ma’lumotlari avtomatik to‘ldirilgan. Tekshirib, Click yoki Payme ni tanlang.
          </p>
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden text-sm">
            <Row label="O‘quvchi (F.I.Sh.)" value={fullName} />
            <Row label="Sinf / maktab" value={`${student.grade}-sinf · ${student.school}`} />
            <Row label="To‘garak" value={payment.circleName} />
            <Row label="Oy" value={payment.month} />
            <Row label="Summa" value={formatMoney(amount)} strong />
          </div>
          <Button className="w-full" onClick={() => setStep('provider')}>
            To‘lash — {formatMoney(amount)}
          </Button>
        </div>
      )}

      {step === 'provider' && (
        <div className="space-y-3">
          <p className="text-sm text-muted mb-1">To‘lov tizimini tanlang</p>
          <button
            type="button"
            onClick={() => startGateway('click')}
            className="w-full p-4 rounded-xl border-2 border-[#00A6FF]/40 bg-[#00A6FF]/10 hover:border-[#00A6FF] text-left transition-colors"
          >
            <p className="font-bold text-[#0077CC] text-lg">Click</p>
            <p className="text-xs text-muted mt-1">Click ilovasi yoki SMS orqali to‘lov</p>
          </button>
          <button
            type="button"
            onClick={() => startGateway('payme')}
            className="w-full p-4 rounded-xl border-2 border-[#14B8A6]/40 bg-[#14B8A6]/10 hover:border-[#14B8A6] text-left transition-colors"
          >
            <p className="font-bold text-[#0D9488] text-lg">Payme</p>
            <p className="text-xs text-muted mt-1">Payme ilovasi yoki karta orqali to‘lov</p>
          </button>
          <Button variant="secondary" className="w-full" onClick={() => setStep('details')}>
            Orqaga
          </Button>
        </div>
      )}

      {step === 'gateway' && provider && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl text-white ${
              provider === 'click' ? 'bg-[#00A6FF]' : 'bg-[#14B8A6]'
            }`}
          >
            <p className="text-sm opacity-90">{provider === 'click' ? 'Click' : 'Payme'} to‘lov</p>
            <p className="text-2xl font-bold mt-1">{formatMoney(amount)}</p>
            <p className="text-xs opacity-90 mt-2">
              {fullName} · {payment.circleName} · {student.grade}-sinf
            </p>
          </div>
          <Input
            label="Telefon (to‘lov hisobi)"
            value={payPhone}
            onChange={setPayPhone}
            placeholder="+998 90 xxx xx xx"
          />
          <p className="text-xs text-muted">
            {clickServiceId || paymeMerchant
              ? 'Tashqi to‘lov sahifasi ochilgan bo‘lishi mumkin. To‘lovni yakunlagach tasdiqlang.'
              : 'Merchant kalitlari sozlanmagan — to‘lov markaz ichida tasdiqlanadi. Keyinroq Click/Payme kalitlari ulanadi.'}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" disabled={processing} onClick={() => setStep('provider')}>
              Orqaga
            </Button>
            <Button className="flex-1" disabled={processing || !payPhone.trim()} onClick={confirmPay}>
              {processing ? 'Tekshirilmoqda...' : 'To‘lovni tasdiqlash'}
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center space-y-3 py-2">
          <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h3 className="font-bold text-dark text-lg">To‘lov qabul qilindi</h3>
          <p className="text-sm text-muted">
            {formatMoney(amount)} · {provider?.toUpperCase()} · {txId}
          </p>
          <p className="text-xs text-muted">
            Habarnoma lichkangizdagi «Xabarlar» bo‘limiga yuborildi.
          </p>
          <Button className="w-full" onClick={onClose}>Yopish</Button>
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 px-4 py-3 bg-card">
      <span className="text-muted">{label}</span>
      <span className={`text-right text-dark ${strong ? 'font-bold text-primary' : 'font-medium'}`}>
        {value}
      </span>
    </div>
  );
}
