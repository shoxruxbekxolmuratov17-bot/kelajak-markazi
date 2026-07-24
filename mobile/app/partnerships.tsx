import { useState } from 'react';
import { ScrollView, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Badge, Button } from '@/components/ui';
import { canWriteExtras } from '@/src/roles';

export default function PartnershipsScreen() {
  const { partnerships, authUser, addPartnership } = useStore();
  const { colors } = useTheme();
  const canWrite = canWriteExtras(authUser?.role);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    organization: '',
    country: '',
    type: '',
    description: '',
  });

  const openCreate = () => {
    setForm({ organization: '', country: '', type: '', description: '' });
    setOpen(true);
  };

  const save = () => {
    if (!form.organization.trim() || !form.country.trim()) return;
    addPartnership({
      id: `pt${Date.now()}`,
      organization: form.organization.trim(),
      country: form.country.trim(),
      type: form.type.trim() || 'Hamkorlik',
      description: form.description.trim(),
      startDate: new Date().toISOString().slice(0, 10),
      contactPerson: '',
      status: 'planned',
      events: 0,
    });
    setOpen(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      {canWrite && <Button label="Yangi hamkorlik" onPress={openCreate} colors={colors} />}
      {partnerships.map((p) => (
        <Card key={p.id} colors={colors}>
          <Text style={[styles.name, { color: colors.dark }]}>{p.organization}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{p.country} · {p.type}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{p.description}</Text>
          <Badge label={p.status} color={p.status === 'active' ? colors.success : colors.warning} />
        </Card>
      ))}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>
              Yangi hamkorlik
            </Text>
            <TextInput
              placeholder="Tashkilot"
              placeholderTextColor={colors.muted}
              value={form.organization}
              onChangeText={(v) => setForm({ ...form, organization: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Mamlakat"
              placeholderTextColor={colors.muted}
              value={form.country}
              onChangeText={(v) => setForm({ ...form, country: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Hamkorlik turi"
              placeholderTextColor={colors.muted}
              value={form.type}
              onChangeText={(v) => setForm({ ...form, type: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Tavsif"
              placeholderTextColor={colors.muted}
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              multiline
              style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.dark }]}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => setOpen(false)} style={[styles.btn, { backgroundColor: colors.surface, flex: 1 }]}>
                <Text style={{ color: colors.muted, textAlign: 'center' }}>Bekor</Text>
              </Pressable>
              <Pressable onPress={save} style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Qo'shish</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  btn: { padding: 14, borderRadius: 12 },
});
