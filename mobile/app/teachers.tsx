import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, Modal, Alert } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Button } from '@/components/ui';
import { canWriteTeachers, isViloyat } from '@/src/roles';
import { api } from '@/src/api/client';
import type { StaffAccount, Teacher } from '@shared/types';

function displayName(t: Teacher) {
  if (t.isVacant) return "Lavozim bo'sh";
  return t.fullName || `${t.lastName} ${t.firstName}`.trim();
}

const emptyForm = () => ({
  fullName: '',
  firstName: '',
  lastName: '',
  specialty: '',
  department: '',
  phone: '',
});

const emptyAccount = () => ({
  teacherId: '',
  fullName: '',
  username: '',
  password: 'teacher123',
  phone: '',
});

export default function TeachersScreen() {
  const {
    teachers,
    staffAccounts,
    authUser,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    loadStaffAccounts,
    createStaffAccount,
    updateStaffAccount,
    setStaffPassword,
    blockStaffAccount,
    deleteStaffAccount,
  } = useStore();
  const { colors } = useTheme();
  const canWrite = canWriteTeachers(authUser?.role) && !isViloyat(authUser?.role);
  const readOnly = isViloyat(authUser?.role);
  const canManageAccounts = canWrite;

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const [accountOpen, setAccountOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState(emptyAccount());

  useEffect(() => {
    if (canManageAccounts) void loadStaffAccounts();
  }, [canManageAccounts, loadStaffAccounts]);

  const accountByTeacher = useMemo(() => {
    const map = new Map<string, StaffAccount>();
    for (const a of staffAccounts) {
      if (a.teacherId) map.set(a.teacherId, a);
    }
    return map;
  }, [staffAccounts]);

  const leaders = useMemo(
    () =>
      teachers
        .filter(
          (t) =>
            !t.isVacant &&
            (t.id.startsWith('tl') || (t.id.startsWith('st') && t.id !== 'st1' && t.id !== 'st2'))
        )
        .sort((a, b) => displayName(a).localeCompare(displayName(b), 'uz')),
    [teachers]
  );

  const withoutAccount = leaders.filter((t) => !accountByTeacher.has(t.id));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (t: Teacher) => {
    if (!canWrite) return;
    setEditingId(t.id);
    setForm({
      fullName: t.fullName || displayName(t),
      firstName: t.firstName,
      lastName: t.lastName,
      specialty: t.specialty,
      department: t.department || '',
      phone: t.phone === '—' ? '' : t.phone,
    });
    setOpen(true);
  };

  const confirmDelete = (t: Teacher) => {
    if (!canWrite) return;
    Alert.alert("O'chirish", `${displayName(t)} ni o'chirasizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: () => deleteTeacher(t.id) },
    ]);
  };

  const save = () => {
    const fullName = form.fullName.trim();
    if (!fullName && (!form.firstName.trim() || !form.lastName.trim())) return;
    const parts = fullName.split(/\s+/);
    const lastName = form.lastName.trim() || parts[0] || '';
    const firstName = form.firstName.trim() || parts.slice(1).join(' ') || fullName;
    const data = {
      fullName: fullName || `${lastName} ${firstName}`.trim(),
      firstName,
      lastName,
      specialty: form.specialty.trim() || 'Murabbiy',
      department: form.department.trim() || undefined,
      phone: form.phone.trim() || '—',
      email: '—',
      isVacant: false,
    };
    if (editingId) updateTeacher(editingId, data);
    else {
      addTeacher({
        id: `st${Date.now()}`,
        ...data,
        circleIds: [],
        experience: 0,
        rating: 0,
        isInclusive: false,
      });
    }
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const openCreateAccount = async (teacher?: Teacher) => {
    const t = teacher || withoutAccount[0];
    const fullName = t ? displayName(t) : '';
    let username = '';
    if (fullName) {
      try {
        const s = await api.suggestUsername(fullName);
        username = s.username;
      } catch {
        username = '';
      }
    }
    setEditingAccountId(null);
    setAccountForm({
      teacherId: t?.id || '',
      fullName,
      username,
      password: 'teacher123',
      phone: t && t.phone !== '—' ? t.phone : '',
    });
    setAccountOpen(true);
  };

  const openEditAccount = (account: StaffAccount) => {
    setEditingAccountId(account.id);
    setAccountForm({
      teacherId: account.teacherId || '',
      fullName: account.fullName,
      username: account.username,
      password: '',
      phone: account.phone || '',
    });
    setAccountOpen(true);
  };

  const saveAccount = async () => {
    try {
      if (editingAccountId) {
        await updateStaffAccount(editingAccountId, {
          username: accountForm.username.trim(),
          fullName: accountForm.fullName.trim(),
          phone: accountForm.phone.trim() || undefined,
          teacherId: accountForm.teacherId || undefined,
        });
        if (accountForm.password.trim()) {
          await setStaffPassword(editingAccountId, accountForm.password.trim());
        }
        Alert.alert('Saqlandi', 'Akkaunt yangilandi');
      } else {
        if (!accountForm.teacherId) {
          Alert.alert('Xato', "O'qituvchini tanlang");
          return;
        }
        const created = await createStaffAccount({
          username: accountForm.username.trim(),
          password: accountForm.password.trim() || 'teacher123',
          fullName: accountForm.fullName.trim(),
          teacherId: accountForm.teacherId,
          phone: accountForm.phone.trim() || undefined,
        });
        Alert.alert(
          'Yaratildi',
          `Login: ${created?.username}\nParol: ${created?.tempPassword || accountForm.password}`
        );
      }
      setAccountOpen(false);
      await loadStaffAccounts();
    } catch (e) {
      Alert.alert('Xato', e instanceof Error ? e.message : 'Amaliyot bajarilmadi');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      {canManageAccounts && (
        <Card colors={colors}>
          <Text style={[styles.name, { color: colors.dark }]}>O&apos;qituvchi akkauntlari</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, marginBottom: 10 }}>
            Login/parol yaratish, tahrirlash va bloklash
          </Text>
          {withoutAccount.length > 0 && (
            <Button label="Akkaunt yaratish" onPress={() => void openCreateAccount()} colors={colors} />
          )}
          {leaders.map((t) => {
            const account = accountByTeacher.get(t.id);
            return (
              <View key={t.id} style={[styles.accountRow, { borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.dark, fontWeight: '600', fontSize: 13 }}>{displayName(t)}</Text>
                  <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                    {account ? `@${account.username} · parol: ${account.defaultPassword || 'teacher123'}` : 'Akkaunt yo‘q'}
                    {account?.blocked ? ' · BLOK' : ''}
                  </Text>
                </View>
                {!account ? (
                  <Pressable onPress={() => void openCreateAccount(t)} style={[styles.actionBtn, { backgroundColor: colors.primary + '18' }]}>
                    <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 11 }}>Yaratish</Text>
                  </Pressable>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable onPress={() => openEditAccount(account)} style={[styles.actionBtn, { backgroundColor: colors.primary + '18' }]}>
                      <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 11 }}>Parol</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void blockStaffAccount(account.id, !account.blocked)}
                      style={[styles.actionBtn, { backgroundColor: '#FF950018' }]}
                    >
                      <Text style={{ color: '#FF9500', fontWeight: '600', fontSize: 11 }}>
                        {account.blocked ? 'Ochish' : 'Blok'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        Alert.alert("O'chirish", 'Akkauntni o‘chirasizmi?', [
                          { text: 'Bekor', style: 'cancel' },
                          {
                            text: "O'chirish",
                            style: 'destructive',
                            onPress: () => void deleteStaffAccount(account.id),
                          },
                        ])
                      }
                      style={[styles.actionBtn, { backgroundColor: '#FF3B3018' }]}
                    >
                      <Text style={{ color: '#FF3B30', fontWeight: '600', fontSize: 11 }}>O‘ch</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      )}

      {canWrite && <Button label="Xodim qo'shish" onPress={openCreate} colors={colors} />}
      {readOnly && (
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
          Viloyat admin — faqat ko&apos;rish rejimi
        </Text>
      )}
      {teachers.map((t) => (
        <Card key={t.id} colors={colors}>
          <Pressable onPress={() => openEdit(t)} disabled={!canWrite}>
            <Text style={[styles.name, { color: colors.dark }]}>{displayName(t)}</Text>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 2 }}>{t.specialty}</Text>
            {!!t.department && (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{t.department}</Text>
            )}
            {!t.isVacant && !!t.phone && t.phone !== '—' && (
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{t.phone}</Text>
            )}
            {!!t.orderInfo && (
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{t.orderInfo}</Text>
            )}
            {t.isVacant && (
              <Text style={{ color: '#FF9500', fontSize: 12, marginTop: 6, fontWeight: '600' }}>Lavozim bo&apos;sh</Text>
            )}
          </Pressable>
          {canWrite && (
            <View style={styles.actions}>
              <Pressable onPress={() => openEdit(t)} style={[styles.actionBtn, { backgroundColor: colors.primary + '18' }]}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>Tahrirlash</Text>
              </Pressable>
              <Pressable onPress={() => confirmDelete(t)} style={[styles.actionBtn, { backgroundColor: '#FF3B3018' }]}>
                <Text style={{ color: '#FF3B30', fontWeight: '600', fontSize: 12 }}>O&apos;chirish</Text>
              </Pressable>
            </View>
          )}
        </Card>
      ))}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>
              {editingId ? 'Tahrirlash' : "Xodim qo'shish"}
            </Text>
            <TextInput
              placeholder="To'liq F.I.Sh."
              placeholderTextColor={colors.muted}
              value={form.fullName}
              onChangeText={(v) => setForm({ ...form, fullName: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Familiya"
              placeholderTextColor={colors.muted}
              value={form.lastName}
              onChangeText={(v) => setForm({ ...form, lastName: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Ism va otasining ismi"
              placeholderTextColor={colors.muted}
              value={form.firstName}
              onChangeText={(v) => setForm({ ...form, firstName: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Lavozim"
              placeholderTextColor={colors.muted}
              value={form.specialty}
              onChangeText={(v) => setForm({ ...form, specialty: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Bo'lim"
              placeholderTextColor={colors.muted}
              value={form.department}
              onChangeText={(v) => setForm({ ...form, department: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Telefon"
              placeholderTextColor={colors.muted}
              value={form.phone}
              onChangeText={(v) => setForm({ ...form, phone: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button label="Bekor" onPress={() => setOpen(false)} colors={colors} variant="ghost" />
              <Button label="Saqlash" onPress={save} colors={colors} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={accountOpen} animationType="slide" transparent onRequestClose={() => setAccountOpen(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, marginBottom: 12 }}>
              {editingAccountId ? 'Akkauntni tahrirlash' : 'Yangi akkaunt'}
            </Text>
            {!editingAccountId && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>O&apos;qituvchi</Text>
                {withoutAccount.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() =>
                      setAccountForm({
                        ...accountForm,
                        teacherId: t.id,
                        fullName: displayName(t),
                        phone: t.phone !== '—' ? t.phone : '',
                      })
                    }
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      marginBottom: 4,
                      backgroundColor: accountForm.teacherId === t.id ? colors.primary + '22' : colors.surface,
                    }}
                  >
                    <Text style={{ color: colors.dark, fontSize: 13 }}>{displayName(t)}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            <TextInput
              placeholder="F.I.Sh."
              placeholderTextColor={colors.muted}
              value={accountForm.fullName}
              onChangeText={(v) => setAccountForm({ ...accountForm, fullName: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder="Login"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              value={accountForm.username}
              onChangeText={(v) => setAccountForm({ ...accountForm, username: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <TextInput
              placeholder={editingAccountId ? 'Yangi parol (ixtiyoriy)' : 'Parol'}
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={accountForm.password}
              onChangeText={(v) => setAccountForm({ ...accountForm, password: v })}
              style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button label="Bekor" onPress={() => setAccountOpen(false)} colors={colors} variant="ghost" />
              <Button label="Saqlash" onPress={() => void saveAccount()} colors={colors} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  name: { fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 14,
  },
});
