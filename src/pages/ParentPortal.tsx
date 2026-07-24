import { useMemo, useState } from 'react';
import {
  Award, Calendar, CreditCard, TrendingUp, Phone, CheckCircle, XCircle, MessageSquare,
  Newspaper, Sparkles, BookOpen, Library, Gamepad2, Clock, LogIn, LogOut, Plus, Wallet,
  Lightbulb, LayoutGrid,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, Badge, ProgressBar, Button, Modal, Input } from '../components/ui';
import { ActiveCirclesCarousel } from '../components/ActiveCirclesCarousel';
import { ParentPayCheckout } from '../components/parent/ParentPayCheckout';
import { useStore } from '../store/useStore';
import { PAYMENT_STATUS_LABELS, MONTHLY_FEE, CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS } from '../types';
import type { Payment, PaymentStatus, Circle } from '../types';
import { getCircleImage } from '../data/circleImages';
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
} from '../data/parentContent';
import { parentTips, PARENT_QUICK_LINKS } from '../data/gameEngines';

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  paid: '#34C759', pending: '#FF9500', overdue: '#FF3B30', partial: '#5AC8FA',
};

const DAY_NAMES = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

function formatMoney(n: number) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
}

function SectionTitle({ icon: Icon, title, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="font-bold text-dark flex items-center gap-2 text-lg">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </h3>
      {action}
    </div>
  );
}

