import { useMemo, useState } from 'react';
import { Plus, Users, Clock, MapPin, Edit, Trash2 } from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select, ProgressBar, SearchInput, EmptyState } from '../components/ui';
import { useStore } from '../store/useStore';
import { getCircleImage } from '../data/circleImages';
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, MONTHLY_FEE } from '../types';
import { RegionFilters, matchDistrict, useDistrictLabel, useIsViloyatAdmin } from '../components/RegionFilters';
import type { Circle, CircleCategory, CircleStatus } from '../types';

export function CirclesPage() {
  const { circles, addCircle, updateCircle, deleteCircle } = useStore();
  const districtLabel = useDistrictLabel();
  const isViloyat = useIsViloyatAdmin();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', category: 'it' as CircleCategory, teacher: '', capacity: '20',
    schedule: '', location: '', description: '', ageRange: '10-16 yosh', status: 'active' as CircleStatus,
  });

  const filtered = useMemo(() => {
    return circles
      .filter((c) => !c.isNetwork)
      .filter((c) => matchDistrict(c.districtId, districtFilter))
      .filter((c) => {
        if (filter === 'inclusive') return c.isInclusive;
        if (filter === 'all') return true;
        return c.category === filter;
      })
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const aActive = a.enrolled > 0 ? 1 : 0;
        const bActive = b.enrolled > 0 ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        if (b.enrolled !== a.enrolled) return b.enrolled - a.enrolled;
        return a.name.localeCompare(b.name, 'uz');
      });
  }, [circles, filter, search, districtFilter]);

  const inclusiveCount = circles.filter((c) => c.isInclusive && !c.isNetwork && matchDistrict(c.districtId, districtFilter)).length;

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', category: 'it', teacher: '', capacity: '20', schedule: '', location: '', description: '', ageRange: '10-16 yosh', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (circle: Circle) => {
    setEditingId(circle.id);
    setForm({
      name: circle.name, category: circle.category, teacher: circle.teacher,
      capacity: String(circle.capacity), schedule: circle.schedule,
      location: circle.location, description: circle.description,
      ageRange: circle.ageRange, status: circle.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.teacher) return;
    if (editingId) {
      updateCircle(editingId, {
        name: form.name, category: form.category, teacher: form.teacher,
        capacity: Number(form.capacity), schedule: form.schedule,
        location: form.location, description: form.description,
        ageRange: form.ageRange, status: form.status,
      });
    } else {
      addCircle({
        id: `c${Date.now()}`, name: form.name, category: form.category,
        teacher: form.teacher, teacherId: `t${Date.now()}`,
        capacity: Number(form.capacity), enrolled: 0,
        schedule: form.schedule, location: form.location,
        fee: MONTHLY_FEE, status: form.status,
        description: form.description, isNetwork: false,
        ageRange: form.ageRange, progress: 0,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1 flex-wrap">
            <div className="flex-1 max-w-sm">
              <SearchInput value={search} onChange={setSearch} placeholder="To'garak qidirish..." />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-border bg-card text-dark text-sm"
            >
              <option value="all">Barcha yo'nalishlar</option>
              <option value="inclusive">Inklyuziv ({inclusiveCount})</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {!isViloyat && (
            <Button onClick={openCreate}><Plus className="w-4 h-4" /> Yangi to'garak</Button>
          )}
        </div>
        <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="To'garaklar topilmadi" description="Yangi to'garak qo'shing yoki qidiruvni o'zgartiring" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((circle) => (
            <Card key={circle.id} className="flex flex-col !p-0 overflow-hidden">
              <div className="relative h-36 w-full">
                <img
                  src={getCircleImage(circle)}
                  alt={circle.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                  <Badge color={CATEGORY_COLORS[circle.category]}>
                    {CATEGORY_LABELS[circle.category]}
                  </Badge>
                  <Badge color={circle.status === 'active' ? '#34C759' : circle.status === 'full' ? '#FF9500' : '#8E8E93'}>
                    {STATUS_LABELS[circle.status]}
                  </Badge>
                </div>
                <h3 className="absolute bottom-3 left-3 right-3 text-base font-bold text-white drop-shadow line-clamp-2">
                  {circle.name}
                </h3>
              </div>
              {isViloyat && (
                <p className="px-4 pt-3 text-xs text-muted flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  {districtLabel(circle.districtId)}
                </p>
              )}

              <div className="p-5 flex flex-col flex-1">
                <p className="text-xs text-muted">{circle.teacher}</p>
                {circle.isInclusive && (
                  <Badge color="#AF52DE" className="mt-2 self-start">Inklyuziv</Badge>
                )}
                <p className="text-sm text-muted mt-2 flex-1 line-clamp-2">{circle.description}</p>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-muted">
                    <Users className="w-4 h-4" />
                    <span>{circle.enrolled}/{circle.capacity}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted">
                    <Clock className="w-4 h-4" />
                    <span className="truncate">{circle.schedule.split('—')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted col-span-2">
                    <MapPin className="w-4 h-4" />
                    <span>{circle.location}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <ProgressBar value={circle.enrolled} max={circle.capacity} color={CATEGORY_COLORS[circle.category]} showLabel />
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(circle)}>
                    <Edit className="w-3.5 h-3.5" /> Tahrirlash
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteCircle(circle.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-danger" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "To'garakni tahrirlash" : "Yangi to'garak"} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nomi" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Select label="Yo'nalish" value={form.category} onChange={(v) => setForm({ ...form, category: v as CircleCategory })}
            options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
          <Input label="Murabbiy" value={form.teacher} onChange={(v) => setForm({ ...form, teacher: v })} required />
          <Input label="Sig'im" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} type="number" />
          <Input label="Jadval" value={form.schedule} onChange={(v) => setForm({ ...form, schedule: v })} placeholder="Du, Ch — 14:00-16:00" />
          <Input label="Xona" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Input label="Yosh oralig'i" value={form.ageRange} onChange={(v) => setForm({ ...form, ageRange: v })} />
          <Select label="Holat" value={form.status} onChange={(v) => setForm({ ...form, status: v as CircleStatus })}
            options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
          <div className="md:col-span-2">
            <Input label="Tavsif" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleSave}>{editingId ? 'Saqlash' : "Qo'shish"}</Button>
        </div>
      </Modal>
    </div>
  );
}
