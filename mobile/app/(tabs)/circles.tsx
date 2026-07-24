import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Modal, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { Card, Badge, ProgressBar, SearchBar, Button } from '@/components/ui';
import { CATEGORY_LABELS, CATEGORY_COLORS, MONTHLY_FEE } from '@shared/types';
import { getCircleImage } from '@shared/data/circleImages';
import { canWriteCircles, isViloyat } from '@/src/roles';
import type { Circle } from '@shared/types';

export default function CirclesScreen() {
  const { circles, addCircle, updateCircle, deleteCircle, authUser, teachers } = useStore();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Circle | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const canWrite = canWriteCircles(authUser?.role);
  const readOnly = isViloyat(authUser?.role);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...circles]
      .filter((c) => !c.isNetwork)
      .filter((c) => c.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aActive = a.enrolled > 0 ? 1 : 0;
        const bActive = b.enrolled > 0 ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        return b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'uz');
      });
  }, [circles, search]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setLocation('');
    setOpen(true);
  };

  const openEdit = (c: Circle) => {
    if (!canWrite || readOnly) return;
    setEditing(c);
    setName(c.name);
    setLocation(c.location || '');
    setOpen(true);
  };

  const confirmDelete = (c: Circle) => {
    if (!canWrite || readOnly) return;
    Alert.alert("O'chirish", `"${c.name}" ni o'chirasizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      {
        text: "O'chirish",
        style: 'destructive',
        onPress: () => deleteCircle(c.id),
      },
    ]);
  };

  const save = () => {
    if (!name.trim()) return;
    if (editing) {
      updateCircle(editing.id, { name: name.trim(), location: location || editing.location });
    } else {
      const teacher = teachers[0];
      addCircle({
        name: name.trim(),
        category: 'it',
        teacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Murabbiy',
        teacherId: teacher?.id || 't1',
        capacity: 20,
        enrolled: 0,
        schedule: 'Du, Ch — 14:00-16:00',
        location: location || 'Xona',
        fee: MONTHLY_FEE,
        status: 'active',
        description: '',
        isNetwork: false,
        ageRange: '10-16 yosh',
        progress: 0,
      });
    }
    setOpen(false);
    setEditing(null);
    setName('');
    setLocation('');
  };

  return (
    <Screen title="To'garaklar" subtitle={`${circles.filter((c) => !c.isNetwork).length} ta yo'nalish`}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="To'garak qidirish..." colors={colors} />
      {canWrite && !readOnly && <Button label="Yangi to'garak" onPress={openCreate} colors={colors} />}
      {filtered.map((circle) => (
        <Card key={circle.id} colors={colors} noPadding style={{ overflow: 'hidden' }}>
          <Pressable onPress={() => openEdit(circle)}>
            <Image source={{ uri: getCircleImage(circle) }} style={styles.cover} resizeMode="cover" />
            <View style={styles.body}>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Badge label={CATEGORY_LABELS[circle.category]} color={CATEGORY_COLORS[circle.category]} />
                  <Text style={[styles.name, { color: colors.dark }]}>{circle.name}</Text>
                </View>
                {circle.status === 'planned' && <Badge label="Rejada" color={colors.warning} />}
              </View>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>{circle.teacher}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={colors.muted} />
                <Text style={{ color: colors.muted, fontSize: 12, marginLeft: 4 }}>{circle.schedule}</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <ProgressBar value={circle.progress} colors={colors} showLabel />
              </View>
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6, textAlign: 'right' }}>
                {circle.enrolled}/{circle.capacity} o'quvchi
              </Text>
              {canWrite && !readOnly && (
                <View style={styles.actions}>
                  <Pressable onPress={() => openEdit(circle)} style={[styles.actionBtn, { backgroundColor: colors.primary + '18' }]}>
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>Tahrirlash</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(circle)} style={[styles.actionBtn, { backgroundColor: '#FF3B3018' }]}>
                    <Text style={{ color: '#FF3B30', fontWeight: '600', fontSize: 12 }}>O'chirish</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </Pressable>
        </Card>
      ))}

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>
              {editing ? "To'garakni tahrirlash" : "Yangi to'garak"}
            </Text>
            <TextInput
              placeholder="Nomi"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Joy"
              placeholderTextColor={colors.muted}
              value={location}
              onChangeText={setLocation}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { width: '100%', height: 120 },
  body: { padding: 16 },
  topRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  name: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  btn: { padding: 14, borderRadius: 12 },
});