export function ParentPortalPage() {
  const {
    parentPhone, authUser, students, circles, payments, attendance, projects,
    schedule, submitEnrollment, addMessage, hydrateFromApi,
  } = useStore();
  const phone = parentPhone || authUser?.phone || '';

  const myChildren = phone
    ? students.filter((s) => s.parentPhone.replace(/\s/g, '') === phone.replace(/\s/g, ''))
    : [];

  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const child = myChildren.find((c) => c.id === selectedChildId) || myChildren[0] || null;

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

  const childData = useMemo(() => {
    if (!child) return null;
    const childCircles = circles.filter((c) => child.circleIds.includes(c.id));
    const enrolledIds = new Set(child.circleIds);
    const availableCircles = circles
      .filter(
        (c) =>
          (c.status === 'active' || c.status === 'planned') &&
          !enrolledIds.has(c.id) &&
          c.enrolled < c.capacity &&
          !c.isNetwork
      )
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 12);
    const childPayments = payments.filter((p) => p.studentId === child.id);
    const unpaid = childPayments.filter((p) => p.status !== 'paid');
    const childAttendance = attendance.filter((a) => a.studentId === child.id);
    const presentCount = childAttendance.filter((a) => a.present).length;
    const attendanceRate = childAttendance.length
      ? Math.round((presentCount / childAttendance.length) * 100)
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
    const homeworkSoon = [...homework].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
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
      childCircles,
      availableCircles,
      childPayments,
      unpaid,
      childAttendance,
      presentCount,
      attendanceRate,
      todayLessons,
      homework,
      homeworkSoon,
      weekSchedule,
      literature,
      games,
      childProjects,
    };
  }, [child, circles, payments, attendance, schedule, projects, todayName]);

  const allUnpaid = useMemo(() => {
    const ids = new Set(myChildren.map((c) => c.id));
    return payments.filter((p) => ids.has(p.studentId) && p.status !== 'paid');
  }, [myChildren, payments]);

  const handlePaySuccess = (info: {
    provider: 'click' | 'payme';
    amount: number;
    transactionId: string;
    phone: string;
  }) => {
    if (!payTarget || !child) return;
    const paidAt = new Date().toISOString().slice(0, 10);
    // Status server (intent/webhook/sandbox) orqali — faqat UI sync
    void hydrateFromApi();
    addMessage({
      title: `To‘lov qabul qilindi — ${payTarget.circleName}`,
      content:
        `${child.firstName} ${child.lastName} (${child.grade}-sinf) uchun «${payTarget.circleName}» to‘garagiga ` +
        `${formatMoney(info.amount)} miqdorida ${info.provider === 'click' ? 'Click' : 'Payme'} orqali to‘lov qilindi.\n\n` +
        `Tranzaksiya: ${info.transactionId}\nTelefon: ${info.phone}\nOy: ${payTarget.month}\nSana: ${paidAt}`,
      type: 'success',
      fromName: 'Kelajak Markazi — To‘lovlar',
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

  const lessonStatus = (circleId: string, startTime: string, endTime: string) => {
    const rec = attendance.find(
      (a) => a.studentId === child?.id && a.circleId === circleId && a.date === todayIso
    );
    const now = new Date();
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const start = new Date(now);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(now);
    end.setHours(eh, em, 0, 0);

    if (rec?.present) {
      if (now > end) return { label: 'Ketdi', color: '#5AC8FA', icon: LogOut };
      return { label: 'Keldi', color: '#34C759', icon: LogIn };
    }
    if (now > end) return { label: 'Qatnashmadi', color: '#FF3B30', icon: XCircle };
    if (now >= start) return { label: 'Dars vaqti', color: '#FF9500', icon: Clock };
    return { label: 'Kutilmoqda', color: '#9588E8', icon: Clock };
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-dark">Salom, {authUser?.fullName || 'Ota-ona'}!</h2>
          <p className="text-sm text-muted flex items-center gap-1 mt-1">
            <Phone className="w-4 h-4" />{phone}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/ota-ona/oyinlar">
            <Button variant="secondary" size="sm">
              <Gamepad2 className="w-4 h-4" /> O‘yinlar
            </Button>
          </Link>
          <Link to="/ota-ona/xabarlar">
            <Button variant="secondary" size="sm">
              <MessageSquare className="w-4 h-4" /> Xabarlar
            </Button>
          </Link>
        </div>
      </div>

      {/* Promo carousel */}
      <section>
        <ActiveCirclesCarousel />
      </section>

      {/* Unpaid alert */}
      {allUnpaid.length > 0 && (
        <Card className="bg-warning/10 border-warning/30 flex flex-col sm:flex-row sm:items-center gap-3 !mb-0">
          <div className="flex items-center gap-3 flex-1">
            <Wallet className="w-5 h-5 text-warning flex-shrink-0" />
            <p className="text-sm text-dark">
              <strong>{allUnpaid.length} ta</strong> to‘lov kutilmoqda — jami{' '}
              <strong>{formatMoney(allUnpaid.reduce((s, p) => s + p.amount, 0))}</strong>
            </p>
          </div>
          <a href="#tolovlar">
            <Button size="sm">Onlayn to‘lash</Button>
          </a>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {PARENT_QUICK_LINKS.map((q) => {
          const inner = (
            <Card className="!p-3 text-center hover:shadow-md transition-shadow h-full">
              <LayoutGrid className="w-5 h-5 text-primary mx-auto" />
              <p className="text-xs font-semibold text-dark mt-1.5">{q.label}</p>
            </Card>
          );
          if ('path' in q && q.path) {
            return (
              <Link key={q.id} to={q.path}>
                {inner}
              </Link>
            );
          }
          return (
            <a key={q.id} href={`#${q.hash}`}>
              {inner}
            </a>
          );
        })}
      </div>

      {/* Child switcher */}
      {myChildren.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {myChildren.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedChildId(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                (child?.id === c.id)
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-dark hover:border-primary'
              }`}
            >
              {c.firstName} {c.lastName}
            </button>
          ))}
        </div>
      )}

      {!child || !childData ? (
        <Card>
          <p className="text-center text-muted py-10">
            Ushbu telefon raqamiga bog‘langan bola topilmadi.
          </p>
        </Card>
      ) : (
        <>
          {/* Child hero */}
          <Card className="bg-primary text-white border-primary !p-0 overflow-hidden">
            <div className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold flex-shrink-0">
                {child.firstName[0]}{child.lastName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold truncate">{child.firstName} {child.lastName}</h3>
                <p className="text-white/80 text-sm">
                  {child.age} yosh · {child.grade}-sinf · {child.school}
                </p>
              </div>
              {child.achievements > 0 && (
                <Badge color="#FF9500" className="bg-white/20 flex-shrink-0">
                  <Award className="w-3 h-3 inline mr-1" />{child.achievements} yutuq
                </Badge>
              )}
            </div>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="!p-4">
              <p className="text-xs text-muted">Davomat</p>
              <p className="text-2xl font-bold text-primary mt-1">{childData.attendanceRate}%</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs text-muted">To‘garaklar</p>
              <p className="text-2xl font-bold text-dark mt-1">{childData.childCircles.length}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs text-muted">To‘lanmagan</p>
              <p className="text-2xl font-bold text-warning mt-1">{childData.unpaid.length}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-xs text-muted">Bugungi dars</p>
              <p className="text-2xl font-bold text-dark mt-1">{childData.todayLessons.length}</p>
            </Card>
          </div>

          {/* News */}
          <section>
            <SectionTitle icon={Newspaper} title="Markaz yangiliklari" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {centerNews.map((n) => (
                <Card
                  key={n.id}
                  className="!p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setNewsItem(n)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-dark">{n.title}</h4>
                    <Badge color="#9588E8">{n.tag}</Badge>
                  </div>
                  <p className="text-sm text-muted mt-2 line-clamp-2">{n.summary}</p>
                  <p className="text-xs text-primary font-medium mt-3">To‘liq o‘qish →</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Activities */}
          <section>
            <SectionTitle icon={Sparkles} title="Markaz faoliyati" />
            <div className="space-y-2">
              {centerActivities.map((a) => (
                <Card
                  key={a.id}
                  className="!p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActivityItem(a)}
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-primary font-bold uppercase">
                      {a.date.slice(5, 7)}
                    </span>
                    <span className="text-lg font-bold text-primary">{a.date.slice(8, 10)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-dark">{a.title}</h4>
                    <p className="text-sm text-muted mt-0.5 line-clamp-2">{a.description}</p>
                    <p className="text-xs text-primary font-medium mt-2">Batafsil →</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Circles: enrolled + available */}
          <section id="togaraklar">
            <SectionTitle icon={BookOpen} title="To‘garaklar" />
            <p className="text-sm text-muted mb-3">
              Bolangiz qaysi to‘garakda o‘qiydi va qaysilariga yozilishi mumkin
            </p>

            <h4 className="text-sm font-semibold text-dark mb-2">O‘qiyotganlari</h4>
            {childData.childCircles.length === 0 ? (
              <Card className="mb-4">
                <p className="text-sm text-muted text-center py-4">Hozircha yozilgan to‘garak yo‘q</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {childData.childCircles.map((c) => (
                  <Card key={c.id} className="!p-0 overflow-hidden">
                    <img src={getCircleImage(c)} alt="" className="w-full h-28 object-cover" />
                    <div className="p-4">
                      <Badge color={CATEGORY_COLORS[c.category]}>{CATEGORY_LABELS[c.category].split(' ')[0]}</Badge>
                      <h4 className="font-semibold text-dark mt-2">{c.name}</h4>
                      <p className="text-xs text-muted mt-1">{c.teacher} · {c.schedule}</p>
                      <ProgressBar value={c.progress} color="#9588E8" size="sm" />
                      <p className="text-xs text-success font-medium mt-2">✓ O‘qimoqda</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <h4 className="text-sm font-semibold text-dark mb-2">Yozilish mumkin</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {childData.availableCircles.map((c) => (
                <Card
                  key={c.id}
                  className="!p-0 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setCircleDetail(c)}
                >
                  <img src={getCircleImage(c)} alt="" className="w-full h-28 object-cover" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Badge color={CATEGORY_COLORS[c.category]}>{CATEGORY_LABELS[c.category].split(' ')[0]}</Badge>
                      <Badge color="#5AC8FA">{STATUS_LABELS[c.status]}</Badge>
                    </div>
                    <h4 className="font-semibold text-dark mt-2">{c.name}</h4>
                    <p className="text-xs text-muted mt-1">
                      {c.ageRange} · {c.enrolled}/{c.capacity} · {formatMoney(c.fee || MONTHLY_FEE)}/oy
                    </p>
                    <p className="text-xs text-primary font-medium mt-3">Tavsifni ochish →</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Online payments */}
          <section id="tolovlar">
            <SectionTitle
              icon={Wallet}
              title="Onlayn to‘lov"
              action={<span className="text-xs text-muted">Badal: {formatMoney(MONTHLY_FEE)}/oy</span>}
            />
            <Card>
              {childData.childPayments.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">To‘lov yozuvlari yo‘q</p>
              ) : (
                <div className="space-y-3">
                  {childData.childPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface"
                    >
                      <div>
                        <p className="font-medium text-dark">{p.circleName}</p>
                        <p className="text-xs text-muted">{p.month} · {formatMoney(p.amount)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={PAYMENT_COLORS[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Badge>
                        {p.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => setPayTarget(p)}
                          >
                            <CreditCard className="w-4 h-4" /> To‘lash
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* Today's lessons / arrival departure */}
          <section id="darslar">
            <SectionTitle icon={Clock} title="Bugungi darslar · keldi / ketdi" />
            <Card>
              <p className="text-xs text-muted mb-3">{todayName} · {todayIso}</p>
              {childData.todayLessons.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">Bugun dars yo‘q</p>
              ) : (
                <div className="space-y-2">
                  {childData.todayLessons.map((lesson) => {
                    const st = lessonStatus(lesson.circleId, lesson.startTime, lesson.endTime);
                    const Icon = st.icon;
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface"
                      >
                        <div className="w-14 text-center flex-shrink-0">
                          <p className="text-sm font-bold text-primary">{lesson.startTime}</p>
                          <p className="text-[10px] text-muted">{lesson.endTime}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark truncate">{lesson.circleName}</p>
                          <p className="text-xs text-muted">{lesson.teacher} · {lesson.room}</p>
                        </div>
                        <Badge color={st.color}>
                          <Icon className="w-3 h-3 inline mr-1" />
                          {st.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-dark text-sm">So‘nggi davomat</h4>
              </div>
              <div className="space-y-1">
                {childData.childAttendance.slice(-6).reverse().map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-muted">{a.date}</span>
                    {a.present
                      ? <span className="text-success flex items-center gap-1 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> Keldi</span>
                      : <span className="text-danger flex items-center gap-1 text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> Kelmadi</span>}
                  </div>
                ))}
                {childData.childAttendance.length === 0 && (
                  <p className="text-sm text-muted">Davomat yozuvi yo‘q</p>
                )}
              </div>
            </Card>
          </section>

          {/* Weekly schedule */}
          <section>
            <SectionTitle icon={Calendar} title="Haftalik dars jadvali" />
            <Card>
              {childData.weekSchedule.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">Jadval yo‘q</p>
              ) : (
                <div className="space-y-2">
                  {DAY_NAMES.filter((d) => d !== 'Yakshanba').map((day) => {
                    const items = childData.weekSchedule.filter((s) => s.day === day);
                    if (!items.length) return null;
                    return (
                      <div key={day} className="p-3 rounded-xl bg-surface">
                        <p className="text-xs font-bold text-primary mb-2">{day}</p>
                        {items.map((s) => (
                          <div key={s.id} className="flex justify-between text-sm py-1 gap-2">
                            <span className="text-dark font-medium truncate">{s.circleName}</span>
                            <span className="text-muted flex-shrink-0">
                              {s.startTime}–{s.endTime} · {s.room}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </section>

          {/* Homework */}
          <section id="vazifalar">
            <SectionTitle icon={BookOpen} title="Uyga vazifalar" />
            {childData.homeworkSoon.length === 0 ? (
              <Card>
                <p className="text-sm text-muted text-center py-4">Hozircha uy vazifa yo‘q</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {childData.homeworkSoon.map((hw) => (
                  <Card key={hw.id} className="!p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge color="#9588E8">{hw.subject}</Badge>
                        <h4 className="font-semibold text-dark mt-2">{hw.title}</h4>
                        <p className="text-sm text-muted mt-1">{hw.description}</p>
                        <p className="text-xs text-muted mt-2">
                          {hw.circleName} · Muddat: {hw.dueDate}
                        </p>
                      </div>
                      <Calendar className="w-5 h-5 text-muted flex-shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Parent tips */}
          <section>
            <SectionTitle icon={Lightbulb} title="Ota-ona maslahatlari" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {parentTips.map((tip) => (
                <Card key={tip.id} className="!p-4">
                  <h4 className="font-semibold text-dark">{tip.title}</h4>
                  <p className="text-sm text-muted mt-1.5">{tip.body}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Literature */}
          <section>
            <SectionTitle icon={Library} title="Adabiyotlar" />
            <p className="text-sm text-muted mb-3">
              Bolangiz yoshi ({child.age}) va fanlariga mos tavsiyalar
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {childData.literature.map((lit) => (
                <Card
                  key={lit.id}
                  className="!p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLitItem(lit)}
                >
                  <Badge color="#AF52DE">{lit.subject}</Badge>
                  <h4 className="font-semibold text-dark mt-2">{lit.title}</h4>
                  <p className="text-xs text-muted mt-1">{lit.author} · {lit.level}</p>
                  <p className="text-sm text-muted mt-2 line-clamp-2">{lit.note}</p>
                  <p className="text-xs text-primary font-medium mt-3">O‘qish →</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Games preview */}
          <section>
            <SectionTitle
              icon={Gamepad2}
              title="Interaktiv o‘yinlar"
              action={
                <Link to="/ota-ona/oyinlar">
                  <Button size="sm" variant="secondary">Barchasi</Button>
                </Link>
              }
            />
            <p className="text-sm text-muted mb-3">
              Sudoku, 2048, rangli o‘yinlar, matematika va tillar — {child.age} yosh uchun
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['math', 'attention', 'language', 'logic'] as const).map((cat) => {
                const count = learningGamesCount(childData.games, cat);
                return (
                  <Link key={cat} to={`/ota-ona/oyinlar?cat=${cat}`}>
                    <Card className="hover:shadow-md transition-shadow h-full">
                      <h4 className="font-semibold text-dark">{GAME_CATEGORY_LABELS[cat]}</h4>
                      <p className="text-sm text-muted mt-1">{count} ta o‘yin · turli qiyinlik</p>
                      <p className="text-xs text-primary font-medium mt-3">O‘ynash →</p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Projects */}
          {childData.childProjects.length > 0 && (
            <section>
              <SectionTitle icon={Award} title="Loyihalar va yutuqlar" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {childData.childProjects.map((p) => (
                  <Card key={p.id} className="!p-4">
                    <p className="font-medium text-dark">{p.title}</p>
                    <p className="text-xs text-muted mt-1">{p.description}</p>
                    {p.awards?.[0] && (
                      <p className="text-xs text-warning font-medium mt-2">{p.awards[0]}</p>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Pay checkout — Click / Payme */}
      {payTarget && child && (
        <ParentPayCheckout
          open={!!payTarget}
          onClose={() => setPayTarget(null)}
          payment={payTarget}
          student={child}
          parentPhone={phone}
          onSuccess={handlePaySuccess}
        />
      )}

      {/* News detail */}
      <Modal isOpen={!!newsItem} onClose={() => setNewsItem(null)} title={newsItem?.title || 'Yangilik'} size="lg">
        {newsItem && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge color="#9588E8">{newsItem.tag}</Badge>
              <span className="text-xs text-muted">{newsItem.date}</span>
            </div>
            <p className="text-sm text-dark whitespace-pre-line leading-relaxed">{newsItem.content}</p>
            <Button className="w-full" variant="secondary" onClick={() => setNewsItem(null)}>Yopish</Button>
          </div>
        )}
      </Modal>

      {/* Activity detail */}
      <Modal isOpen={!!activityItem} onClose={() => setActivityItem(null)} title={activityItem?.title || 'Faoliyat'} size="lg">
        {activityItem && (
          <div className="space-y-3">
            <div className="rounded-xl bg-surface p-3 text-sm space-y-1">
              <p><span className="text-muted">Sana:</span> <strong>{activityItem.date}</strong></p>
              {activityItem.time && (
                <p><span className="text-muted">Vaqt:</span> <strong>{activityItem.time}</strong></p>
              )}
              <p><span className="text-muted">Joy:</span> <strong>{activityItem.place}</strong></p>
              <p><span className="text-muted">Auditoriya:</span> <strong>{activityItem.audience}</strong></p>
            </div>
            <p className="text-sm text-dark whitespace-pre-line leading-relaxed">{activityItem.details}</p>
            <Button className="w-full" variant="secondary" onClick={() => setActivityItem(null)}>Yopish</Button>
          </div>
        )}
      </Modal>

      {/* Circle detail (yozilish mumkin) */}
      <Modal isOpen={!!circleDetail} onClose={() => setCircleDetail(null)} title={circleDetail?.name || "To'garak"} size="lg">
        {circleDetail && (
          <div className="space-y-4">
            <img src={getCircleImage(circleDetail)} alt="" className="w-full h-40 object-cover rounded-xl" />
            <div className="flex flex-wrap gap-2">
              <Badge color={CATEGORY_COLORS[circleDetail.category]}>
                {CATEGORY_LABELS[circleDetail.category]}
              </Badge>
              <Badge color="#5AC8FA">{STATUS_LABELS[circleDetail.status]}</Badge>
            </div>
            <div className="rounded-xl bg-surface p-3 text-sm space-y-1.5">
              <p><span className="text-muted">Murabbiy:</span> <strong>{circleDetail.teacher}</strong></p>
              <p><span className="text-muted">Jadval:</span> <strong>{circleDetail.schedule}</strong></p>
              <p><span className="text-muted">Joy:</span> <strong>{circleDetail.location}</strong></p>
              <p><span className="text-muted">Yosh:</span> <strong>{circleDetail.ageRange}</strong></p>
              <p><span className="text-muted">O‘rinlar:</span> <strong>{circleDetail.enrolled}/{circleDetail.capacity}</strong></p>
              <p><span className="text-muted">Oylik badal:</span> <strong className="text-primary">{formatMoney(circleDetail.fee || MONTHLY_FEE)}</strong></p>
            </div>
            <div>
              <h4 className="font-semibold text-dark mb-1">Nima o‘rgatiladi?</h4>
              <p className="text-sm text-muted leading-relaxed">
                {circleDetail.description || `${circleDetail.name} to‘garagida amaliy mashg‘ulotlar o‘tkaziladi.`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setCircleDetail(null)}>Yopish</Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setEnrollCircle(circleDetail);
                  setEnrollNote('');
                  setEnrollSent(false);
                  setCircleDetail(null);
                }}
              >
                <Plus className="w-4 h-4" /> Yozilish
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Literature reader */}
      <Modal isOpen={!!litItem} onClose={() => setLitItem(null)} title={litItem?.title || 'Adabiyot'} size="lg">
        {litItem && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Badge color="#AF52DE">{litItem.subject}</Badge>
              <span className="text-xs text-muted">{litItem.author} · {litItem.level}</span>
            </div>
            <p className="text-sm text-muted">{litItem.note}</p>
            <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-border p-4 bg-card">
              <p className="text-sm text-dark whitespace-pre-line leading-relaxed">{litItem.content}</p>
            </div>
            <Button className="w-full" variant="secondary" onClick={() => setLitItem(null)}>Yopish</Button>
          </div>
        )}
      </Modal>

      {/* Enroll modal */}
      <Modal
        isOpen={!!enrollCircle}
        onClose={() => setEnrollCircle(null)}
        title="To‘garakka yozilish"
      >
        {enrollCircle && child && (
          <div className="space-y-4">
            {enrollSent ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-success mx-auto" />
                <p className="font-bold text-dark mt-3">Ariza yuborildi!</p>
                <p className="text-sm text-muted mt-1">
                  {child.firstName} uchun «{enrollCircle.name}» — admin tasdiqlashi kutilmoqda.
                </p>
                <Button className="mt-4" onClick={() => setEnrollCircle(null)}>Yopish</Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-dark">
                  <strong>{child.firstName} {child.lastName}</strong> ni{' '}
                  <strong>{enrollCircle.name}</strong> to‘garagiga yozdirmoqchimisiz?
                </p>
                <p className="text-xs text-muted">
                  {enrollCircle.schedule} · {enrollCircle.ageRange} · {formatMoney(enrollCircle.fee || MONTHLY_FEE)}/oy
                </p>
                <Input
                  placeholder="Izoh (ixtiyoriy)"
                  value={enrollNote}
                  onChange={setEnrollNote}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setEnrollCircle(null)}>
                    Bekor
                  </Button>
                  <Button className="flex-1" onClick={handleEnroll}>
                    Ariza yuborish
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function learningGamesCount(
  games: { category: string }[],
  cat: string
) {
  return games.filter((g) => g.category === cat).length;
}
