import { useMemo, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Pressable, Image, Modal, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import { ActiveCirclesCarousel } from '@/components/ActiveCirclesCarousel';
import { ParentPayCheckout } from '@/components/ParentPayCheckout';
import { getCircleImage } from '@shared/data/circleImages';
import {
  centerNews,
  centerActivities,
  homeworkCatalog,
  literatureCatalog,
  GAME_CATEGORY_LABELS,
  gamesForAge,
  type CenterNewsItem,
  type CenterActivity,
  type LiteratureItem,
} from '@shared/data/parentContent';
import { parentTips } from '@shared/data/gameEngines';
import { PAYMENT_STATUS_LABELS, MONTHLY_FEE, CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS } from '@shared/types';
import type { Payment, Circle } from '@shared/types';

const DAY_NAMES = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

function formatMoney(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
}

export default function ParentPortalScreen() {
  const router = useRouter();
  const {
    authUser, parentPhone, students, circles, payments, projects, attendance,
    schedule, logout, updatePayment, submitEnrollment, addMessage,
  } = useStore();
  const { colors } = useTheme();

  const phone = parentPhone || authUser?.phone || '';
  const myChildren = students.filter((s) => s.parentPhone.replace(/\s/g, '') === phone.replace(/\s/g, ''));
  const [childId, setChildId] = useState(myChildren[0]?.id || '');
  const child = myChildren.find((c) => c.id === childId) || myChildren[0];

  const [payTarget, setPayTarget] = useState<Payment | null>(null);
  const [enrollCircle, setEnrollCircle] = useState<Circle | null>(null);
  const [enrollNote, setEnrollNote] = useState('');
  const [enrollSent, setEnrollSent] = useState(false);
  const [circleDetail, setCircleDetail] = useState<Circle | null>(null);
  const [newsItem, setNewsItem] = useState<CenterNewsItem | null>(null);
  const [activityItem, setActivityItem] = useState<CenterActivity | null>(null);
  const [litItem, setLitItem] = useState<LiteratureItem | null>(null);

  const todayName = DAY_NAMES[new Date().getDay()];
  const todayIso = new Date().toISOString().slice(0, 10);

  const data = useMemo(() => {
    if (!child) return null;
    const childCircles = circles.filter((c) => child.circleIds.includes(c.id));
    const enrolledIds = new Set(child.circleIds);
    const available = circles
      .filter(
        (c) =>
          (c.status === 'active' || c.status === 'planned') &&
          !enrolledIds.has(c.id) &&
          c.enrolled < c.capacity &&
          !c.isNetwork
      )
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 10);
    const childPayments = payments.filter((p) => p.studentId === child.id);
    const unpaid = childPayments.filter((p) => p.status !== 'paid');
    const childAtt = attendance.filter((a) => a.studentId === child.id);
    const attRate = childAtt.length
      ? Math.round((childAtt.filter((a) => a.present).length / childAtt.length) * 100)
      : 0;
    const todayLessons = schedule
      .filter((s) => s.day === todayName && child.circleIds.includes(s.circleId))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const homework = homeworkCatalog.filter(
      (h) =>
        (child.circleIds.includes(h.circleId) || child.circleIds.length === 0) &&
        child.age >= h.ageMin &&
        child.age <= h.ageMax
    );
    const weekSchedule = schedule
      .filter((s) => child.circleIds.includes(s.circleId))
      .sort((a, b) => {
        const di = DAY_NAMES.indexOf(a.day) - DAY_NAMES.indexOf(b.day);
        return di !== 0 ? di : a.startTime.localeCompare(b.startTime);
      });
    const literature = literatureCatalog.filter(
      (l) => child.age >= l.ageMin && child.age <= l.ageMax
    );
    const games = gamesForAge(child.age);
    const childProjects = projects.filter((p) => p.studentId === child.id);
    return {
      childCircles, available, childPayments, unpaid, childAtt, attRate,
      todayLessons, homework, weekSchedule, literature, games, childProjects,
    };
  }, [child, circles, payments, attendance, schedule, projects, todayName]);

  const allUnpaid = useMemo(() => {
    const ids = new Set(myChildren.map((c) => c.id));
    return payments.filter((p) => ids.has(p.studentId) && p.status !== 'paid');
  }, [myChildren, payments]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handlePaySuccess = (info: {
    provider: 'click' | 'payme';
    amount: number;
    transactionId: string;
    phone: string;
  }) => {
    if (!payTarget || !child) return;
    updatePayment(payTarget.id, { status: 'paid', paidAt: todayIso });
    addMessage({
      title: `To'lov qabul qilindi — ${payTarget.circleName}`,
      content:
        `${child.firstName} ${child.lastName} (${child.grade}-sinf) uchun «${payTarget.circleName}» to'garagiga ` +
        `${formatMoney(info.amount)} miqdorida ${info.provider === 'click' ? 'Click' : 'Payme'} orqali to'lov qilindi.\n\n` +
        `Tranzaksiya: ${info.transactionId}\nTelefon: ${info.phone}\nOy: ${payTarget.month}\nSana: ${todayIso}`,
      type: 'success',
      fromName: "Kelajak Markazi — To'lovlar",
      fromRole: 'admin',
      toAudience: 'user',
      toUserId: phone.replace(/\s/g, ''),
      toName: authUser?.fullName || 'Ota-ona',
    });
  };

  const handleEnroll = async () => {
    if (!child || !enrollCircle) return;
    const err = await submitEnrollment({
      firstName: child.firstName,
      lastName: child.lastName,
      age: child.age,
      school: child.school,
      grade: child.grade,
      parentName: child.parentName || authUser?.fullName || 'Ota-ona',
      parentPhone: phone,
      circleId: enrollCircle.id,
      circleName: enrollCircle.name,
      note: enrollNote.trim() || undefined,
    });
    if (!err) setEnrollSent(true);
  };

  const lessonLabel = (circleId: string, start: string, end: string) => {
    const rec = attendance.find(
      (a) => a.studentId === child?.id && a.circleId === circleId && a.date === todayIso
    );
    const now = new Date();
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const s = new Date(now); s.setHours(sh, sm, 0, 0);
    const e = new Date(now); e.setHours(eh, em, 0, 0);
    if (rec?.present) return now > e ? { t: 'Ketdi', c: '#5AC8FA' } : { t: 'Keldi', c: '#34C759' };
    if (now > e) return { t: 'Qatnashmadi', c: colors.danger };
    if (now >= s) return { t: 'Dars vaqti', c: colors.warning };
    return { t: 'Kutilmoqda', c: colors.primary };
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      <Text style={[styles.greeting, { color: colors.dark }]}>
        Salom, {authUser?.fullName || 'Ota-ona'}!
      </Text>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>{phone}</Text>

      <View style={styles.navRow}>
        <Button label="O'yinlar" onPress={() => router.push('/(parent)/games')} colors={colors} />
        <Button label="Xabarlar" onPress={() => router.push('/(parent)/messages')} colors={colors} variant="ghost" />
      </View>

      <ActiveCirclesCarousel />

      {allUnpaid.length > 0 && (
        <Card colors={colors} style={{ borderColor: colors.warning, marginBottom: 8 }}>
          <Text style={{ color: colors.dark, fontWeight: '600' }}>
            {allUnpaid.length} ta to'lov kutilmoqda
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
            Jami {formatMoney(allUnpaid.reduce((s, p) => s + p.amount, 0))} — pastdan onlayn to'lang
          </Text>
        </Card>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {[
          { label: "To'lov", go: () => {} },
          { label: "O'yinlar", go: () => router.push('/(parent)/games') },
          { label: 'Xabarlar', go: () => router.push('/(parent)/messages') },
          { label: 'Sudoku', go: () => router.push({ pathname: '/(parent)/games', params: { cat: 'logic' } }) },
        ].map((q) => (
          <Pressable
            key={q.label}
            onPress={q.go}
            style={[styles.childChip, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>{q.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {myChildren.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {myChildren.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setChildId(c.id)}
              style={[
                styles.childChip,
                {
                  backgroundColor: child?.id === c.id ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: child?.id === c.id ? '#fff' : colors.dark, fontWeight: '600', fontSize: 13 }}>
                {c.firstName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {!child || !data ? (
        <Card colors={colors}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>Bola topilmadi</Text>
        </Card>
      ) : (
        <>
          <Card colors={colors} style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
              {child.firstName} {child.lastName}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>
              {child.age} yosh · {child.grade}-sinf · {child.school}
            </Text>
            {child.achievements > 0 && (
              <Text style={{ color: '#FFE66D', fontSize: 12, fontWeight: '700', marginTop: 8 }}>
                ★ {child.achievements} yutuq
              </Text>
            )}
          </Card>

          <View style={styles.statsRow}>
            {[
              { l: 'Davomat', v: `${data.attRate}%` },
              { l: "To'garak", v: String(data.childCircles.length) },
              { l: "To'lov", v: String(data.unpaid.length) },
              { l: 'Bugun', v: String(data.todayLessons.length) },
            ].map((s) => (
              <View key={s.l} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.muted, fontSize: 11 }}>{s.l}</Text>
                <Text style={{ color: colors.dark, fontSize: 18, fontWeight: '700', marginTop: 2 }}>{s.v}</Text>
              </View>
            ))}
          </View>

          {/* News */}
          <Text style={[styles.section, { color: colors.dark }]}>Markaz yangiliklari</Text>
          {centerNews.map((n) => (
            <Pressable key={n.id} onPress={() => setNewsItem(n)}>
              <Card colors={colors}>
                <View style={styles.rowBetween}>
                  <Text style={{ color: colors.dark, fontWeight: '600', flex: 1 }}>{n.title}</Text>
                  <Badge label={n.tag} color={colors.primary} />
                </View>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }} numberOfLines={2}>{n.summary}</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 8 }}>To'liq o'qish →</Text>
              </Card>
            </Pressable>
          ))}

          {/* Activities */}
          <Text style={[styles.section, { color: colors.dark }]}>Markaz faoliyati</Text>
          {centerActivities.map((a) => (
            <Pressable key={a.id} onPress={() => setActivityItem(a)}>
              <Card colors={colors}>
                <Text style={{ color: colors.dark, fontWeight: '600' }}>{a.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }} numberOfLines={2}>{a.description}</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 8 }}>Batafsil →</Text>
              </Card>
            </Pressable>
          ))}

          {/* Circles enrolled */}
          <Text style={[styles.section, { color: colors.dark }]}>O'qiyotgan to'garaklar</Text>
          {data.childCircles.length === 0 ? (
            <Card colors={colors}>
              <Text style={{ color: colors.muted, textAlign: 'center' }}>Hozircha yo'q</Text>
            </Card>
          ) : (
            data.childCircles.map((c) => (
              <Card key={c.id} colors={colors} noPadding style={{ overflow: 'hidden' }}>
                <Image source={{ uri: getCircleImage(c) }} style={styles.cover} />
                <View style={{ padding: 14 }}>
                  <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                    {c.teacher} · {c.schedule}
                  </Text>
                  <ProgressBar value={c.progress} colors={colors} />
                  <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600', marginTop: 6 }}>✓ O'qimoqda</Text>
                </View>
              </Card>
            ))
          )}

          {/* Available */}
          <Text style={[styles.section, { color: colors.dark }]}>Yozilish mumkin</Text>
          {data.available.map((c) => (
            <Pressable key={c.id} onPress={() => setCircleDetail(c)}>
              <Card colors={colors} noPadding style={{ overflow: 'hidden' }}>
                <Image source={{ uri: getCircleImage(c) }} style={styles.cover} />
                <View style={{ padding: 14 }}>
                  <Text style={{ color: colors.dark, fontWeight: '700' }}>{c.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                    {c.ageRange} · {c.enrolled}/{c.capacity} · {formatMoney(c.fee || MONTHLY_FEE)}
                  </Text>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 8 }}>
                    Tavsifni ochish →
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}

          {/* Payments */}
          <Text style={[styles.section, { color: colors.dark }]}>Onlayn to'lov</Text>
          <Card colors={colors}>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
              Badal: {formatMoney(MONTHLY_FEE)}/oy
            </Text>
            {data.childPayments.length === 0 ? (
              <Text style={{ color: colors.muted }}>To'lovlar yo'q</Text>
            ) : (
              data.childPayments.map((p) => (
                <View key={p.id} style={[styles.payRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.dark, fontWeight: '600', fontSize: 13 }}>{p.circleName}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>{p.month} · {formatMoney(p.amount)}</Text>
                  </View>
                  <Badge
                    label={PAYMENT_STATUS_LABELS[p.status]}
                    color={p.status === 'paid' ? colors.success : colors.warning}
                  />
                  {p.status !== 'paid' && (
                    <Pressable
                      onPress={() => setPayTarget(p)}
                      style={[styles.payBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>To'lash</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </Card>

          {/* Lessons */}
          <Text style={[styles.section, { color: colors.dark }]}>Bugungi darslar · keldi/ketdi</Text>
          <Card colors={colors}>
            <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 8 }}>{todayName}</Text>
            {data.todayLessons.length === 0 ? (
              <Text style={{ color: colors.muted }}>Bugun dars yo'q</Text>
            ) : (
              data.todayLessons.map((l) => {
                const st = lessonLabel(l.circleId, l.startTime, l.endTime);
                return (
                  <View key={l.id} style={[styles.lessonRow, { backgroundColor: colors.surface }]}>
                    <View style={{ width: 48 }}>
                      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{l.startTime}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.dark, fontWeight: '600', fontSize: 13 }}>{l.circleName}</Text>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>
                        {l.teacher} · {l.room} · {l.endTime}
                      </Text>
                    </View>
                    <Badge label={st.t} color={st.c} />
                  </View>
                );
              })
            )}
          </Card>

          <Text style={[styles.section, { color: colors.dark }]}>So'nggi davomat</Text>
          <Card colors={colors}>
            {data.childAtt.slice(-6).reverse().map((a) => (
              <View key={a.id} style={styles.payRow}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>{a.date}</Text>
                <Text style={{ color: a.present ? colors.success : colors.danger, fontWeight: '600', fontSize: 12 }}>
                  {a.present ? 'Keldi' : 'Kelmadi'}
                </Text>
              </View>
            ))}
            {data.childAtt.length === 0 && (
              <Text style={{ color: colors.muted }}>Davomat yo'q</Text>
            )}
          </Card>

          <Text style={[styles.section, { color: colors.dark }]}>Haftalik jadval</Text>
          <Card colors={colors}>
            {DAY_NAMES.filter((d) => d !== 'Yakshanba').map((day) => {
              const items = data.weekSchedule.filter((s) => s.day === day);
              if (!items.length) return null;
              return (
                <View key={day} style={{ marginBottom: 10 }}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{day}</Text>
                  {items.map((s) => (
                    <Text key={s.id} style={{ color: colors.dark, fontSize: 13, marginTop: 4 }}>
                      {s.startTime}–{s.endTime} · {s.circleName}
                    </Text>
                  ))}
                </View>
              );
            })}
            {data.weekSchedule.length === 0 && (
              <Text style={{ color: colors.muted }}>Jadval yo'q</Text>
            )}
          </Card>

          {/* Homework */}
          <Text style={[styles.section, { color: colors.dark }]}>Uyga vazifalar</Text>
          {data.homework.length === 0 ? (
            <Card colors={colors}><Text style={{ color: colors.muted }}>Vazifa yo'q</Text></Card>
          ) : (
            data.homework.map((hw) => (
              <Card key={hw.id} colors={colors}>
                <Badge label={hw.subject} color={colors.primary} />
                <Text style={{ color: colors.dark, fontWeight: '700', marginTop: 8 }}>{hw.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{hw.description}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 8 }}>Muddat: {hw.dueDate}</Text>
              </Card>
            ))
          )}

          {/* Literature */}
          <Text style={[styles.section, { color: colors.dark }]}>Adabiyotlar</Text>
          {data.literature.map((lit) => (
            <Pressable key={lit.id} onPress={() => setLitItem(lit)}>
              <Card colors={colors}>
                <Badge label={lit.subject} color="#AF52DE" />
                <Text style={{ color: colors.dark, fontWeight: '700', marginTop: 8 }}>{lit.title}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{lit.author} · {lit.level}</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 8 }}>O'qish →</Text>
              </Card>
            </Pressable>
          ))}

          <Text style={[styles.section, { color: colors.dark }]}>Ota-ona maslahatlari</Text>
          {parentTips.map((tip) => (
            <Card key={tip.id} colors={colors}>
              <Text style={{ color: colors.dark, fontWeight: '700' }}>{tip.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>{tip.body}</Text>
            </Card>
          ))}

          {/* Games */}
          <Text style={[styles.section, { color: colors.dark }]}>Interaktiv o'yinlar</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
            Sudoku, 2048, rangli o'yinlar va fan mashqlari
          </Text>
          <View style={styles.gameCats}>
            {(['math', 'attention', 'language', 'logic'] as const).map((cat) => (
              <Pressable
                key={cat}
                onPress={() => router.push({ pathname: '/(parent)/games', params: { cat } })}
                style={[styles.gameCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 13 }}>
                  {GAME_CATEGORY_LABELS[cat]}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                  {data.games.filter((g) => g.category === cat).length} ta o'yin
                </Text>
              </Pressable>
            ))}
          </View>

          {data.childProjects.length > 0 && (
            <>
              <Text style={[styles.section, { color: colors.dark }]}>Loyihalar</Text>
              {data.childProjects.map((p) => (
                <Card key={p.id} colors={colors}>
                  <Text style={{ color: colors.dark, fontWeight: '600' }}>{p.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{p.description}</Text>
                  {p.awards?.[0] ? (
                    <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '600', marginTop: 6 }}>
                      {p.awards[0]}
                    </Text>
                  ) : null}
                </Card>
              ))}
            </>
          )}
        </>
      )}

      <Button label="Chiqish" onPress={handleLogout} colors={colors} variant="danger" />

      {payTarget && child && (
        <ParentPayCheckout
          visible={!!payTarget}
          onClose={() => setPayTarget(null)}
          payment={payTarget}
          student={child}
          parentPhone={phone}
          colors={colors}
          onSuccess={handlePaySuccess}
        />
      )}

      {/* News detail */}
      <Modal visible={!!newsItem} transparent animationType="slide" onRequestClose={() => setNewsItem(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card, maxHeight: '85%' }]}>
            <Text style={{ color: colors.dark, fontWeight: '800', fontSize: 17 }}>{newsItem?.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{newsItem?.date} · {newsItem?.tag}</Text>
            <ScrollView style={{ marginTop: 12 }}>
              <Text style={{ color: colors.dark, fontSize: 14, lineHeight: 22 }}>{newsItem?.content}</Text>
            </ScrollView>
            <Button label="Yopish" onPress={() => setNewsItem(null)} colors={colors} />
          </View>
        </View>
      </Modal>

      {/* Activity detail */}
      <Modal visible={!!activityItem} transparent animationType="slide" onRequestClose={() => setActivityItem(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card, maxHeight: '85%' }]}>
            <Text style={{ color: colors.dark, fontWeight: '800', fontSize: 17 }}>{activityItem?.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>
              {activityItem?.date}{activityItem?.time ? ` · ${activityItem.time}` : ''}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{activityItem?.place} · {activityItem?.audience}</Text>
            <ScrollView style={{ marginTop: 12 }}>
              <Text style={{ color: colors.dark, fontSize: 14, lineHeight: 22 }}>{activityItem?.details}</Text>
            </ScrollView>
            <Button label="Yopish" onPress={() => setActivityItem(null)} colors={colors} />
          </View>
        </View>
      </Modal>

      {/* Circle detail */}
      <Modal visible={!!circleDetail} transparent animationType="slide" onRequestClose={() => setCircleDetail(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card, maxHeight: '90%' }]}>
            {circleDetail && (
              <ScrollView>
                <Image source={{ uri: getCircleImage(circleDetail) }} style={{ width: '100%', height: 140, borderRadius: 12 }} />
                <Text style={{ color: colors.dark, fontWeight: '800', fontSize: 18, marginTop: 12 }}>{circleDetail.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                  {CATEGORY_LABELS[circleDetail.category]} · {STATUS_LABELS[circleDetail.status]}
                </Text>
                <Text style={{ color: colors.dark, fontSize: 13, marginTop: 10 }}>Murabbiy: {circleDetail.teacher}</Text>
                <Text style={{ color: colors.dark, fontSize: 13 }}>Jadval: {circleDetail.schedule}</Text>
                <Text style={{ color: colors.dark, fontSize: 13 }}>Joy: {circleDetail.location}</Text>
                <Text style={{ color: colors.dark, fontSize: 13 }}>Yosh: {circleDetail.ageRange}</Text>
                <Text style={{ color: colors.dark, fontSize: 13 }}>
                  O'rin: {circleDetail.enrolled}/{circleDetail.capacity}
                </Text>
                <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 6 }}>
                  Badal: {formatMoney(circleDetail.fee || MONTHLY_FEE)}/oy
                </Text>
                <Text style={{ color: colors.dark, fontWeight: '700', marginTop: 12 }}>Nima o'rgatiladi?</Text>
                <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 }}>
                  {circleDetail.description || `${circleDetail.name} to'garagida amaliy mashg'ulotlar.`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                  <Pressable
                    onPress={() => setCircleDetail(null)}
                    style={[styles.modalBtn, { backgroundColor: colors.surface, flex: 1 }]}
                  >
                    <Text style={{ color: colors.muted, textAlign: 'center' }}>Yopish</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setEnrollCircle(circleDetail);
                      setEnrollNote('');
                      setEnrollSent(false);
                      setCircleDetail(null);
                    }}
                    style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Yozilish</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Literature reader */}
      <Modal visible={!!litItem} transparent animationType="slide" onRequestClose={() => setLitItem(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card, maxHeight: '90%' }]}>
            <Text style={{ color: colors.dark, fontWeight: '800', fontSize: 17 }}>{litItem?.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
              {litItem?.author} · {litItem?.level}
            </Text>
            <ScrollView style={{ marginTop: 12, maxHeight: 360 }}>
              <Text style={{ color: colors.dark, fontSize: 14, lineHeight: 22 }}>{litItem?.content}</Text>
            </ScrollView>
            <Button label="Yopish" onPress={() => setLitItem(null)} colors={colors} />
          </View>
        </View>
      </Modal>

      {/* Enroll modal */}
      <Modal visible={!!enrollCircle} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            {enrollSent ? (
              <>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} style={{ alignSelf: 'center' }} />
                <Text style={{ color: colors.dark, fontWeight: '700', textAlign: 'center', marginTop: 12 }}>
                  Ariza yuborildi!
                </Text>
                <Button label="Yopish" onPress={() => setEnrollCircle(null)} colors={colors} />
              </>
            ) : enrollCircle && child ? (
              <>
                <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17 }}>Yozilish</Text>
                <Text style={{ color: colors.muted, marginTop: 8, lineHeight: 20 }}>
                  {child.firstName} ni «{enrollCircle.name}» ga yozdirish
                </Text>
                <TextInput
                  placeholder="Izoh (ixtiyoriy)"
                  placeholderTextColor={colors.muted}
                  value={enrollNote}
                  onChangeText={setEnrollNote}
                  style={[styles.input, { borderColor: colors.border, color: colors.dark }]}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => setEnrollCircle(null)}
                    style={[styles.modalBtn, { backgroundColor: colors.surface, flex: 1 }]}
                  >
                    <Text style={{ color: colors.muted, textAlign: 'center' }}>Bekor</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleEnroll}
                    style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Yuborish</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 0 },
  greeting: { fontSize: 22, fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  childChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statBox: { flex: 1, padding: 10, borderRadius: 14, borderWidth: 1 },
  section: { fontSize: 17, fontWeight: '700', marginTop: 18, marginBottom: 10 },
  cover: { width: '100%', height: 100 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  payBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, marginBottom: 6 },
  gameCats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  gameCard: { width: '48%', padding: 14, borderRadius: 14, borderWidth: 1 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalBtn: { padding: 14, borderRadius: 12 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginVertical: 12 },
});
