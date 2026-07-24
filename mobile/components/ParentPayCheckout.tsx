import { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, StyleSheet, ScrollView, Linking } from 'react-native';
import { MONTHLY_FEE } from '@shared/types';
import type { Payment, Student } from '@shared/types';
import type { ThemeColors } from '@/constants/theme';
import { api } from '@/src/api/client';

function formatMoney(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
}

export type PayProvider = 'click' | 'payme';
type Step = 'details' | 'provider' | 'gateway' | 'success';

export function ParentPayCheckout({
  visible,
  onClose,
  payment,
  student,
  parentPhone,
  colors,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  payment: Payment;
  student: Student;
  parentPhone: string;
  colors: ThemeColors;
  onSuccess: (info: {
    provider: PayProvider;
    amount: number;
    transactionId: string;
    phone: string;
  }) => void;
}) {
  const [step, setStep] = useState<Step>('details');
  const [provider, setProvider] = useState<PayProvider | null>(null);
  const [payPhone, setPayPhone] = useState(parentPhone);
  const [processing, setProcessing] = useState(false);
  const [txId, setTxId] = useState('');

  const amount = payment.amount || MONTHLY_FEE;
  const fullName = `${student.firstName} ${student.lastName}`;

  useEffect(() => {
    if (visible) {
      setStep('details');
      setProvider(null);
      setPayPhone(parentPhone);
      setProcessing(false);
      setTxId('');
    }
  }, [visible, parentPhone, payment.id]);

  const confirmPay = async () => {
    if (!provider || !payPhone.trim()) return;
    setProcessing(true);
    try {
      const intent = await api.paymentIntent(payment.id, provider);
      if (intent.checkoutUrl) {
        await Linking.openURL(intent.checkoutUrl);
      }
      const done = await api.sandboxCompletePayment(payment.id, provider);
      const id =
        done.payment?.providerTxn ||
        `${provider.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      setTxId(id);
      setStep('success');
      onSuccess({ provider, amount, transactionId: id, phone: payPhone.trim() });
    } catch (e) {
      setTxId('');
      // React Native has no browser alert in all contexts — fallback console
      console.warn(e instanceof Error ? e.message : "To'lov xatosi");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.bg}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.dark }]}>Onlayn to'lov</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {step === 'details' && (
              <View style={{ gap: 10 }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  Ma'lumotlar avtomatik to'ldirilgan. Click yoki Payme orqali to'lang.
                </Text>
                <Info label="O'quvchi" value={fullName} colors={colors} />
                <Info label="Sinf / maktab" value={`${student.grade}-sinf · ${student.school}`} colors={colors} />
                <Info label="To'garak" value={payment.circleName} colors={colors} />
                <Info label="Oy" value={payment.month} colors={colors} />
                <Info label="Summa" value={formatMoney(amount)} colors={colors} highlight />
                <Pressable
                  onPress={() => setStep('provider')}
                  style={[styles.btn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.btnTxt}>To'lash — {formatMoney(amount)}</Text>
                </Pressable>
                <Pressable onPress={onClose} style={[styles.btn, { backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.muted, textAlign: 'center', fontWeight: '600' }}>Bekor</Text>
                </Pressable>
              </View>
            )}

            {step === 'provider' && (
              <View style={{ gap: 10 }}>
                <Pressable
                  onPress={() => { setProvider('click'); setStep('gateway'); }}
                  style={[styles.provider, { borderColor: '#00A6FF', backgroundColor: '#00A6FF18' }]}
                >
                  <Text style={{ color: '#0077CC', fontWeight: '800', fontSize: 18 }}>Click</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Click ilovasi / SMS</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setProvider('payme'); setStep('gateway'); }}
                  style={[styles.provider, { borderColor: '#14B8A6', backgroundColor: '#14B8A618' }]}
                >
                  <Text style={{ color: '#0D9488', fontWeight: '800', fontSize: 18 }}>Payme</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Payme / karta</Text>
                </Pressable>
                <Pressable onPress={() => setStep('details')} style={[styles.btn, { backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.muted, textAlign: 'center' }}>Orqaga</Text>
                </Pressable>
              </View>
            )}

            {step === 'gateway' && provider && (
              <View style={{ gap: 10 }}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {provider === 'click' ? 'Click' : 'Payme'} uchun telefon
                </Text>
                <TextInput
                  value={payPhone}
                  onChangeText={setPayPhone}
                  keyboardType="phone-pad"
                  placeholder="+998 ..."
                  style={[styles.input, { color: colors.dark, borderColor: colors.border }]}
                  placeholderTextColor={colors.muted}
                />
                <Pressable
                  disabled={processing}
                  onPress={() => void confirmPay()}
                  style={[styles.btn, { backgroundColor: colors.primary, opacity: processing ? 0.6 : 1 }]}
                >
                  <Text style={styles.btnTxt}>{processing ? 'Kutilmoqda...' : 'Tasdiqlash'}</Text>
                </Pressable>
                <Pressable onPress={() => setStep('provider')} style={[styles.btn, { backgroundColor: colors.surface }]}>
                  <Text style={{ color: colors.muted, textAlign: 'center' }}>Orqaga</Text>
                </Pressable>
              </View>
            )}

            {step === 'success' && (
              <View style={{ gap: 10, alignItems: 'center', paddingVertical: 12 }}>
                <Text style={{ color: colors.success, fontWeight: '800', fontSize: 18 }}>To'lov qabul qilindi</Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>Tranzaksiya: {txId}</Text>
                <Pressable onPress={onClose} style={[styles.btn, { backgroundColor: colors.primary, alignSelf: 'stretch' }]}>
                  <Text style={styles.btnTxt}>Yopish</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Info({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
  highlight?: boolean;
}) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: highlight ? colors.primary : colors.dark, fontWeight: highlight ? '800' : '600' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  btn: { paddingVertical: 14, borderRadius: 12 },
  btnTxt: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  provider: { borderWidth: 1.5, borderRadius: 14, padding: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
});
