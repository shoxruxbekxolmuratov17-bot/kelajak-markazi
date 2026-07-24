import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { Card, Badge, SearchBar, Button } from '@/components/ui';
import { canWriteStudents, canDeleteStudents, isViloyat } from '@/src/roles';
import type { Student } from '@shared/types';

const PAGE_SIZE = 100;
const CENTER_LABEL = 'Kelajak Markazi';

function isCenterPlace(school: string) {
  const t = (school || '').toLowerCase().trim();
  if (!t) return false;
  if (t.includes('markaz')) return true;
  if (/\d+\s*-?\s*son|\d+-maktab|maktab/.test(t)) return false;
  return t === CENTER_LABEL.toLowerCase();
}

const emptyForm = {
  firstName: '',
  lastName: '',
  age: '12',
  school: '',
  grade: '6',
  parentName: '',
  parentPhone: '',
};

export default function StudentsScreen() {
  const { students, circles, addStudent, updateStudent, deleteStudent, authUser } = useStore();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [circleFilter, setCircleFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [placeFilter, setPlaceFilter] = useState<'all' | 'markaz' | 'maktab'>('all');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);

  const canWrite = canWriteStudents(authUser?.role);
  const canDelete = canDeleteStudents(authUser?.role);
  const readOnly = isViloyat(authUser?.role);

  const gradeOptions = useMemo(() => {
    const set = new Set<number>();
    for (const s of students) if (s.grade >= 1 && s.grade <= 11) set.add(s.grade);
    return [...set].sort((a, b) => a - b);
  }, [students]);

  const schoolOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) if (s.school?.trim()) set.add(s.school.trim());
    return [...set].sort((a, b) => {
      const ac = isCenterPlace(a) ? 0 : 1;
      const bc = isCenterPlace(b) ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return a.localeCompare(b, 'uz');
    });
  }, [students]);

  const placeSchoolOptions = useMemo(() => {
    if (placeFilter === 'markaz') return schoolOptions.filter(isCenterPlace);
    if (placeFilter === 'maktab') return schoolOptions.filter((s) => !isCenterPlace(s));
    return schoolOptions;
  }, [schoolOptions, placeFilter]);

  const circleOptions = useMemo(() => {
    const used = new Set<string>();
    for (const s of students) for (const id of s.circleIds) used.add(id);
    return circles
      .filter((c) => used.has(c.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'uz'))
      .map((c) => ({ id: c.id, label: c.name }));
  }, [students, circles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students
      .filter((s) => {
        if (placeFilter === 'markaz' && !isCenterPlace(s.school)) return false;
        if (placeFilter === 'maktab' && isCenterPlace(s.school)) return false;
        if (gradeFilter !== 'all' && String(s.grade) !== gradeFilter) return false;
        if (schoolFilter !== 'all' && s.school !== schoolFilter) return false;
        if (circleFilter !== 'all' && !s.circleIds.includes(circleFilter)) return false;
        if (!q) return true;
        return (
          `${s.lastName} ${s.firstName}`.toLowerCase().includes(q) ||
          s.school.toLowerCase().includes(q) ||
          s.parentPhone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))
        );
      })
      .sort((a, b) => {
        const byLast = a.lastName.localeCompare(b.lastName, 'uz');
        if (byLast) return byLast;
        return a.firstName.localeCompare(b.firstName, 'uz');
      });
  }, [students, search, gradeFilter, schoolFilter, circleFilter, placeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [search, gradeFilter, schoolFilter, circleFilter, placeFilter]);

  useEffect(() => {
    if (schoolFilter !== 'all' && !placeSchoolOptions.includes(schoolFilter)) {
      setSchoolFilter('all');
    }
  }, [placeFilter, placeSchoolOptions, schoolFilter]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (s: Student) => {
    if (!canWrite || readOnly) return;
    setEditing(s);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      age: String(s.age),
      school: s.school,
      grade: String(s.grade),
      parentName: s.parentName,
      parentPhone: s.parentPhone,
    });
    setOpen(true);
  };

  const confirmDelete = (s: Student) => {
    if (!canDelete || readOnly) return;
    Alert.alert("O'chirish", `${s.lastName} ${s.firstName} ni o'chirasizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: () => deleteStudent(s.id) },
    ]);
  };

  const save = () => {
    if (!form.firstName || !form.lastName) return;
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      age: Number(form.age) || 12,
      school: form.school || '—',
      grade: Number(form.grade) || 6,
      parentName: form.parentName || '—',
      parentPhone: form.parentPhone || '—',
    };
    if (editing) {
      updateStudent(editing.id, payload);
    } else {
      addStudent({
        ...payload,
        circleIds: [],
        status: 'active',
        enrolledAt: new Date().toISOString().slice(0, 10),
        achievements: 0,
      });
    }
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const Chip = ({
    active,
    label,
    onPress,
  }: {
    active: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? colors.primary : colors.surface }]}
    >
      <Text style={{ color: active ? '#fff' : colors.dark, fontSize: 12 }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Screen title="O'quvchilar" subtitle={`${filtered.length} ta · sahifa ${safePage}/${totalPages}`}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="F.I.SH, maktab, telefon..." colors={colors} />

      <Text style={[styles.filterLabel, { color: colors.muted }]}>Joylashuv</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <Chip
          active={placeFilter === 'all'}
          label="Markaz + maktab"
          onPress={() => setPlaceFilter('all')}
        />
        <Chip
          active={placeFilter === 'markaz'}
          label="Faqat markaz"
          onPress={() => setPlaceFilter('markaz')}
        />
        <Chip
          active={placeFilter === 'maktab'}
          label="Faqat maktablar"
          onPress={() => setPlaceFilter('maktab')}
        />
      </ScrollView>

      <Text style={[styles.filterLabel, { color: colors.muted }]}>Maktab / Markaz</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <Chip active={schoolFilter === 'all'} label="Barchasi" onPress={() => setSchoolFilter('all')} />
        {placeSchoolOptions.slice(0, 40).map((name) => (
          <Chip
            key={name}
            active={schoolFilter === name}
            label={isCenterPlace(name) ? `Markaz · ${name}` : name}
            onPress={() => setSchoolFilter(name)}
          />
        ))}
      </ScrollView>

      <Text style={[styles.filterLabel, { color: colors.muted }]}>Sinf</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <Chip active={gradeFilter === 'all'} label="Barchasi" onPress={() => setGradeFilter('all')} />
        {gradeOptions.map((g) => (
          <Chip
            key={g}
            active={gradeFilter === String(g)}
            label={`${g}-sinf`}
            onPress={() => setGradeFilter(String(g))}
          />
        ))}
      </ScrollView>

      <Text style={[styles.filterLabel, { color: colors.muted }]}>To&apos;garak</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <Chip active={circleFilter === 'all'} label="Barchasi" onPress={() => setCircleFilter('all')} />
        {circleOptions.map((c) => (
          <Chip
            key={c.id}
            active={circleFilter === c.id}
            label={c.label}
            onPress={() => setCircleFilter(c.id)}
          />
        ))}
      </ScrollView>

      {canWrite && !readOnly && <Button label="Yangi o'quvchi" onPress={openCreate} colors={colors} />}

      <View style={styles.pager}>
        <Pressable
          disabled={safePage <= 1}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          style={[styles.pageBtn, { backgroundColor: colors.surface, opacity: safePage <= 1 ? 0.4 : 1 }]}
        >
          <Text style={{ color: colors.dark, fontWeight: '600' }}>Oldingi</Text>
        </Pressable>
        <Text style={{ color: colors.muted, fontSize: 13 }}>
          {(safePage - 1) * PAGE_SIZE + (pageItems.length ? 1 : 0)}–
          {Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length}
        </Text>
        <Pressable
          disabled={safePage >= totalPages}
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          style={[styles.pageBtn, { backgroundColor: colors.surface, opacity: safePage >= totalPages ? 0.4 : 1 }]}
        >
          <Text style={{ color: colors.dark, fontWeight: '600' }}>Keyingi</Text>
        </Pressable>
      </View>

      {pageItems.map((student, idx) => {
        const initials = `${student.lastName[0] || ''}${student.firstName[0] || ''}`;
        return (
          <Card key={student.id} colors={colors}>
            <Pressable onPress={() => openEdit(student)}>
              <View style={styles.row}>
                <Text style={{ color: colors.muted, width: 28, fontSize: 12 }}>
                  {(safePage - 1) * PAGE_SIZE + idx + 1}
                </Text>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.dark }]}>
                    {student.lastName} {student.firstName}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {student.school} · {student.grade}-sinf
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    {student.parentName} · {student.parentPhone}
                  </Text>
                </View>
                <Badge
                  label={student.status === 'active' ? 'Faol' : student.status}
                  color={student.status === 'active' ? colors.success : colors.muted}
                />
              </View>
            </Pressable>
            {canWrite && !readOnly && (
              <View style={styles.actions}>
                <Pressable
                  onPress={() => openEdit(student)}
                  style={[styles.actionBtn, { backgroundColor: colors.primary + '18' }]}
                >
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>Tahrirlash</Text>
                </Pressable>
                {canDelete && (
                  <Pressable
                    onPress={() => confirmDelete(student)}
                    style={[styles.actionBtn, { backgroundColor: '#FF3B3018' }]}
                  >
                    <Text style={{ color: '#FF3B30', fontWeight: '600', fontSize: 12 }}>O&apos;chirish</Text>
                  </Pressable>
                )}
              </View>
            )}
          </Card>
        );
      })}

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>
              {editing ? "O'quvchini tahrirlash" : "Yangi o'quvchi"}
            </Text>
            {(
              [
                ['firstName', 'Ism'],
                ['lastName', 'Familiya'],
                ['school', 'Maktab'],
                ['parentName', 'Ota-ona'],
                ['parentPhone', 'Telefon'],
              ] as const
            ).map(([key, label]) => (
              <TextInput
                key={key}
                placeholder={label}
                placeholderTextColor={colors.muted}
                value={form[key]}
                onChangeText={(t) => setForm({ ...form, [key]: t })}
                style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
              />
            ))}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                placeholder="Yosh"
                placeholderTextColor={colors.muted}
                value={form.age}
                onChangeText={(t) => setForm({ ...form, age: t })}
                keyboardType="number-pad"
                style={[styles.input, { borderColor: colors.border, color: colors.dark, flex: 1 }]}
              />
              <TextInput
                placeholder="Sinf"
                placeholderTextColor={colors.muted}
                value={form.grade}
                onChangeText={(t) => setForm({ ...form, grade: t })}
                keyboardType="number-pad"
                style={[styles.input, { borderColor: colors.border, color: colors.dark, flex: 1 }]}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Pressable
                onPress={() => setOpen(false)}
                style={[styles.btn, { backgroundColor: colors.surface, flex: 1 }]}
              >
                <Text style={{ color: colors.muted, textAlign: 'center' }}>Bekor</Text>
              </Pressable>
              <Pressable onPress={save} style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Saqlash</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    maxWidth: 200,
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  pageBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  btn: { padding: 14, borderRadius: 12 },
});
