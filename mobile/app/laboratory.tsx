import { ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Badge } from '@/components/ui';
import { canToggleLab } from '@/src/roles';
import type { LabEquipment } from '@shared/types';

const STATUS_LABELS: Record<LabEquipment['status'], string> = {
  available: 'Mavjud',
  in_use: 'Ishlatilmoqda',
  maintenance: "Ta'mirda",
  broken: 'Nosoz',
};

export default function LaboratoryScreen() {
  const { labEquipment, authUser, updateLabEquipment } = useStore();
  const { colors } = useTheme();
  const canToggle = canToggleLab(authUser?.role);

  const toggleMaintenance = (eq: LabEquipment) => {
    if (!canToggle) return;
    if (eq.status === 'maintenance') {
      updateLabEquipment(eq.id, { status: 'available', available: eq.quantity });
    } else {
      updateLabEquipment(eq.id, { status: 'maintenance', available: 0 });
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      {labEquipment.map((eq) => (
        <Card key={eq.id} colors={colors}>
          <Text style={[styles.name, { color: colors.dark }]}>{eq.name}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{eq.model} · {eq.location}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Mavjud: {eq.available}/{eq.quantity}</Text>
          <Badge
            label={STATUS_LABELS[eq.status] || eq.status}
            color={eq.status === 'available' ? colors.success : eq.status === 'maintenance' ? colors.warning : colors.muted}
          />
          {canToggle && (
            <Pressable
              onPress={() => toggleMaintenance(eq)}
              style={[styles.toggleBtn, { backgroundColor: colors.primary + '18' }]}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>
                {eq.status === 'maintenance' ? 'Tayyor deb belgilash' : "Ta'mirga yuborish"}
              </Text>
            </Pressable>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  toggleBtn: { marginTop: 10, padding: 10, borderRadius: 10, alignItems: 'center' },
});
