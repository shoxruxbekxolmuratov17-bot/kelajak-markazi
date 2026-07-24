import { useEffect, useMemo, useState } from 'react';
import { Plus, Phone, School, Edit, Trash2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select, SearchInput, EmptyState } from '../components/ui';
import { useStore } from '../store/useStore';
import {
  RegionFilters,
  matchDistrict,
  useDistrictLabel,
  useIsViloyatAdmin,
} from '../components/RegionFilters';
import type { Student, StudentStatus } from '../types';

const PAGE_SIZE = 100;
const CENTER_LABEL = 'Kelajak Markazi';

function isCenterPlace(school: string) {
  const t = (school || '').toLowerCase().trim();
  if (!t) return false;
  if (t.includes('markaz')) return true;
  if (/\d+\s*-?\s*son|\d+-maktab|maktab/.test(t)) return false;
  return t === CENTER_LABEL.toLowerCase();
}

const STATUS_COLORS: Record<StudentStatus, string> = {
  active: '#34C759',
  graduated: '#9588E8',
  paused: '#FF9500',
  pending: '#8E8E93',
};

const STATUS_LABELS_UZ: Record<StudentStatus, string> = {
  active: 'Faol',
  graduated: 'Bitirgan',
  paused: "To'xtatilgan",
  pending: 'Kutilmoqda',
};

