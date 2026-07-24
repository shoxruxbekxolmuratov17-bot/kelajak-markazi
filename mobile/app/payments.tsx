import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Badge } from '@/components/ui';
import { canMarkPaid, isViloyat } from '@/src/roles';
import { PAYMENT_STATUS_LABELS } from '@shared/types';

const STATUS_COLORS = { paid: '#34C759', pending: '#FF9500', overdue: '#FF3B30', partial: '#5AC8FA' };

export default function PaymentsScreen() {
  const { payments, updatePayment, authUser } = useStore();
  const { colors } = useTheme();
  const canMark = canMarkPaid(authUser?.role) && !isViloyat(authUser?.role);
  const formatMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      {isViloyat(authUser?.role) && (
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
          Viloyat admin — faqat ko'rish rejimi
        </Text>
      )}
      {payments.map((p) => (
        <Card key={p.id} colors={colors}>
          <Text style={[styles.name, { color: colors.dark }]}>{p.studentName}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{p.circleName} · {p.month}</Text>
          <View style={styles.row}>
            <Text style={{ color: colors.dark, fontWeight: '700' }}>{formatMoney(p.amount)}</Text>
            <Badge label={PAYMENT_STATUS_LABELS[p.status]} color={STATUS_COLORS[p.status]} />
          </View>
          {canMark && p.status !== 'paid' && (
            <Pressable
              onPress={() =>
                updatePayment(p.id, {
                  status: 'paid',
                  paidAt: new Date().toISOString().slice(0, 10),
                })
              }
              style={[styles.payBtn, { backgroundColor: colors.primary + '18' }]}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>To'langan deb belgilash</Text>
            </Pressable>
          )}
          {p.paidAt && (
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>To'langan: {p.paidAt}</Text>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  payBtn: { marginTop: 10, padding: 10, borderRadius: 10, alignItems: 'center' },
});
