import { Globe, Calendar, Users, Plus, ExternalLink, MapPin } from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select } from '../components/ui';
import { useStore } from '../store/useStore';
import { RegionFilters, matchDistrict, useDistrictLabel, useIsViloyatAdmin } from '../components/RegionFilters';
import type { Partnership, PartnershipStatus } from '../types';
import { useMemo, useState } from 'react';

const STATUS_CONFIG: Record<PartnershipStatus, { label: string; color: string }> = {
  active: { label: 'Faol', color: '#34C759' },
  planned: { label: 'Rejalashtirilgan', color: '#FF9500' },
  completed: { label: 'Yakunlangan', color: '#9588E8' },
};

export function PartnershipsPage() {
  const { partnerships, addPartnership } = useStore();
  const isViloyat = useIsViloyatAdmin();
  const [districtFilter, setDistrictFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    organization: '', country: '', type: '', description: '',
    startDate: '', contactPerson: '', status: 'planned' as PartnershipStatus,
  });

  const scoped = useMemo(
    () => partnerships.filter((p) => matchDistrict(p.districtId, districtFilter)),
    [partnerships, districtFilter]
  );
  const active = scoped.filter((p) => p.status === 'active');
  const planned = scoped.filter((p) => p.status === 'planned');
  const totalEvents = scoped.reduce((s, p) => s + p.events, 0);

  const handleAdd = () => {
    if (!form.organization || !form.country) return;
    addPartnership({
      id: `pt${Date.now()}`,
      ...form,
      events: 0,
    });
    setModalOpen(false);
    setForm({ organization: '', country: '', type: '', description: '', startDate: '', contactPerson: '', status: 'planned' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-dark text-lg">Xalqaro hamkorlik</h3>
              <p className="text-sm text-muted">
                Boshqa markazlar bilan tajriba almashish, onlayn master-klasslar va tanlovlar
              </p>
            </div>
          </div>
          {!isViloyat && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" /> Yangi hamkorlik
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-success">{active.length}</p>
          <p className="text-xs text-muted">Faol hamkorliklar</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-warning">{planned.length}</p>
          <p className="text-xs text-muted">Rejalashtirilgan</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-primary">{totalEvents}</p>
          <p className="text-xs text-muted">O'tkazilgan tadbirlar</p>
        </Card>
      </div>

      <div>
        <h3 className="font-semibold text-dark mb-4">Faol hamkorliklar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {active.map((p) => (
            <PartnershipCard key={p.id} partnership={p} />
          ))}
        </div>
      </div>

      {planned.length > 0 && (
        <div>
          <h3 className="font-semibold text-dark mb-4">Rejalashtirilgan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planned.map((p) => (
              <PartnershipCard key={p.id} partnership={p} />
            ))}
          </div>
        </div>
      )}

      <Card>
        <h3 className="font-semibold text-dark mb-4">Onlayn master-klasslar jadvali</h3>
        <div className="space-y-3">
          {[
            { title: 'Arduino bilan robot yig\'ish', org: 'Yoshlar innovatsiya markazi', date: '2026-04-05', time: '15:00' },
            { title: 'Python dasturlash asoslari', org: 'Iqtidor Academy', date: '2026-04-12', time: '16:00' },
            { title: 'Inklyuziv ta\'lim metodikasi', org: 'International Inclusive Hub', date: '2026-04-19', time: '14:00' },
            { title: '3D modellashtirish workshop', org: 'Iqtidor Academy', date: '2026-04-26', time: '15:00' },
          ].map((event, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-surface">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                {event.date.split('-')[2]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-dark">{event.title}</p>
                <p className="text-xs text-muted">{event.org} · {event.time}</p>
              </div>
              <Badge color="#9588E8">Onlayn</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Yangi hamkorlik" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Tashkilot" value={form.organization} onChange={(v) => setForm({ ...form, organization: v })} required />
          <Input label="Mamlakat" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required />
          <Input label="Hamkorlik turi" value={form.type} onChange={(v) => setForm({ ...form, type: v })} />
          <Input label="Mas'ul shaxs" value={form.contactPerson} onChange={(v) => setForm({ ...form, contactPerson: v })} />
          <Input label="Boshlanish sanasi" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} type="date" />
          <Select label="Holat" value={form.status} onChange={(v) => setForm({ ...form, status: v as PartnershipStatus })}
            options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
          <div className="md:col-span-2">
            <Input label="Tavsif" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleAdd}>Qo'shish</Button>
        </div>
      </Modal>
    </div>
  );
}

function PartnershipCard({ partnership: p }: { partnership: Partnership }) {
  const cfg = STATUS_CONFIG[p.status];
  const districtLabel = useDistrictLabel();
  const isViloyat = useIsViloyatAdmin();
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-dark">{p.organization}</h4>
          <p className="text-sm text-primary">{p.country}</p>
          {isViloyat && (
            <p className="text-xs text-muted mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />{districtLabel(p.districtId)}
            </p>
          )}
        </div>
        <Badge color={cfg.color}>{cfg.label}</Badge>
      </div>
      <Badge color="#5AC8FA" className="mb-3">{p.type}</Badge>
      <p className="text-sm text-muted">{p.description}</p>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-xs text-muted">
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p.contactPerson}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{p.startDate}</span>
        <span className="flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" />{p.events} tadbir</span>
      </div>
    </Card>
  );
}