export function StudentsPage() {
  const { students, circles, addStudent, updateStudent, deleteStudent } = useStore();
  const districtLabel = useDistrictLabel();
  const isViloyat = useIsViloyatAdmin();
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [placeFilter, setPlaceFilter] = useState<'all' | 'markaz' | 'maktab'>('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [circleFilter, setCircleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '12',
    school: '',
    grade: '6',
    parentName: '',
    parentPhone: '',
    status: 'active' as StudentStatus,
  });

  const afterDistrict = useMemo(
    () => students.filter((s) => matchDistrict(s.districtId, districtFilter)),
    [students, districtFilter]
  );

  const schoolOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of afterDistrict) {
      if (s.school?.trim()) set.add(s.school.trim());
    }
    const list = [...set].sort((a, b) => {
      const ac = isCenterPlace(a) ? 0 : 1;
      const bc = isCenterPlace(b) ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return a.localeCompare(b, 'uz');
    });
    return list;
  }, [afterDistrict]);

  const placeSchoolOptions = useMemo(() => {
    if (placeFilter === 'markaz') return schoolOptions.filter(isCenterPlace);
    if (placeFilter === 'maktab') return schoolOptions.filter((s) => !isCenterPlace(s));
    return schoolOptions;
  }, [schoolOptions, placeFilter]);

  const gradeOptions = useMemo(() => {
    const set = new Set<number>();
    for (const s of afterDistrict) {
      if (s.grade >= 1 && s.grade <= 11) set.add(s.grade);
    }
    return [...set].sort((a, b) => a - b);
  }, [afterDistrict]);

  const circleOptions = useMemo(() => {
    const used = new Set<string>();
    for (const s of afterDistrict) {
      for (const id of s.circleIds) used.add(id);
    }
    return circles
      .filter((c) => used.has(c.id) || c.enrolled > 0)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'uz') || (a.teacher || '').localeCompare(b.teacher || '', 'uz'))
      .map((c) => ({
        value: c.id,
        label: c.teacher ? `${c.name} — ${c.teacher}` : c.name,
      }));
  }, [afterDistrict, circles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = afterDistrict.filter((s) => {
      if (placeFilter === 'markaz' && !isCenterPlace(s.school)) return false;
      if (placeFilter === 'maktab' && isCenterPlace(s.school)) return false;
      if (schoolFilter !== 'all' && s.school !== schoolFilter) return false;
      if (gradeFilter !== 'all' && String(s.grade) !== gradeFilter) return false;
      if (circleFilter !== 'all' && !s.circleIds.includes(circleFilter)) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        `${s.lastName} ${s.firstName}`.toLowerCase().includes(q) ||
        s.school.toLowerCase().includes(q) ||
        s.parentPhone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        districtLabel(s.districtId).toLowerCase().includes(q)
      );
    });
    return list.sort((a, b) => {
      const byLast = a.lastName.localeCompare(b.lastName, 'uz');
      if (byLast) return byLast;
      return a.firstName.localeCompare(b.firstName, 'uz');
    });
  }, [
    afterDistrict,
    placeFilter,
    schoolFilter,
    gradeFilter,
    circleFilter,
    statusFilter,
    search,
    districtLabel,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [search, districtFilter, schoolFilter, placeFilter, gradeFilter, circleFilter, statusFilter]);

  useEffect(() => {
    if (schoolFilter !== 'all' && !placeSchoolOptions.includes(schoolFilter)) {
      setSchoolFilter('all');
    }
  }, [placeFilter, placeSchoolOptions, schoolFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const rangeFrom = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(safePage * PAGE_SIZE, filtered.length);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      firstName: '',
      lastName: '',
      age: '12',
      school: '',
      grade: '6',
      parentName: '',
      parentPhone: '',
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditingId(student.id);
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      age: String(student.age),
      school: student.school,
      grade: String(student.grade),
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      status: student.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.firstName || !form.lastName) return;
    if (editingId) {
      updateStudent(editingId, {
        firstName: form.firstName,
        lastName: form.lastName,
        age: Number(form.age),
        school: form.school,
        grade: Number(form.grade),
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        status: form.status,
      });
    } else {
      addStudent({
        id: `s${Date.now()}`,
        firstName: form.firstName,
        lastName: form.lastName,
        age: Number(form.age),
        school: form.school,
        grade: Number(form.grade),
        parentName: form.parentName,
        parentPhone: form.parentPhone,
        circleIds: [],
        status: form.status,
        enrolledAt: new Date().toISOString().split('T')[0],
        achievements: 0,
      });
    }
    setModalOpen(false);
  };

  const getCircleNames = (ids: string[]) =>
    ids.map((id) => circles.find((c) => c.id === id)?.name).filter(Boolean) as string[];

  const avgAge = filtered.length
    ? Math.round(filtered.reduce((s, st) => s + st.age, 0) / filtered.length)
    : 0;

  const clearFilters = () => {
    setSearch('');
    setSchoolFilter('all');
    setPlaceFilter('all');
    setGradeFilter('all');
    setCircleFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex-1 max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="F.I.SH, maktab, telefon..." />
          </div>
          {!isViloyat && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" /> Yangi o&apos;quvchi
            </Button>
          )}
        </div>

        <RegionFilters
          districtFilter={districtFilter}
          onDistrictChange={setDistrictFilter}
        />

        <Card className="!p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <Select
              label="Joylashuv"
              value={placeFilter}
              onChange={(v) => setPlaceFilter(v as 'all' | 'markaz' | 'maktab')}
              options={[
                { value: 'all', label: 'Markaz + maktablar' },
                { value: 'markaz', label: 'Faqat markaz' },
                { value: 'maktab', label: 'Faqat maktablar' },
              ]}
            />
            <Select
              label="Maktab / Markaz"
              value={schoolFilter}
              onChange={setSchoolFilter}
              options={[
                { value: 'all', label: 'Barcha joylar' },
                ...placeSchoolOptions.map((name) => ({
                  value: name,
                  label: isCenterPlace(name) ? `Markaz · ${name}` : `Maktab · ${name}`,
                })),
              ]}
            />
            <Select
              label="Sinf"
              value={gradeFilter}
              onChange={setGradeFilter}
              options={[
                { value: 'all', label: 'Barcha sinflar' },
                ...gradeOptions.map((g) => ({ value: String(g), label: `${g}-sinf` })),
              ]}
            />
            <Select
              label="To'garak"
              value={circleFilter}
              onChange={setCircleFilter}
              options={[{ value: 'all', label: "Barcha to'garaklar" }, ...circleOptions]}
            />
            <Select
              label="Holat"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Barcha holatlar' },
                ...Object.entries(STATUS_LABELS_UZ).map(([value, label]) => ({ value, label })),
              ]}
            />
            <div className="flex items-end">
              <Button variant="secondary" className="w-full" onClick={clearFilters}>
                Filtrlarni tozalash
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-primary">{filtered.length}</p>
          <p className="text-xs text-muted mt-1">Filtr bo&apos;yicha</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-success">
            {filtered.filter((s) => s.status === 'active').length}
          </p>
          <p className="text-xs text-muted mt-1">Faol</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-warning">
            {filtered.filter((s) => s.achievements > 0).length}
          </p>
          <p className="text-xs text-muted mt-1">Yutuqlari bor</p>
        </Card>
        <Card padding className="text-center">
          <p className="text-2xl font-bold text-dark">{avgAge || '—'}</p>
          <p className="text-xs text-muted mt-1">O&apos;rtacha yosh</p>
        </Card>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="O'quvchilar topilmadi" />
      ) : (
        <Card padding={false} className="overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 border-b border-border bg-surface/40">
            <p className="text-sm text-muted">
              {rangeFrom}–{rangeTo} / <span className="font-semibold text-dark">{filtered.length}</span>
              <span className="ml-2 text-xs">({PAGE_SIZE} tadan)</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Oldingi
              </Button>
              <span className="text-sm font-medium text-dark tabular-nums px-2">
                {safePage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="secondary"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Keyingi <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">№</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">O&apos;quvchi</th>
                  {isViloyat && (
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Tuman</th>
                  )}
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Maktab</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">To&apos;garaklar</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Ota-ona</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Holat</th>
                  {!isViloyat && (
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted uppercase">Amallar</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="border-b border-border last:border-0 hover:bg-surface/30 transition-colors"
                  >
                    <td className="px-5 py-4 text-sm text-muted tabular-nums">
                      {(safePage - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm">
                          {student.lastName[0]}
                          {student.firstName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-dark">
                            {student.lastName} {student.firstName}
                          </p>
                          <p className="text-xs text-muted">
                            {student.age} yosh · {student.grade}-sinf
                          </p>
                        </div>
                      </div>
                    </td>
                    {isViloyat && (
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-dark">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          {districtLabel(student.districtId)}
                        </div>
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted">
                        <School className="w-4 h-4 shrink-0" />
                        <span>
                          {student.school}
                          {isViloyat && student.districtId ? (
                            <span className="block text-xs text-muted/80 mt-0.5">
                              {districtLabel(student.districtId)}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getCircleNames(student.circleIds).map((name) => (
                          <Badge key={name} color="#9588E8">
                            {name}
                          </Badge>
                        ))}
                        {student.circleIds.length === 0 && <span className="text-xs text-muted">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-dark">{student.parentName}</p>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {student.parentPhone}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge color={STATUS_COLORS[student.status]}>{STATUS_LABELS_UZ[student.status]}</Badge>
                    </td>
                    {!isViloyat && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(student)}
                            className="p-2 rounded-lg hover:bg-surface text-muted hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteStudent(student.id)}
                            className="p-2 rounded-lg hover:bg-surface text-muted hover:text-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 border-t border-border bg-surface/40">
            <p className="text-sm text-muted">
              Sahifa {safePage} / {totalPages}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="secondary"
                disabled={safePage <= 1}
                onClick={() => setPage(1)}
              >
                Birinchi
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={safePage >= totalPages}
                onClick={() => setPage(totalPages)}
              >
                Oxirgi
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Tahrirlash' : "Yangi o'quvchi"}>
        <div className="space-y-3">
          <Input label="Ism" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
          <Input label="Familiya" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
          <Input label="Yosh" value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
          <Input label="Maktab" value={form.school} onChange={(v) => setForm({ ...form, school: v })} />
          <Input label="Sinf" value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} />
          <Input label="Ota-ona F.I.Sh." value={form.parentName} onChange={(v) => setForm({ ...form, parentName: v })} />
          <Input label="Telefon" value={form.parentPhone} onChange={(v) => setForm({ ...form, parentPhone: v })} />
          <Select
            label="Holat"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v as StudentStatus })}
            options={Object.entries(STATUS_LABELS_UZ).map(([value, label]) => ({ value, label }))}
          />
          <Button className="w-full" onClick={handleSave}>
            Saqlash
          </Button>
        </div>
      </Modal>
    </div>
  );
}
