import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { ActiveCirclesCarousel } from '@/components/ActiveCirclesCarousel';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { Card, StatCard, SectionTitle, Badge, ProgressBar, InfoRow } from '@/components/ui';
import { MiniBarChart, GaugeChart, DonutChart, CategoryLegend, MiniLineChart } from '@/components/charts';
import {
  monthlyEnrollmentData,
} from '@shared/data/initialData';
import { CATEGORY_LABELS, CATEGORY_COLORS, MONTHLY_FEE } from '@shared/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { circles, students, payments, projects, authUser, attendance, schedule, centerInfo } = useStore();
  const { colors } = useTheme();
  const canOpenPayments =
    authUser?.role === 'admin' || authUser?.role === 'district_admin';
  const isViloyat = authUser?.role === 'superadmin';

  const activeCircles = circles.filter((c) => c.status === 'active').length;
  const networkCircles = circles.filter((c) => c.isNetwork).length;
  const totalEnrolled = circles.reduce((s, c) => s + c.enrolled, 0);
  const monthlyRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const topCircle = circles.find((c) => c.category === 'it' && c.status === 'active') || circles[0];
  const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const todayName = dayNames[new Date().getDay()];
  const todaySchedule = schedule.filter((s) => s.day === todayName).slice(0, 4);
  const formatMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

  const present = attendance.filter((a) => a.present).length;
  const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;

  const categoryDistribution = Object.values(
    circles.reduce((acc, c) => {
      const key = c.category;
      if (!acc[key]) acc[key] = { name: CATEGORY_LABELS[c.category]?.split(' ')[0] || key, value: 0, color: CATEGORY_COLORS[c.category] };
      acc[key].value += c.enrolled;
      return acc;
    }, {} as Record<string, { name: string; value: number; color: string }>)
  );

  const attendanceTrend = (() => {
    const weeks: Record<string, { p: number; t: number }> = {};
    for (const a of attendance) {
      const w = `${Math.ceil(new Date(a.date).getDate() / 7)}-h`;
      if (!weeks[w]) weeks[w] = { p: 0, t: 0 };
      weeks[w].t += 1;
      if (a.present) weeks[w].p += 1;
    }
    const rows = Object.entries(weeks).map(([week, v]) => ({ week, rate: v.t ? Math.round((v.p / v.t) * 100) : 0 }));
    return rows.length ? rows : [{ week: '1-h', rate: attendanceRate }];
  })();

  return (
    <Screen
      title="Boshqaruv paneli"
      subtitle={`Xush kelibsiz, ${(authUser?.fullName ?? '').split(' ')[0] || 'foydalanuvchi'}!`}
    >
      <ActiveCirclesCarousel />

      <View style={styles.statsRow}>
        <StatCard
          title="Jami o'quvchilar"
          value={totalEnrolled}
          subtitle={`${students.filter((s) => s.status === 'active').length} faol ro'yxatda`}
          colors={colors}
          trend={{ value: 8, label: "o'tgan oydan" }}
          chart={<MiniBarChart data={monthlyEnrollmentData.slice(-4)} dataKey="students" />}
          onPress={() => router.push('/(tabs)/students')}
        />
        <StatCard
          title="Faol to'garaklar"
          value={activeCircles}
          subtitle={`${networkCircles} tarmoq to'garak`}
          colors={colors}
          icon="book-outline"
          trend={{ value: 2, label: 'yangi ochilgan' }}
          onPress={() => router.push('/(tabs)/circles')}
        />
      </View>

      <StatCard
        title="Oylik tushum"
        value={formatMoney(monthlyRevenue)}
        subtitle={`Badal: ${formatMoney(MONTHLY_FEE)}/oy`}
        colors={colors}
        icon="wallet-outline"
        trend={{ value: 15, label: "o'tgan oydan" }}
        style={{ minWidth: '100%' }}
        onPress={canOpenPayments ? () => router.push('/payments') : undefined}
      />

      {isViloyat && (
        <Card colors={colors}>
          <SectionTitle title="Viloyat monitoringi" colors={colors} />
          <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>
            Qashqadaryo — barcha tumanlar / tuman tanlash Sozlamalarda
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={{ backgroundColor: colors.primary + '18', padding: 12, borderRadius: 12, alignItems: 'center' }}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Tuman tanlash</Text>
          </Pressable>
        </Card>
      )}

      {topCircle && (
        <Card colors={colors}>
          <SectionTitle title="Asosiy to'garak" colors={colors} />
          <View style={styles.featuredRow}>
            <LinearGradient
              colors={['#9588E8' + '33', '#9588E8' + '08']}
              style={styles.featuredIcon}
            >
              <AppIcon name="hardware-chip-outline" size={36} color={colors.primary} />
              <Badge label={CATEGORY_LABELS[topCircle.category]} color={CATEGORY_COLORS[topCircle.category]} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.circleName, { color: colors.dark }]}>{topCircle.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                {topCircle.description}
              </Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <InfoRow label="Murabbiy" value={topCircle.teacher.split(' ').slice(0, 2).join(' ')} colors={colors} />
            <InfoRow label="Jadval" value={topCircle.schedule} colors={colors} />
            <InfoRow label="O'quvchilar" value={`${topCircle.enrolled}/${topCircle.capacity}`} colors={colors} />
            <InfoRow label="Yosh" value={topCircle.ageRange} colors={colors} />
          </View>
          <View style={{ marginTop: 12 }}>
            <ProgressBar value={topCircle.progress} colors={colors} showLabel />
          </View>
        </Card>
      )}

      <View style={styles.chartSection}>
        <Card colors={colors}>
          <SectionTitle title="Davomat ko'rsatkichi" colors={colors} />
          <GaugeChart value={attendanceRate} label="O'rtacha davomat" colors={colors} />
        </Card>

        <Card colors={colors}>
          <SectionTitle title="Yo'nalishlar" colors={colors} />
          <DonutChart items={categoryDistribution} />
          <CategoryLegend items={categoryDistribution} colors={colors} />
        </Card>
      </View>

      <Card colors={colors}>
        <View style={styles.cardHeader}>
          <SectionTitle title="Bugungi jadval" colors={colors} />
          <Badge label={`${todaySchedule.length} ta`} color={colors.primary} />
        </View>
        {todaySchedule.map((item) => (
          <View key={item.id} style={[styles.scheduleItem, { backgroundColor: colors.surface }]}>
            <View style={[styles.timeBox, { backgroundColor: colors.primary + '18' }]}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>{item.startTime}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.dark, fontSize: 13, fontWeight: '600' }}>{item.circleName}</Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>{item.teacher} · {item.room}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card colors={colors}>
        <View style={styles.cardHeader}>
          <SectionTitle title="Davomat dinamikasi" colors={colors} />
          <Badge label="+3%" color={colors.success} />
        </View>
        <MiniLineChart data={attendanceTrend} dataKey="rate" colors={colors} />
      </Card>

      <Card colors={colors}>
        <View style={styles.cardHeader}>
          <SectionTitle title="Innovatsion loyihalar" colors={colors} />
          <AppIcon name="trophy-outline" size={20} color={colors.primary} />
        </View>
        {projects.slice(0, 3).map((p, i) => (
          <View
            key={p.id}
            style={[
              styles.projectRow,
              { borderBottomColor: colors.border },
              i === 2 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.dark, fontWeight: '600', fontSize: 14 }}>{p.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{p.studentName}</Text>
              {p.awards?.[0] && (
                <Text style={{ color: colors.primary, fontSize: 11, marginTop: 4, fontWeight: '600' }}>
                  {p.awards[0]}
                </Text>
              )}
            </View>
            <Badge
              label={
                p.status === 'completed' ? 'Tugallangan' :
                p.status === 'competition' ? 'Tanlov' : 'Jarayonda'
              }
              color={
                p.status === 'completed' ? colors.success :
                p.status === 'competition' ? colors.warning : colors.primary
              }
            />
          </View>
        ))}
      </Card>

      <Card colors={colors}>
        <SectionTitle title="O'quvchilar o'sishi" colors={colors} />
        <MiniBarChart
          data={monthlyEnrollmentData}
          dataKey="students"
          height={120}
          showLabels
          labelKey="month"
        />
      </Card>

      <LinearGradient colors={['#9588E8', '#7B6FD4']} style={styles.centerCard}>
        <Text style={styles.centerTitle}>{centerInfo.name}</Text>
        <View style={styles.centerRow}>
          <AppIcon name="location-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.centerText}>{centerInfo.district}, {centerInfo.region}</Text>
        </View>
        <View style={styles.centerRow}>
          <AppIcon name="call-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.centerText}>{centerInfo.phone}</Text>
        </View>
        <View style={styles.centerRow}>
          <AppIcon name="mail-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.centerText}>{centerInfo.email}</Text>
        </View>
        <Text style={styles.centerFooter}>
          Mavsum: {centerInfo.seasonStart} — {centerInfo.seasonEnd} · {centerInfo.ageRange}
        </Text>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12 },
  featuredRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 12 },
  featuredIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  circleName: { fontSize: 17, fontWeight: '700' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  chartSection: { gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  timeBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  centerCard: { borderRadius: 20, padding: 18, marginBottom: 12 },
  centerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  centerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  centerText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  centerFooter: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
});
