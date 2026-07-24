import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TextInput, Modal, Pressable, Alert,
} from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Button } from '@/components/ui';
import { canWriteTeachers, isViloyat } from '@/src/roles';
import type { ParentAccount } from '@shared/types';

const PAGE = 50;

export default function ParentsScreen() {
  const { parentAccounts, loadParentAccounts, setParentPin, authUser } = useStore();
  const { colors } = useTheme();
  const canManage = canWriteTeachers(authUser?.role) && !isViloyat(authUser?.role);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [pinModal, setPinModal] = useState<ParentAccount | null>(null);
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    if (canManage) void loadParentAccounts();
  }, [canManage, loadParentAccounts]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return parentAccounts;
    return parentAccounts.filter(
      (p) =>
        p.parentName.toLowerCase().includes(query) ||
        p.parentPhone.replace(/\s/g, '').includes(query.replace(/\s/g, '')) ||
        p.children.some((c) =>
          `${c.lastName} ${c.firstName}`.toLowerCase().includes(query)
        )
    );
  }, [parentAccounts, q]);

  const slice = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  const savePin = async () => {
    if (!pinModal || newPin.trim().length < 4) {
      Alert.alert('Xato', 'PIN kamida 4 raqam');
      return;
    }
    try {
      await setParentPin(pinModal.phoneNorm, newPin.trim());
      setPinModal(null);
      Alert.alert('Saqlandi', 'PIN yangilandi');
    } catch (e) {
      Alert.alert('Xato', e instanceof Error ? e.message : 'Saqlashda xato');
    }
  };

  if (!canManage) {
    return (
      <View style={[styles.center, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.muted }}>Bu bo‘lim faqat direktor uchun.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
          Login = telefon, PIN = parol. Jami: {filtered.length}
        </Text>
        <TextInput
          placeholder="Qidirish: ism, telefon, farzand..."
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={(v) => { setQ(v); setPage(0); }}
          style={[styles.input, { borderColor: colors.border, color: colors.dark, backgroundColor: colors.card }]}
        />

        {slice.map((p) => (
          <Card key={p.id} colors={colors}>
            <Text style={[styles.name, { color: colors.dark }]}>{p.parentName}</Text>
            <Text style={{ color: colors.primary, fontSize: 13, marginTop: 4 }}>{p.parentPhone}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
              PIN: {p.pin || (p.hasPin ? '••••' : '— yo‘q')}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
              Farzandlar: {p.children.map((c) => `${c.lastName} ${c.firstName}`).join(', ')}
            </Text>
            {p.children[0] && (
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                {p.children[0].school} · {p.children[0].grade}-sinf
              </Text>
            )}
            <Pressable
              onPress={() => { setPinModal(p); setNewPin(p.pin || ''); }}
              style={[styles.pinBtn, { backgroundColor: colors.primary + '18' }]}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>PIN tahrirlash</Text>
            </Pressable>
          </Card>
        ))}

        {pages > 1 && (
          <View style={styles.pager}>
            <Button
              label="Oldingi"
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              colors={colors}
              variant="ghost"
              disabled={page <= 0}
            />
            <Text style={{ color: colors.muted, fontSize: 12 }}>{page + 1} / {pages}</Text>
            <Button
              label="Keyingi"
              onPress={() => setPage((p) => Math.min(pages - 1, p + 1))}
              colors={colors}
              variant="ghost"
              disabled={page >= pages - 1}
            />
          </View>
        )}
      </ScrollView>

      <Modal visible={!!pinModal} animationType="slide" transparent onRequestClose={() => setPinModal(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, marginBottom: 8 }}>PIN tahrirlash</Text>
            {pinModal && (
              <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
                {pinModal.parentName} · {pinModal.parentPhone}
              </Text>
            )}
            <TextInput
              placeholder="Yangi PIN"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button label="Bekor" onPress={() => setPinModal(null)} colors={colors} variant="ghost" />
              <Button label="Saqlash" onPress={() => void savePin()} colors={colors} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 4,
  },
  pinBtn: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
});
