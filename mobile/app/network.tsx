import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Button, Badge } from '@/components/ui';
import { canWriteExtras } from '@/src/roles';
import { MONTHLY_FEE, CATEGORY_LABELS, CATEGORY_COLORS } from '@shared/types';
import type { Circle } from '@shared/types';

export default function NetworkScreen() {
  const { schools, circles, teachers, authUser, addNetworkCircle } = useStore();
  const { colors } = useTheme();
  const canWrite = canWriteExtras(authUser?.role);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [circleName, setCircleName] = useState('');

  const networkCircles = useMemo(() => circles.filter((c) => c.isNetwork), [circles]);

  const circlesBySchool = useMemo(() => {
    const map = new Map<string, Circle[]>();
    for (const c of networkCircles) {
      const key = c.school || c.location || 'Noma’lum';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [networkCircles]);

  const sortedSchools = useMemo(
    () =>
      [...schools].sort(
        (a, b) =>
          (circlesBySchool.get(b.name)?.length || b.networkCircles) -
            (circlesBySchool.get(a.name)?.length || a.networkCircles) ||
          a.name.localeCompare(b.name, 'uz')
      ),
    [schools, circlesBySchool]
  );

  const activeSchools = sortedSchools.filter(
    (s) => (circlesBySchool.get(s.name)?.length || s.networkCircles) > 0
  );

  const openAdd = (schoolId?: string) => {
    setSelectedSchool(schoolId || schools[0]?.id || '');
    setCircleName('');
    setOpen(true);
  };

  const save = () => {
    if (!selectedSchool || !circleName.trim()) return;
    const school = schools.find((s) => s.id === selectedSchool);
    const teacher = teachers.find((t) => !t.isVacant && t.id.startsWith('tl')) || teachers.find((t) => !t.isVacant);
    addNetworkCircle(selectedSchool, {
      name: circleName.trim(),
      category: 'it',
      teacher: teacher
        ? teacher.fullName || `${teacher.firstName} ${teacher.lastName}`
        : 'Murabbiy',
      teacherId: teacher?.id || `t${Date.now()}`,
      capacity: 20,
      schedule: 'Du, Ch — 14:00-16:00',
      location: school?.name || '',
      fee: MONTHLY_FEE,
      status: 'active',
      description: `Tarmoq · ${school?.name || ''}`,
      ageRange: '6 — 18 yosh',
    });
    setOpen(false);
    setCircleName('');
  };

  const totalStudents = networkCircles.reduce((s, c) => s + c.enrolled, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      <Card colors={colors}>
        <Text style={[styles.heroTitle, { color: colors.dark }]}>Tarmoq to&apos;garaklar</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
          Faqat maktablarda o&apos;tiladigan guruhlar (markaz emas)
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 20 }}>{activeSchools.length}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>Maktab</Text>
          </View>
          <View style={styles.stat}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 20 }}>{networkCircles.length}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>To&apos;garak</Text>
          </View>
          <View style={styles.stat}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 20 }}>{totalStudents}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>O&apos;quvchi</Text>
          </View>
        </View>
      </Card>

      {canWrite && (
        <Button label="Tarmoq to'garak qo'shish" onPress={() => openAdd()} colors={colors} />
      )}

      {activeSchools.map((school) => {
        const list = circlesBySchool.get(school.name) || [];
        const count = list.length || school.networkCircles;
        const students = list.reduce((s, c) => s + c.enrolled, 0) || school.students;
        const expanded = expandedId === school.id;

        return (
          <Card key={school.id} colors={colors} noPadding>
            <Pressable
              onPress={() => setExpandedId(expanded ? null : school.id)}
              style={styles.schoolHeader}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.dark }]}>{school.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{school.address}</Text>
                <Text style={{ color: colors.primary, fontSize: 12, marginTop: 6, fontWeight: '600' }}>
                  {count} to&apos;garak · {students} o&apos;quvchi
                </Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                {expanded ? 'Yopish' : 'Ochish'}
              </Text>
            </Pressable>

            {expanded && (
              <View style={[styles.expandBody, { borderTopColor: colors.border }]}>
                {list.map((c) => (
                  <View key={c.id} style={[styles.circleRow, { backgroundColor: colors.surface }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 14 }}>{c.name}</Text>
                      <Badge
                        label={CATEGORY_LABELS[c.category] || c.category}
                        color={CATEGORY_COLORS[c.category] || colors.primary}
                      />
                      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{c.teacher}</Text>
                      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{c.schedule}</Text>
                      <Text style={{ color: colors.primary, fontSize: 12, marginTop: 4, fontWeight: '600' }}>
                        {c.enrolled}/{c.capacity} o&apos;quvchi
                      </Text>
                    </View>
                  </View>
                ))}
                {canWrite && (
                  <Pressable
                    onPress={() => openAdd(school.id)}
                    style={[styles.addBtn, { backgroundColor: colors.primary + '18' }]}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>
                      + To&apos;garak ochish
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </Card>
        );
      })}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>
              Yangi tarmoq to&apos;garak
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>Maktab</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {schools.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setSelectedSchool(s.id)}
                  style={[
                    styles.chip,
                    { backgroundColor: selectedSchool === s.id ? colors.primary : colors.surface },
                  ]}
                >
                  <Text
                    style={{ color: selectedSchool === s.id ? '#fff' : colors.dark, fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              placeholder="To'garak nomi"
              placeholderTextColor={colors.muted}
              value={circleName}
              onChangeText={setCircleName}
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
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  heroTitle: { fontSize: 17, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 14 },
  stat: { alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700' },
  schoolHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  expandBody: { borderTopWidth: 1, padding: 12, gap: 10 },
  circleRow: { borderRadius: 12, padding: 12 },
  addBtn: { marginTop: 4, padding: 10, borderRadius: 10, alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, maxWidth: 180 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  btn: { padding: 14, borderRadius: 12 },
});
