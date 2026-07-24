import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Badge } from '@/components/ui';
import { canWriteSchedule } from '@/src/roles';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export default function ScheduleScreen() {
  const { schedule, circles, authUser, addScheduleItem, deleteScheduleItem } = useStore();
  const { colors } = useTheme();
  const canWrite = canWriteSchedule(authUser?.role);
  const dayNames = ['Yakshanba', ...DAYS];
  const today = dayNames[new Date().getDay()];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    circleId: circles[0]?.id || '',
    day: 'Dushanba',
    startTime: '14:00',
    endTime: '16:00',
    room: '',
  });

  const openAdd = (day: string) => {
    setForm({
      circleId: circles.find((c) => !c.isNetwork)?.id || circles[0]?.id || '',
      day,
      startTime: '14:00',
      endTime: '16:00',
      room: '',
    });
    setOpen(true);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert("O'chirish", `"${name}" jadvaldan o'chirilsinmi?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: () => deleteScheduleItem(id) },
    ]);
  };

  const save = () => {
    const circle = circles.find((c) => c.id === form.circleId);
    if (!circle) return;
    const teacherShort = circle.teacher
      .split(' ')
      .slice(0, 2)
      .map((p, i) => (i === 0 ? p : `${p[0]}.`))
      .join(' ');
    addScheduleItem({
      id: `sch${Date.now()}`,
      circleId: circle.id,
      circleName: circle.name,
      teacher: teacherShort,
      day: form.day,
      startTime: form.startTime.trim() || '14:00',
      endTime: form.endTime.trim() || '16:00',
      room: form.room.trim() || circle.location,
    });
    setOpen(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      {DAYS.map((day) => {
        const items = schedule.filter((s) => s.day === day);
        return (
          <View key={day} style={{ marginBottom: 16 }}>
            <View style={styles.dayRow}>
              <Text style={[styles.day, { color: day === today ? colors.primary : colors.dark }]}>
                {day}{day === today ? ' (bugun)' : ''}
              </Text>
              {canWrite && (
                <Pressable onPress={() => openAdd(day)} style={[styles.addChip, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>+ Qo'shish</Text>
                </Pressable>
              )}
            </View>
            {items.length === 0 ? (
              <Text style={{ color: colors.muted, fontSize: 13 }}>Mashg'ulot yo'q</Text>
            ) : (
              items.map((item) => (
                <Card key={item.id} colors={colors}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.dark, fontWeight: '700' }}>{item.circleName}</Text>
                      <Text style={{ color: colors.muted, fontSize: 13 }}>{item.teacher} · {item.room}</Text>
                      <View style={{ marginTop: 6 }}>
                        <Badge label={`${item.startTime}–${item.endTime}`} color={colors.primary} />
                      </View>
                    </View>
                    {canWrite && (
                      <Pressable
                        onPress={() => confirmDelete(item.id, item.circleName)}
                        style={[styles.delBtn, { backgroundColor: '#FF3B3018' }]}
                      >
                        <Text style={{ color: '#FF3B30', fontWeight: '600', fontSize: 12 }}>O'chirish</Text>
                      </Pressable>
                    )}
                  </View>
                </Card>
              ))
            )}
          </View>
        );
      })}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>
                Mashg'ulot qo'shish
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>To'garak</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {circles.filter((c) => !c.isNetwork).map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setForm({ ...form, circleId: c.id })}
                    style={[
                      styles.chip,
                      { backgroundColor: form.circleId === c.id ? colors.primary : colors.surface },
                    ]}
                  >
                    <Text style={{ color: form.circleId === c.id ? '#fff' : colors.dark, fontSize: 12 }}>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>Kun</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {DAYS.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setForm({ ...form, day: d })}
                    style={[styles.chip, { backgroundColor: form.day === d ? colors.primary : colors.surface }]}
                  >
                    <Text style={{ color: form.day === d ? '#fff' : colors.dark, fontSize: 12 }}>{d.slice(0, 3)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput
                placeholder="Boshlanish (14:00)"
                placeholderTextColor={colors.muted}
                value={form.startTime}
                onChangeText={(v) => setForm({ ...form, startTime: v })}
                style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
              />
              <TextInput
                placeholder="Tugash (16:00)"
                placeholderTextColor={colors.muted}
                value={form.endTime}
                onChangeText={(v) => setForm({ ...form, endTime: v })}
                style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
              />
              <TextInput
                placeholder="Xona"
                placeholderTextColor={colors.muted}
                value={form.room}
                onChangeText={(v) => setForm({ ...form, room: v })}
                style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => setOpen(false)} style={[styles.btn, { backgroundColor: colors.surface, flex: 1 }]}>
                  <Text style={{ color: colors.muted, textAlign: 'center' }}>Bekor</Text>
                </Pressable>
                <Pressable onPress={save} style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Saqlash</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  day: { fontSize: 16, fontWeight: '700' },
  addChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  delBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  btn: { padding: 14, borderRadius: 12 },
});
