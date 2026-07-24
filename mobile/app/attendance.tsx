import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { Card, Button } from '@/components/ui';

export default function AttendanceScreen() {
  const { circles, students, attendance, authUser, saveAttendanceBulk } = useStore();
  const { colors } = useTheme();

  const teacherCircles = useMemo(() => {
    if (authUser?.role === 'teacher' && authUser.teacherId) {
      return circles.filter((c) => c.teacherId === authUser.teacherId);
    }
    return circles.filter((c) => !c.isNetwork);
  }, [circles, authUser]);

  const [circleId, setCircleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!circleId && teacherCircles[0]) setCircleId(teacherCircles[0].id);
  }, [teacherCircles, circleId]);

  const circleStudents = students.filter((s) => s.circleIds.includes(circleId) && s.status === 'active');

  useEffect(() => {
    if (!circleId) return;
    const next: Record<string, boolean> = {};
    for (const s of circleStudents) {
      const existing = attendance.find((a) => a.studentId === s.id && a.circleId === circleId && a.date === date);
      next[s.id] = existing ? existing.present : true;
    }
    setMarks(next);
    setSaved(false);
  }, [circleId, date]);

  const presentCount = Object.values(marks).filter(Boolean).length;

  const handleSave = async () => {
    await saveAttendanceBulk(
      circleStudents.map((s) => ({
        id: `a${Date.now()}${s.id}`,
        studentId: s.id,
        circleId,
        date,
        present: marks[s.id] ?? true,
      }))
    );
    setSaved(true);
  };

  return (
    <Screen title="Davomat" subtitle="Kunlik belgilash">
      <Card colors={colors}>
        <Text style={{ color: colors.muted, marginBottom: 6 }}>To'garak</Text>
        <View style={styles.chips}>
          {teacherCircles.slice(0, 8).map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCircleId(c.id)}
              style={[styles.chip, { backgroundColor: circleId === c.id ? colors.primary : colors.surface }]}
            >
              <Text style={{ color: circleId === c.id ? '#fff' : colors.dark, fontSize: 12 }}>{c.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: colors.muted, marginTop: 12, marginBottom: 6 }}>Sana (YYYY-MM-DD)</Text>
        <TextInput
          value={date}
          onChangeText={setDate}
          style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
        />
        <Text style={{ color: colors.dark, marginTop: 8 }}>
          Kelgan: {presentCount}/{circleStudents.length}
        </Text>
      </Card>

      {circleStudents.map((s) => {
        const present = marks[s.id] ?? true;
        return (
          <Card key={s.id} colors={colors}>
            <Text style={{ color: colors.dark, fontWeight: '600' }}>{s.firstName} {s.lastName}</Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => setMarks((m) => ({ ...m, [s.id]: true }))}
                style={[styles.markBtn, { backgroundColor: present ? '#34C75922' : colors.surface }]}
              >
                <Text style={{ color: present ? '#34C759' : colors.muted }}>Keldi</Text>
              </Pressable>
              <Pressable
                onPress={() => setMarks((m) => ({ ...m, [s.id]: false }))}
                style={[styles.markBtn, { backgroundColor: !present ? '#FF3B3022' : colors.surface }]}
              >
                <Text style={{ color: !present ? '#FF3B30' : colors.muted }}>Yo'q</Text>
              </Pressable>
            </View>
          </Card>
        );
      })}

      <Button label="Saqlash" onPress={handleSave} colors={colors} />
      {saved ? <Text style={{ color: colors.success, textAlign: 'center' }}>Saqlandi</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12 },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  markBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
});
