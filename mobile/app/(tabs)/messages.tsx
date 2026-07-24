import { useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { Card, Badge, Button } from '@/components/ui';
import type { Message, UserRole } from '@shared/types';

const TYPE_CONFIG = {
  info: { icon: 'information-circle' as const, color: '#5AC8FA', label: "Ma'lumot" },
  warning: { icon: 'warning' as const, color: '#FF9500', label: 'Ogohlantirish' },
  success: { icon: 'checkmark-circle' as const, color: '#34C759', label: 'Yangilik' },
  event: { icon: 'calendar' as const, color: '#9588E8', label: 'Tadbir' },
  direct: { icon: 'chatbubble-ellipses' as const, color: '#AF52DE', label: 'Shaxsiy' },
};

function visibleToUser(
  msg: Message,
  role: UserRole | undefined,
  userId: string | undefined,
  teacherId: string | undefined,
  phone: string | undefined
) {
  if (!msg.toAudience || msg.toAudience === 'all') return true;
  if (msg.fromUserId && userId && msg.fromUserId === userId) return true;
  if (msg.toAudience === 'staff' && (role === 'admin' || role === 'district_admin' || role === 'superadmin' || role === 'teacher')) return true;
  if (msg.toAudience === 'parents' && role === 'parent') return true;
  if (msg.toAudience === 'user') {
    if (userId && msg.toUserId === userId) return true;
    if (teacherId && msg.toUserId === teacherId) return true;
    if (phone && msg.toUserId === phone.replace(/\s/g, '')) return true;
    if (role === 'admin' || role === 'district_admin' || role === 'superadmin') return true;
  }
  return false;
}

export default function MessagesScreen() {
  const {
    messages, markMessageRead, addMessage, authUser, parentPhone,
    teachers, students, circles,
  } = useStore();
  const { colors } = useTheme();
  const role = authUser?.role;
  const phone = parentPhone || authUser?.phone || '';

  const inbox = useMemo(
    () => messages.filter((m) => visibleToUser(m, role, authUser?.id, authUser?.teacherId, phone)),
    [messages, role, authUser?.id, authUser?.teacherId, phone]
  );
  const unread = inbox.filter((m) => !m.read).length;

  const [composeOpen, setComposeOpen] = useState(false);
  const [viewMsg, setViewMsg] = useState<Message | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'info' as Message['type'],
    audience: 'staff' as 'all' | 'staff' | 'parents' | 'user',
    toUserId: '',
    toName: '',
  });

  const recipientOptions = useMemo(() => {
    if (role === 'parent') {
      const myChildren = students.filter(
        (s) => s.parentPhone.replace(/\s/g, '') === phone.replace(/\s/g, '')
      );
      const teacherIds = new Set<string>();
      for (const child of myChildren) {
        for (const cid of child.circleIds) {
          const circle = circles.find((c) => c.id === cid);
          if (circle?.teacherId) teacherIds.add(circle.teacherId);
        }
      }
      return teachers
        .filter((t) => teacherIds.has(t.id) || teacherIds.size === 0)
        .filter((t) => !t.isVacant)
        .map((t) => ({
          value: t.id,
          label: `${t.fullName || `${t.lastName} ${t.firstName}`} — ${t.specialty}`,
          name: t.fullName || `${t.lastName} ${t.firstName}`,
        }));
    }
    const staff = teachers
      .filter((t) => !t.isVacant)
      .map((t) => ({
        value: t.id,
        label: `Xodim: ${t.fullName || `${t.lastName} ${t.firstName}`}`,
        name: t.fullName || `${t.lastName} ${t.firstName}`,
      }));
    const parents = students.map((s) => ({
      value: s.parentPhone.replace(/\s/g, ''),
      label: `Ota-ona: ${s.parentName} (${s.firstName} ${s.lastName})`,
      name: s.parentName,
    }));
    const seen = new Set<string>();
    const uniqueParents = parents.filter((p) => {
      if (seen.has(p.value)) return false;
      seen.add(p.value);
      return true;
    });
    return [...staff, ...uniqueParents];
  }, [role, teachers, students, circles, phone]);

  const openMessage = (msg: Message) => {
    setViewMsg(msg);
    if (!msg.read) markMessageRead(msg.id);
  };

  const handleSend = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (form.audience === 'user' && !form.toUserId) return;

    const audience = role === 'parent' ? 'user' : form.audience;
    const toUserId = audience === 'user' ? form.toUserId : undefined;
    const toName =
      audience === 'user'
        ? form.toName || recipientOptions.find((r) => r.value === form.toUserId)?.name
        : audience === 'staff'
          ? 'Barcha xodimlar'
          : audience === 'parents'
            ? 'Barcha ota-onalar'
            : 'Hammaga';

    addMessage({
      title: form.title.trim(),
      content: form.content.trim(),
      type: audience === 'user' ? 'direct' : form.type,
      fromName: authUser?.fullName,
      fromRole: authUser?.role,
      fromUserId: authUser?.id,
      toAudience: audience,
      toUserId,
      toName,
    });
    setForm({
      title: '',
      content: '',
      type: 'info',
      audience: role === 'parent' ? 'user' : 'staff',
      toUserId: '',
      toName: '',
    });
    setComposeOpen(false);
  };

  const audiences = [
    { value: 'staff' as const, label: 'Xodimlar' },
    { value: 'parents' as const, label: 'Ota-onalar' },
    { value: 'all' as const, label: 'Hammaga' },
    { value: 'user' as const, label: 'Shaxsiy' },
  ];

  const canCompose = !!authUser && role !== 'superadmin';

  return (
    <Screen
      title="Xabarlar"
      subtitle={unread > 0 ? `${unread} ta o'qilmagan` : "Barcha xabarlar o'qilgan"}
    >
      <View style={styles.headerRow}>
        {unread > 0 ? (
          <View style={[styles.alert, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30', flex: 1 }]}>
            <Ionicons name="notifications" size={18} color={colors.primary} />
            <Text style={{ color: colors.dark, fontSize: 13, marginLeft: 8, flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>{unread} ta</Text> o'qilmagan xabar
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {canCompose && (
          <Button
            label="Yuborish"
            onPress={() => {
              setForm((f) => ({ ...f, audience: role === 'parent' ? 'user' : 'staff' }));
              setComposeOpen(true);
            }}
            colors={colors}
          />
        )}
      </View>

      {inbox.length === 0 ? (
        <Card colors={colors}>
          <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 16 }}>Xabarlar yo'q</Text>
        </Card>
      ) : (
        inbox.map((msg) => {
          const config = TYPE_CONFIG[msg.type] || TYPE_CONFIG.info;
          return (
            <Pressable key={msg.id} onPress={() => openMessage(msg)}>
              <Card
                colors={colors}
                style={!msg.read ? { borderLeftWidth: 4, borderLeftColor: colors.primary } : undefined}
              >
                <View style={styles.row}>
                  <View style={[styles.iconBox, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon} size={22} color={config.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[styles.title, { color: msg.read ? colors.muted : colors.dark }]}
                        numberOfLines={1}
                      >
                        {msg.title}
                      </Text>
                      {!msg.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                      {msg.content}
                    </Text>
                    {(msg.fromName || msg.toName) && (
                      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }} numberOfLines={1}>
                        {msg.fromName ? `Kimdan: ${msg.fromName}` : ''}
                        {msg.fromName && msg.toName ? ' · ' : ''}
                        {msg.toName ? `Kimga: ${msg.toName}` : ''}
                      </Text>
                    )}
                    <View style={styles.footer}>
                      <Badge label={config.label} color={config.color} />
                      <Text style={{ color: colors.muted, fontSize: 11 }}>{msg.date}</Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}

      {/* Detail modal */}
      <Modal visible={!!viewMsg} animationType="slide" transparent onRequestClose={() => setViewMsg(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            {viewMsg && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, flex: 1 }}>
                    {viewMsg.title}
                  </Text>
                  <Pressable onPress={() => setViewMsg(null)} hitSlop={10}>
                    <Ionicons name="close" size={24} color={colors.muted} />
                  </Pressable>
                </View>
                <Badge
                  label={(TYPE_CONFIG[viewMsg.type] || TYPE_CONFIG.info).label}
                  color={(TYPE_CONFIG[viewMsg.type] || TYPE_CONFIG.info).color}
                />
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{viewMsg.date}</Text>
                {(viewMsg.fromName || viewMsg.toName) && (
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
                    {viewMsg.fromName ? `Kimdan: ${viewMsg.fromName}` : ''}
                    {viewMsg.fromName && viewMsg.toName ? '\n' : ''}
                    {viewMsg.toName ? `Kimga: ${viewMsg.toName}` : ''}
                  </Text>
                )}
                <Text style={{ color: colors.dark, fontSize: 15, marginTop: 16, lineHeight: 22 }}>
                  {viewMsg.content}
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Compose modal */}
      <Modal visible={composeOpen} animationType="slide" transparent onRequestClose={() => setComposeOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modal, { backgroundColor: colors.card, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17 }}>Yangi xabar</Text>
              <Pressable onPress={() => setComposeOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                placeholder="Sarlavha"
                placeholderTextColor={colors.muted}
                value={form.title}
                onChangeText={(title) => setForm((f) => ({ ...f, title }))}
                style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
              />
              <TextInput
                placeholder="Xabar matni"
                placeholderTextColor={colors.muted}
                value={form.content}
                onChangeText={(content) => setForm((f) => ({ ...f, content }))}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.dark }]}
              />

              {role !== 'parent' && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Kimga</Text>
                  <View style={styles.chipRow}>
                    {audiences.map((a) => (
                      <Pressable
                        key={a.value}
                        onPress={() => setForm((f) => ({ ...f, audience: a.value, toUserId: '', toName: '' }))}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: form.audience === a.value ? colors.primary : colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: form.audience === a.value ? '#fff' : colors.dark,
                            fontSize: 12,
                            fontWeight: '600',
                          }}
                        >
                          {a.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}

              {(role === 'parent' || form.audience === 'user') && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Qabul qiluvchi</Text>
                  {recipientOptions.map((r) => (
                    <Pressable
                      key={r.value}
                      onPress={() => setForm((f) => ({ ...f, toUserId: r.value, toName: r.name, audience: 'user' }))}
                      style={[
                        styles.recipient,
                        {
                          backgroundColor: form.toUserId === r.value ? colors.primary + '18' : colors.surface,
                          borderColor: form.toUserId === r.value ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: colors.dark, fontSize: 13 }} numberOfLines={1}>{r.label}</Text>
                    </Pressable>
                  ))}
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Pressable
                  onPress={() => setComposeOpen(false)}
                  style={[styles.btn, { backgroundColor: colors.surface, flex: 1 }]}
                >
                  <Text style={{ color: colors.muted, textAlign: 'center' }}>Bekor</Text>
                </Pressable>
                <Pressable
                  onPress={handleSend}
                  style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}
                >
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Yuborish</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '600', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  recipient: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  btn: { padding: 14, borderRadius: 12 },
});
