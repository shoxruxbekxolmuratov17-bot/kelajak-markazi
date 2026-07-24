import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  Award,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Card, StatCard, Badge, ProgressBar } from '../components/ui';
import { ActiveCirclesCarousel } from '../components/ActiveCirclesCarousel';
import { useStore } from '../store/useStore';
import {
  monthlyEnrollmentData,
} from '../data/initialData';
import { getCircleImage } from '../data/circleImages';
import { CATEGORY_LABELS, CATEGORY_COLORS, MONTHLY_FEE } from '../types';
import type { Circle } from '../types';

function dash(v?: string | number | null) {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

function GaugeChart({ value, label }: { value: number; label: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" className="gauge-ring-bg" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="#9588E8" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="gauge-ring"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-dark">{value}</span>
          <span className="text-xs text-muted">%</span>
        </div>
      </div>
      <p className="text-sm font-medium text-muted mt-2">{label}</p>
    </div>
  );
}

function FeaturedCircle({ circle, onOpen }: { circle: Circle; onOpen: () => void }) {
  return (
    <Card className="flex flex-col md:flex-row gap-6 items-center !p-0 overflow-hidden" onClick={onOpen}>
      <div className="w-full md:w-48 h-40 relative flex-shrink-0">
        <img src={getCircleImage(circle)} alt={circle.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <Badge color={CATEGORY_COLORS[circle.category]}>
            {CATEGORY_LABELS[circle.category]}
          </Badge>
        </div>
      </div>
      <div className="flex-1 p-5 pt-0 md:pt-5">
        <h3 className="text-lg font-bold text-dark">{circle.name}</h3>
        <p className="text-sm text-muted mt-1 line-clamp-2">{circle.description}</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted">Mas'ul</p>
            <p className="text-sm font-medium text-dark">{circle.teacher}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Jadval</p>
            <p className="text-sm font-medium text-dark">{circle.schedule}</p>
          </div>
          <div>
            <p className="text-xs text-muted">O'quvchilar</p>
            <p className="text-sm font-medium text-dark">{circle.enrolled}/{circle.capacity}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Yosh oralig'i</p>
            <p className="text-sm font-medium text-dark">{circle.ageRange}</p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={circle.progress} showLabel color="#9588E8" />
        </div>
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    circles,
    students,
    payments,
    projects,
    attendance,
    schedule,
    enrollmentRequests,
    authUser,
    districts,
    activeDistrictId,
    setActiveDistrict,
    centerInfo,
  } = useStore();
  const isAdmin =
    authUser?.role === 'admin' ||
    authUser?.role === 'district_admin' ||
    authUser?.role === 'superadmin';
  const showRegionMonitor =
    authUser?.role === 'superadmin' && (!activeDistrictId || activeDistrictId === 'all');

  const go = (path: string, adminOnly = false) => {
    if (adminOnly && !isAdmin) return;
    navigate(path);
  };

  const districtMonitor = useMemo(() => {
    if (!showRegionMonitor || !districts.length) return [];
    return districts.map((d) => {
      const dCircles = circles.filter((c) => c.districtId === d.id);
      const dStudents = students.filter((s) => s.districtId === d.id && s.status === 'active');
      const dPaid = payments.filter((p) => p.districtId === d.id && p.status === 'paid');
      const revenue = dPaid.reduce((sum, p) => sum + p.amount, 0);
      return {
        id: d.id,
        name: d.name,
        circles: dCircles.length,
        enrolled: dCircles.reduce((s, c) => s + c.enrolled, 0),
        students: dStudents.length,
        revenue,
        hasData: dCircles.length > 0 || dStudents.length > 0,
      };
    });
  }, [showRegionMonitor, districts, circles, students, payments]);

  const stats = useMemo(() => {
    const activeCircles = circles.filter((c) => c.status === 'active' || c.status === 'full').length;
    const networkCircles = circles.filter((c) => c.isNetwork).length;
    const paidPayments = payments.filter((p) => p.status === 'paid');
    const monthlyRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const totalEnrolled = circles.reduce((sum, c) => sum + c.enrolled, 0);
    const present = attendance.filter((a) => a.present).length;
    const attendanceRate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;

    return {
      totalStudents: students.filter((s) => s.status === 'active').length,
      totalCircles: circles.length,
      activeCircles,
      networkCircles,
      monthlyRevenue,
      attendanceRate,
      newEnrollments: enrollmentRequests.filter((e) => e.status === 'pending').length,
      completedProjects,
      totalEnrolled,
    };
  }, [circles, students, payments, projects, attendance, enrollmentRequests]);

  const categoryDistribution = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    for (const c of circles) {
      const label = CATEGORY_LABELS[c.category] || c.category;
      if (!map[c.category]) {
        map[c.category] = { name: label.split(' ')[0], value: 0, color: CATEGORY_COLORS[c.category] };
      }
      map[c.category].value += c.enrolled;
    }
    return Object.values(map);
  }, [circles]);

  const attendanceData = useMemo(() => {
    const weeks: Record<string, { present: number; total: number }> = {};
    for (const a of attendance) {
      const day = new Date(a.date).getDate();
      const week = `${Math.ceil(day / 7)}-hafta`;
      if (!weeks[week]) weeks[week] = { present: 0, total: 0 };
      weeks[week].total += 1;
      if (a.present) weeks[week].present += 1;
    }
    const entries = Object.entries(weeks).map(([week, v]) => ({
      week,
      rate: v.total ? Math.round((v.present / v.total) * 100) : 0,
    }));
    return entries.length ? entries : [{ week: '1-hafta', rate: stats.attendanceRate || 0 }];
  }, [attendance, stats.attendanceRate]);

  const topCircle = useMemo(
    () => [...circles].filter((c) => c.enrolled > 0).sort((a, b) => b.enrolled - a.enrolled)[0] || circles[0],
    [circles]
  );
  const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const todayName = dayNames[new Date().getDay()];
  const todaySchedule = schedule.filter((s) => s.day === todayName).slice(0, 4);
  const recentProjects = projects.slice(0, 3);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";

  return (
    <div className="space-y-6 animate-fade-in">
      {showRegionMonitor && (
        <Card className="!p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-dark">Qashqadaryo viloyati — tuman monitoringi</h3>
              <p className="text-sm text-muted mt-0.5">
                Barcha tumanlar bo‘yicha umumiy ko‘rinish. Bitta tumanni ochish uchun bosing.
              </p>
            </div>
            <span className="text-xs text-muted">{districts.length} tuman/shahar</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {districtMonitor.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => void setActiveDistrict(d.id)}
                className="text-left rounded-xl border border-border bg-surface/60 hover:border-primary/40 hover:bg-primary/5 transition-colors p-4"
              >
                <p className="font-semibold text-dark text-sm">{d.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
                  <span>To‘garak: <strong className="text-dark">{d.circles}</strong></span>
                  <span>O‘quvchi: <strong className="text-dark">{d.students}</strong></span>
                  <span>Joy: <strong className="text-dark">{d.enrolled}</strong></span>
                  <span className={d.hasData ? 'text-primary' : ''}>
                    {d.hasData ? 'Faol' : 'Ma’lumot yo‘q'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <ActiveCirclesCarousel />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Jami o'quvchilar"
          value={stats.totalEnrolled}
          subtitle={`${stats.totalStudents} faol ro'yxatda`}
          trend={{ value: 8, label: "o'tgan oydan" }}
          onClick={() => go('/oquvchilar')}
          chart={
            <ResponsiveContainer width="100%" height={60}>
              <BarChart data={monthlyEnrollmentData.slice(-4)}>
                <Bar dataKey="students" fill="#9588E8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
        <StatCard
          title="Faol to'garaklar"
          value={stats.activeCircles}
          subtitle={`${stats.totalCircles} nomdagi · ${stats.networkCircles} tarmoq`}
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          trend={{ value: 2, label: 'yangi ochilgan' }}
          onClick={() => go('/togaraklar')}
        />
        <StatCard
          title="Oylik tushum"
          value={formatMoney(stats.monthlyRevenue)}
          subtitle={`Badal: ${formatMoney(MONTHLY_FEE)}/oy`}
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          trend={{ value: 15, label: "o'tgan oydan" }}
          onClick={() => go('/tolovlar', true)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <h3 className="font-semibold text-dark mb-4">Asosiy to'garak</h3>
            {topCircle ? (
              <FeaturedCircle circle={topCircle} onOpen={() => go('/togaraklar')} />
            ) : (
              <p className="text-sm text-muted">To'garaklar yo'q</p>
            )}
          </Card>

          <Card onClick={() => go('/jadval')}>
            <h3 className="font-semibold text-dark mb-4">Bugungi jadval</h3>
            <div className="space-y-3">
              {todaySchedule.length === 0 ? (
                <p className="text-sm text-muted">Bugun dars yo'q</p>
              ) : todaySchedule.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {item.startTime}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-dark">{item.circleName}</p>
                    <p className="text-xs text-muted">{item.teacher} · {item.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card className="flex flex-col items-center py-6" onClick={() => go('/davomat')}>
            <h3 className="font-semibold text-dark mb-4 self-start">Davomat ko'rsatkichi</h3>
            <GaugeChart value={stats.attendanceRate} label="O'rtacha davomat" />
          </Card>

          <Card onClick={() => go('/togaraklar')}>
            <h3 className="font-semibold text-dark mb-4">Yo'nalishlar</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%" cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {categoryDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {categoryDistribution.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-muted">{cat.name}</span>
                  <span className="font-medium ml-auto text-dark">{cat.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-primary text-white border-primary" onClick={() => go('/sozlamalar', true)}>
            <h3 className="font-semibold mb-3">Markaz ma'lumotlari</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 opacity-90">
                <MapPin className="w-4 h-4" />
                <span>{dash(centerInfo.district)}{centerInfo.region ? `, ${centerInfo.region}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 opacity-90">
                <Phone className="w-4 h-4" />
                <span>{dash(centerInfo.phone)}</span>
              </div>
              <div className="flex items-center gap-2 opacity-90">
                <Mail className="w-4 h-4" />
                <span>{dash(centerInfo.email)}</span>
              </div>
              {centerInfo.director ? (
                <div className="flex items-center gap-2 opacity-90 text-xs">
                  Direktor: {centerInfo.director}
                </div>
              ) : (
                <div className="opacity-80 text-xs">Direktor: — (kiritilmagan)</div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/20 text-xs opacity-80">
              {centerInfo.seasonStart || centerInfo.seasonEnd
                ? `Mavsum: ${dash(centerInfo.seasonStart)} — ${dash(centerInfo.seasonEnd)} · ${dash(centerInfo.ageRange)}`
                : `Ma'lumot: ${centerInfo.asOf || 'kiritilmagan'}`}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card onClick={() => go('/davomat')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark">Davomat dinamikasi</h3>
              <Badge color="#34C759">+3%</Badge>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={attendanceData}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#8E8E93" />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} stroke="#8E8E93" />
                <Line type="monotone" dataKey="rate" stroke="#9588E8" strokeWidth={2.5} dot={{ fill: '#9588E8', r: 4 }} />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card onClick={() => go('/loyihalar')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark">Innovatsion loyihalar</h3>
              <Award className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="p-3 rounded-xl border border-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-dark">{project.title}</p>
                      <p className="text-xs text-muted mt-0.5">{project.studentName}</p>
                    </div>
                    <Badge color={
                      project.status === 'completed' ? '#34C759' :
                      project.status === 'competition' ? '#FF9500' : '#9588E8'
                    }>
                      {project.status === 'completed' ? 'Tugallangan' :
                       project.status === 'competition' ? 'Tanlov' : 'Jarayonda'}
                    </Badge>
                  </div>
                  {project.awards && (
                    <p className="text-xs text-primary mt-2 font-medium">{project.awards[0]}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card onClick={() => go('/oquvchilar')}>
            <h3 className="font-semibold text-dark mb-3">O'quvchilar o'sishi</h3>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={monthlyEnrollmentData}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#8E8E93" />
                <Bar dataKey="students" fill="#9588E8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
