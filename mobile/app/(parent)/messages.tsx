import { useMemo, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Badge, Button } from '@/components/ui';
import type { Message } from '@shared/types';

const TYPE_CONFIG = {
  info: { icon: 'information-circle' as const, color: '#5AC8FA', label: "Ma'lumot" },
  warning: { icon: 'warning' as const, color: '#FF9500', label: 'Ogohlantirish' },
  success: { icon: 'checkmark-circle' as const, color: '#34C759', label: 'Yangilik' },
  event: { icon: 'calendar' as const, color: '#9588E8', label: 'Tadbir' },
  direct: { icon: 'chatbubble-ellipses' as const, color: '#AF52DE', label: 'Shaxsiy' },
};

function visibleToParent(msg: Message, userId: string | undefined, phone: string) {
  if (!msg.toAudience || msg.toAudience === 'all' || msg.toAudience === 'parents') return true;
  if (msg.fromUserId && userId && msg.fromUserId === userId) return true;
  if (msg.toAudience === 'user') {
    if (userId && msg.toUserId === userId) return true;
    if (phone && msg.toUserId === phone.replace(/\s/g, '')) return true;
  }
  return false;
}

export default function ParentMessagesScreen() {
  const {
    messages, markMessageRead, addMessage, authUser, parentPhone,
    teachers, students, circles,
  } = useStore();
  const { colors } = useTheme();
  const phone = parentPhone || authUser?.phone || '';

  const inbox = useMemo(
    () => messages.filter((m) => visibleToParent(m, authUser?.id, phone)),
    [messages, authUser?.id, phone]
  );
  const unread = inbox.filter((m) => !m.read).length;

  const [composeOpen, setComposeOpen] = useState(false);
  const [viewMsg, setViewMsg] = useState<Message | null>(null);
  const [form, setForm] = useState({ title: '', content: '', toUserId: '', toName: '' });

  const recipientOptions = useMemo(() => {
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
  }, [teachers, students, circles, phone]);

  const openMessage = (msg: Message) => {
    setViewMsg(msg);
    if (!msg.read) markMessageRead(msg.id);
  };

  const handleSend = () => {
    if (!form.title.trim() || !form.content.trim() || !form.toUserId) return;
    addMessage({
      title: form.title.trim(),
      content: form.content.trim(),
      type: 'direct',
      fromName: authUser?.fullName || 'Ota-ona',
      fromRole: 'parent',
      fromUserId: authUser?.id,
      toAudience: 'user',
      toUserId: form.toUserId,
      toName: form.toName || recipientOptions.find((r) => r.value === form.toUserId)?.name,
    });
    setForm({ title: '', content: '', toUserId: '', toName: '' });
    setComposeOpen(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.dark }]}>
          Xabarlar {unread > 0 ? `(${unread})` : ''}
        </Text>
        <Button label="Yuborish" onPress={() => setComposeOpen(true)} colors={colors} />
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
                    <Text
                      style={{ color: msg.read ? colors.muted : colors.dark, fontWeight: '600', fontSize: 15 }}
                      numberOfLines={1}
                    >
                      {msg.title}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
                      {msg.content}
                    </Text>
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
                <Text style={{ color: colors.muted, fontSize: 12 }}>{viewMsg.date}</Text>
                {viewMsg.fromName && (
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
                    Kimdan: {viewMsg.fromName}
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

      <Modal visible={composeOpen} animationType="slide" transparent onRequestClose={() => setComposeOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modal, { backgroundColor: colors.card, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17 }}>Murabbiyga xabar</Text>
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
                style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.dark }]}
              />
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>Murabbiy</Text>
              {recipientOptions.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => setForm((f) => ({ ...f, toUserId: r.value, toName: r.name }))}
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
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Pressable
                  onPress={() => setComposeOpen(false)}
                  style={[styles.btn, { backgroundColor: colors.surface, flex: 1 }]}
                >
                  <Text style={{ color: colors.muted, textAlign: 'center' }}>Bekor</Text>
                </Pressable>
                <Pressable onPress={handleSend} style={[styles.btn, { backgroundColor: colors.primary, flex: 1 }]}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Yuborish</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  heading: { fontSize: 20, fontWeight: '700', flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  recipient: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
  btn: { padding: 14, borderRadius: 12 },
});
