import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/src/store/useStore';
import type { ThemeColors } from '@/constants/theme';
import { Card, Badge } from '@/components/ui';

export function EnrollmentAdminPanel({ colors }: { colors: ThemeColors }) {
  const { enrollmentRequests, approveEnrollment, rejectEnrollment } = useStore();
  const pending = enrollmentRequests.filter((r) => r.status === 'pending');

  return (
    <View>
      <Card colors={colors}>
        <View style={styles.headerRow}>
          <Ionicons name="time-outline" size={20} color={colors.warning} />
          <Text style={[styles.title, { color: colors.dark }]}>Kutilayotgan arizalar ({pending.length})</Text>
        </View>

        {pending.length === 0 ? (
          <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 24, fontSize: 13 }}>
            Hozircha kutilayotgan ariza yo'q
          </Text>
        ) : (
          pending.map((req) => (
            <View key={req.id} style={[styles.reqCard, { borderColor: colors.border }]}>
              <View style={styles.reqTop}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.dark, fontWeight: '600', fontSize: 15 }}>
                    {req.firstName} {req.lastName}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                    {req.circleName} · {req.school}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    {req.parentName} · {req.parentPhone}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{req.submittedAt}</Text>
                </View>
                <Badge label="Kutilmoqda" color={colors.warning} />
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => approveEnrollment(req.id)}
                  style={[styles.approveBtn, { backgroundColor: colors.success }]}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.btnText}>Tasdiqlash</Text>
                </Pressable>
                <Pressable
                  onPress={() => rejectEnrollment(req.id)}
                  style={[styles.rejectBtn, { backgroundColor: colors.danger }]}
                >
                  <Ionicons name="close-circle" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700' },
  reqCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  reqTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  rejectBtn: { width: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
