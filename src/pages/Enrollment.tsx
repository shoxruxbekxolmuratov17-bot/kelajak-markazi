import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle, XCircle, Clock, UserPlus } from 'lucide-react';
import { Card, Badge, Button, Input, Select } from '../components/ui';
import { useStore } from '../store/useStore';
import { MONTHLY_FEE } from '../types';
import { t } from '../i18n';

export function EnrollmentPage({ publicMode = false }: { publicMode?: boolean }) {
  const { circles, enrollmentRequests, submitEnrollment, approveEnrollment, rejectEnrollment } = useStore();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', age: '12', school: '', grade: '6',
    parentName: '', parentPhone: '', circleId: '', pin: '', pinConfirm: '',
    socialRegistry: false,
  });

  const availableCircles = [...circles]
    .filter(
      (c) =>
        (c.status === 'active' || c.status === 'planned') &&
        c.enrolled < c.capacity &&
        !c.isNetwork &&
        (!c.isInclusive || form.socialRegistry)
    )
    .sort((a, b) => {
      const aActive = a.enrolled > 0 ? 1 : 0;
      const bActive = b.enrolled > 0 ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      return b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'uz');
    });
  const pending = enrollmentRequests.filter((r) => r.status === 'pending');
  const formatMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim() || !form.parentName.trim() || !form.parentPhone.trim() || !form.circleId) {
      setError("Majburiy maydonlarni to'ldiring");
      return;
    }
    const digits = form.parentPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError("Telefon raqam noto'g'ri. Masalan: +998 90 123 45 67");
      return;
    }
    if (form.pin.length < 4) {
      setError('PIN kod kamida 4 raqam bo‘lishi kerak');
      return;
    }
    if (form.pin !== form.pinConfirm) {
      setError('PIN kodlar mos kelmadi');
      return;
    }
    const circle = circles.find((c) => c.id === form.circleId);
    if (!circle) {
      setError("To'garak topilmadi");
      return;
    }

    setLoading(true);
    const err = await submitEnrollment({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      age: Number(form.age) || 12,
      school: form.school.trim() || "Ko'rsatilmagan",
      grade: Number(form.grade) || 1,
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      circleId: form.circleId,
      circleName: circle.name,
      pin: form.pin,
      socialRegistry: form.socialRegistry,
      subsidy: form.socialRegistry,
      note: form.socialRegistry ? 'Ijtimoiy reestr' : undefined,
    } as Parameters<typeof submitEnrollment>[0] & { socialRegistry?: boolean; subsidy?: boolean });
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setSubmitted(true);
    setForm({
      firstName: '', lastName: '', age: '12', school: '', grade: '6',
      parentName: '', parentPhone: '', circleId: '', pin: '', pinConfirm: '',
      socialRegistry: false,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-dark text-lg">Onlayn ro'yxatdan o'tish</h3>
            <p className="text-sm text-muted">
              Har qanday ota-ona farzandini to'garakka yozdirishi mumkin. Ro'yxatdan o'tgach telefon va PIN bilan kabinetga kiring.
              Oylik badal: {formatMoney(MONTHLY_FEE)}
            </p>
          </div>
        </div>
      </Card>

      {submitted && (
        <Card className="bg-success/10 border-success/30 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-success shrink-0" />
          <div>
            <p className="font-semibold text-dark">Ro'yxatdan o'tdingiz!</p>
            <p className="text-sm text-muted">
              Endi telefon raqamingiz va PIN kod bilan ota-ona kabinetiga kiring.
              {publicMode && (
                <>
                  {' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Kirish →
                  </Link>
                </>
              )}
            </p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-danger/10 border-danger/30">
          <p className="text-sm text-danger font-medium">{error}</p>
        </Card>
      )}

      <div className={`grid grid-cols-1 ${publicMode ? 'max-w-xl mx-auto' : 'lg:grid-cols-2'} gap-6`}>
        <Card>
          <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Ro'yxatdan o'tish formasi
          </h3>
          {availableCircles.length === 0 && (
            <p className="text-sm text-muted mb-4">Hozircha bo'sh o'rinli to'garak yo'q yoki ma'lumot yuklanmoqda...</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Ism" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
              <Input label="Familiya" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
              <Input label="Yosh" value={form.age} onChange={(v) => setForm({ ...form, age: v })} type="number" required />
              <Input label="Sinf" value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} type="number" />
            </div>
            <Input label="Maktab" value={form.school} onChange={(v) => setForm({ ...form, school: v })} placeholder="Masalan: 3-son UM" required />
            <Select
              label="To'garak"
              value={form.circleId}
              onChange={(v) => setForm({ ...form, circleId: v })}
              required
              options={[
                { value: '', label: "To'garakni tanlang..." },
                ...availableCircles.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.enrolled}/${c.capacity} o'rin, ${c.ageRange})`,
                })),
              ]}
            />
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium text-dark mb-3">Ota-ona ma'lumotlari</p>
              <div className="grid grid-cols-1 gap-4">
                <Input label="Ota-ona ismi" value={form.parentName} onChange={(v) => setForm({ ...form, parentName: v })} required />
                <Input label="Telefon raqam" value={form.parentPhone} onChange={(v) => setForm({ ...form, parentPhone: v })} placeholder="+998 90 123 45 67" required />
                <label className="flex items-center gap-2 text-sm text-dark cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.socialRegistry}
                    onChange={(e) => setForm({ ...form, socialRegistry: e.target.checked })}
                    aria-label="Ijtimoiy reestr farzandi"
                  />
                  {t('socialRegistry')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="PIN kod (kirish uchun)"
                    value={form.pin}
                    onChange={(v) => setForm({ ...form, pin: v.replace(/\D/g, '').slice(0, 8) })}
                    type="password"
                    placeholder="Kamida 4 raqam"
                    required
                  />
                  <Input
                    label="PIN ni tasdiqlang"
                    value={form.pinConfirm}
                    onChange={(v) => setForm({ ...form, pinConfirm: v.replace(/\D/g, '').slice(0, 8) })}
                    type="password"
                    placeholder="Qayta kiriting"
                    required
                  />
                </div>
                <p className="text-xs text-muted -mt-2">
                  Shu PIN bilan keyin ota-ona kabinetiga kirasiz. Uni eslab qoling.
                </p>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Yuborilmoqda...' : "Ro'yxatdan o'tish"}
            </Button>
          </form>
        </Card>

        {!publicMode && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Kutilayotgan arizalar ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Hozircha kutilayotgan ariza yo'q</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {pending.map((req) => (
                  <div key={req.id} className="p-4 rounded-xl border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-dark">{req.firstName} {req.lastName}</p>
                        <p className="text-sm text-muted">{req.circleName} · {req.school}</p>
                        <p className="text-xs text-muted mt-1">{req.parentName} · {req.parentPhone}</p>
                        <p className="text-xs text-muted">{req.submittedAt}</p>
                      </div>
                      <Badge color="#FF9500">Kutilmoqda</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => approveEnrollment(req.id)} className="flex-1">
                        <CheckCircle className="w-4 h-4" /> Tasdiqlash
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => rejectEnrollment(req.id)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-dark mb-3">Mavjud to'garaklar</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableCircles.map((c) => (
                <div key={c.id} className="flex justify-between text-sm p-2 rounded-lg bg-surface">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted">{c.capacity - c.enrolled} o'rin</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}
