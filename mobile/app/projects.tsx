import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Badge, Button } from '@/components/ui';
import { canWriteExtras } from '@/src/roles';
import type { ProjectStatus } from '@shared/types';

const STATUS_COLORS: Record<ProjectStatus, string> = {
  idea: '#8E8E93',
  development: '#FF9500',
  completed: '#34C759',
  competition: '#9588E8',
};

export default function ProjectsScreen() {
  const { projects, authUser, addProject } = useStore();
  const { colors } = useTheme();
  const canWrite = canWriteExtras(authUser?.role);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    studentName: '',
    description: '',
    status: 'idea' as ProjectStatus,
  });

  const openCreate = () => {
    setForm({ title: '', studentName: '', description: '', status: 'idea' });
    setOpen(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    addProject({
      id: `pr${Date.now()}`,
      title: form.title.trim(),
      studentName: form.studentName.trim(),
      studentId: '',
      circleId: '',
      category: '',
      status: form.status,
      description: form.description.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      {canWrite && <Button label="Yangi loyiha" onPress={openCreate} colors={colors} />}
      {projects.map((p) => (
        <Card key={p.id} colors={colors}>
          <Text style={[styles.name, { color: colors.dark }]}>{p.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{p.studentName}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{p.description}</Text>
          <Badge label={p.status} color={STATUS_COLORS[p.status] || colors.muted} />
        </Card>
      ))}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>
              Yangi loyiha
            </Text>
            <TextInput
              placeholder="Loyiha nomi"
              placeholderTextColor={colors.muted}
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="O'quvchi ismi"
              placeholderTextColor={colors.muted}
              value={form.studentName}
              onChangeText={(v) => setForm({ ...form, studentName: v })}
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
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>Holat</Text>
            <View style={styles.statusRow}>
              {(['idea', 'development', 'completed', 'competition'] as ProjectStatus[]).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setForm({ ...form, status: s })}
                  style={[
                    styles.chip,
                    { backgroundColor: form.status === s ? colors.primary : colors.surface },
                  ]}
                >
                  <Text style={{ color: form.status === s ? '#fff' : colors.dark, fontSize: 11 }}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
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
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  btn: { padding: 14, borderRadius: 12 },
});
