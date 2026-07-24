import { useMemo, useState } from 'react';
import { MapPin, School, Users, BookOpen, Plus, User } from 'lucide-react';
import { Card, Badge, ProgressBar, Button, Modal, Input, Select } from '../components/ui';
import { useStore } from '../store/useStore';
import { getCircleImage } from '../data/circleImages';
import { CATEGORY_LABELS, CATEGORY_COLORS, MONTHLY_FEE } from '../types';
import { RegionFilters, matchDistrict, useDistrictLabel, useIsViloyatAdmin } from '../components/RegionFilters';
import type { Circle, CircleCategory } from '../types';
import { circleLeaderTotals } from '../data/officialCircleLeaders';

export function NetworkPage() {
  const { circles, schools, teachers, addNetworkCircle, authUser } = useStore();
  const isViloyat = useIsViloyatAdmin();
  const districtLabel = useDistrictLabel();
  const canWrite = authUser?.role === 'admin' || authUser?.role === 'district_admin';
  const [districtFilter, setDistrictFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'it' as CircleCategory,
    teacher: '',
    teacherId: '',
    capacity: '20',
    schedule: '',
    description: '',
    ageRange: '10-16 yosh',
  });

  const networkCircles = useMemo(
    () => circles.filter((c) => c.isNetwork && matchDistrict(c.districtId, districtFilter)),
    [circles, districtFilter]
  );

  const circlesBySchool = useMemo(() => {
    const map = new Map<string, Circle[]>();
    for (const c of networkCircles) {
      const key = c.school || c.location || 'Noma’lum';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [networkCircles]);

  const scopedSchools = useMemo(
    () =>
      schools
        .filter((s) => matchDistrict(s.districtId, districtFilter))
        .slice()
        .sort((a, b) => {
          const ca = circlesBySchool.get(a.name)?.length || a.networkCircles;
          const cb = circlesBySchool.get(b.name)?.length || b.networkCircles;
          return cb - ca || a.name.localeCompare(b.name, 'uz');
        }),
    [schools, districtFilter, circlesBySchool]
  );
  const activeSchools = scopedSchools.filter((s) => (circlesBySchool.get(s.name)?.length || s.networkCircles) > 0);
  const emptySchools = scopedSchools.filter((s) => !(circlesBySchool.get(s.name)?.length || s.networkCircles));

  const openExpand = (schoolId: string) => {
    setSelectedSchool(schoolId);
    setForm({
      name: '',
      category: 'it',
      teacher: '',
      teacherId: '',
      capacity: '20',
      schedule: '',
      description: '',
      ageRange: '10-16 yosh',
    });
    setModalOpen(true);
  };

  const handleAdd = () => {
    if (!selectedSchool || !form.name || !form.teacher) return;
    const teacher = teachers.find(
      (t) => (t.fullName || `${t.lastName} ${t.firstName}`.trim()) === form.teacher
    );
    addNetworkCircle(selectedSchool, {
      name: form.name,
      category: form.category,
      teacher: form.teacher,
      teacherId: teacher?.id || `t${Date.now()}`,
      capacity: Number(form.capacity),
      schedule: form.schedule,
      location: schools.find((s) => s.id === selectedSchool)?.name || '',
      fee: MONTHLY_FEE,
      status: 'active',
      description: form.description,
      ageRange: form.ageRange,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-dark text-lg">Tarmoq to&apos;garaklar — maktablar</h3>
            <p className="text-sm text-muted mt-1">
              Jadval bo&apos;yicha faqat <strong>maktablarda</strong> o&apos;tiladigan guruhlar.
              Markazdagi darslar bu bo&apos;limga kirmaydi ({circleLeaderTotals.centerGroups} ta markaz guruhi).
              {isViloyat ? ' Viloyat ko‘rinishi.' : ''}
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{activeSchools.length}</p>
              <p className="text-xs text-muted">Maktab</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">{networkCircles.length}</p>
              <p className="text-xs text-muted">To&apos;garak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-dark">
                {networkCircles.reduce((s, c) => s + c.enrolled, 0)}
              </p>
              <p className="text-xs text-muted">O&apos;quvchi</p>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="font-semibold text-dark mb-4">
          Maktablar bo&apos;yicha ({activeSchools.length})
        </h3>
        <div className="space-y-3">
          {activeSchools.map((school) => {
            const list = circlesBySchool.get(school.name) || [];
            const count = list.length || school.networkCircles;
            const students = list.reduce((s, c) => s + c.enrolled, 0) || school.students;
            const open = expandedId === school.id || expandedId === 'all';
            return (
              <Card key={school.id} className="!p-0 overflow-hidden">
                <button
                  type="button"
                  className="w-full text-left p-4 flex items-start gap-3 hover:bg-surface/60 transition-colors"
                  onClick={() => setExpandedId(open && expandedId === school.id ? null : school.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <School className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-dark">{school.name}</h4>
                      <Badge color="#34C759">Faol</Badge>
                      {isViloyat && (
                        <span className="text-xs text-primary">{districtLabel(school.districtId)}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{school.address}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {count} to&apos;garak
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {students} o&apos;quvchi
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium shrink-0">{open ? 'Yopish' : 'Ochish'}</span>
                </button>

                {open && (
                  <div className="border-t border-border px-4 pb-4 pt-2 space-y-3 bg-surface/40">
                    {list.length === 0 ? (
                      <p className="text-sm text-muted py-2">Bu maktabda guruhlar yuklanmagan</p>
                    ) : (
                      list.map((c) => (
                        <div
                          key={c.id}
                          className="flex gap-3 p-3 rounded-xl bg-card border border-border"
                        >
                          <img
                            src={getCircleImage(c)}
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-dark text-sm">{c.name}</p>
                                <Badge color={CATEGORY_COLORS[c.category]} className="mt-1">
                                  {CATEGORY_LABELS[c.category]}
                                </Badge>
                              </div>
                              <p className="text-sm font-bold text-primary whitespace-nowrap">
                                {c.enrolled}/{c.capacity}
                              </p>
                            </div>
                            <p className="text-xs text-muted mt-2 flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {c.teacher}
                            </p>
                            <p className="text-xs text-muted mt-0.5">{c.schedule}</p>
                            {c.description && (
                              <p className="text-xs text-muted mt-1 line-clamp-1">{c.description}</p>
                            )}
                            <div className="mt-2">
                              <ProgressBar
                                value={c.enrolled}
                                max={c.capacity}
                                color={CATEGORY_COLORS[c.category]}
                                showLabel
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {canWrite && (
                      <Button size="sm" variant="secondary" className="w-full" onClick={() => openExpand(school.id)}>
                        <Plus className="w-3.5 h-3.5" /> Yana to&apos;garak ochish
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {emptySchools.length > 0 && canWrite && (
        <Card className="border-warning/30 bg-warning/5">
          <h4 className="font-semibold text-dark mb-2">Kengaytirish</h4>
          <p className="text-sm text-muted mb-3">Hali tarmoq to&apos;garagi bo&apos;lmagan maktablar:</p>
          <div className="flex flex-wrap gap-2">
            {emptySchools.map((s) => (
              <Button key={s.id} size="sm" variant="secondary" onClick={() => openExpand(s.id)}>
                <Plus className="w-3.5 h-3.5" />
                {s.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={expandedId === 'all' ? 'primary' : 'secondary'}
          onClick={() => setExpandedId(expandedId === 'all' ? null : 'all')}
        >
          {expandedId === 'all' ? 'Hammasini yig‘ish' : 'Hammasini ochish'}
        </Button>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Yangi tarmoq to'garak" size="lg">
        <p className="text-sm text-muted mb-4">
          Maktab: <strong>{schools.find((s) => s.id === selectedSchool)?.name}</strong>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nomi" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Select
            label="Yo'nalish"
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v as CircleCategory })}
            options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Select
            label="Murabbiy"
            value={form.teacher}
            onChange={(v) => setForm({ ...form, teacher: v })}
            options={[
              { value: '', label: 'Tanlang...' },
              ...teachers
                .filter((t) => !t.isVacant)
                .map((t) => ({
                  value: t.fullName || `${t.lastName} ${t.firstName}`.trim(),
                  label: t.fullName || `${t.lastName} ${t.firstName}`.trim(),
                })),
            ]}
          />
          <Input label="Sig'im" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} type="number" />
          <Input label="Jadval" value={form.schedule} onChange={(v) => setForm({ ...form, schedule: v })} />
          <Input label="Yosh oralig'i" value={form.ageRange} onChange={(v) => setForm({ ...form, ageRange: v })} />
          <div className="md:col-span-2">
            <Input label="Tavsif" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleAdd}>Ochish</Button>
        </div>
      </Modal>
    </div>
  );
}
