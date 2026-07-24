import { useMemo, useState } from 'react';
import { Plus, Award, Lightbulb, Rocket, Trophy, MapPin } from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select } from '../components/ui';
import { useStore } from '../store/useStore';
import { RegionFilters, matchDistrict, useDistrictLabel, useIsViloyatAdmin } from '../components/RegionFilters';
import type { Project, ProjectStatus } from '../types';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; icon: typeof Lightbulb }> = {
  idea: { label: 'G\'oya', color: '#8E8E93', icon: Lightbulb },
  development: { label: 'Ishlab chiqilmoqda', color: '#5AC8FA', icon: Rocket },
  completed: { label: 'Tugallangan', color: '#34C759', icon: Award },
  competition: { label: 'Tanlovda', color: '#FF9500', icon: Trophy },
};

export function ProjectsPage() {
  const { projects, students, circles, addProject } = useStore();
  const isViloyat = useIsViloyatAdmin();
  const districtLabel = useDistrictLabel();
  const [districtFilter, setDistrictFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', studentId: '', circleId: '', category: '', description: '', status: 'idea' as ProjectStatus,
  });

  const scoped = useMemo(
    () => projects.filter((p) => matchDistrict(p.districtId, districtFilter)),
    [projects, districtFilter]
  );

  const handleSave = () => {
    if (!form.title || !form.studentId) return;
    const student = students.find((s) => s.id === form.studentId);
    const circle = circles.find((c) => c.id === form.circleId);
    addProject({
      id: `pr${Date.now()}`, title: form.title,
      studentId: form.studentId, studentName: student ? `${student.firstName} ${student.lastName}` : '',
      circleId: form.circleId, category: form.category || circle?.name || '',
      status: form.status, description: form.description,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setModalOpen(false);
    setForm({ title: '', studentId: '', circleId: '', category: '', description: '', status: 'idea' });
  };

  const stats = {
    total: scoped.length,
    completed: scoped.filter((p) => p.status === 'completed').length,
    competition: scoped.filter((p) => p.status === 'competition').length,
    awards: scoped.filter((p) => p.awards?.length).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 mr-4">
          <Card className="text-center"><p className="text-2xl font-bold text-primary">{stats.total}</p><p className="text-xs text-muted">Jami</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold text-success">{stats.completed}</p><p className="text-xs text-muted">Tugallangan</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold text-warning">{stats.competition}</p><p className="text-xs text-muted">Tanlovda</p></Card>
          <Card className="text-center"><p className="text-2xl font-bold text-dark">{stats.awards}</p><p className="text-xs text-muted">Mukofotlar</p></Card>
        </div>
        {!isViloyat && (
          <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Yangi loyiha</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scoped.map((project) => {
          const config = STATUS_CONFIG[project.status];
          const Icon = config.icon;
          return (
            <Card key={project.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark">{project.title}</h3>
                    <p className="text-sm text-muted">{project.studentName}</p>
                    {isViloyat && (
                      <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{districtLabel(project.districtId)}
                      </p>
                    )}
                  </div>
                </div>
                <Badge color={config.color}>{config.label}</Badge>
              </div>
              <p className="text-sm text-muted mt-3">{project.description}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-muted">
                <span>{project.category}</span>
                <span>{project.createdAt}</span>
              </div>
              {project.awards && (
                <div className="mt-3 p-2 rounded-lg bg-warning/10 text-sm text-warning font-medium flex items-center gap-2">
                  <Trophy className="w-4 h-4" />{project.awards[0]}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Yangi loyiha" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Loyiha nomi" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Select label="O'quvchi" value={form.studentId} onChange={(v) => setForm({ ...form, studentId: v })}
            options={[{ value: '', label: 'Tanlang...' }, ...students.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))]} />
          <Select label="To'garak" value={form.circleId} onChange={(v) => setForm({ ...form, circleId: v })}
            options={[{ value: '', label: 'Tanlang...' }, ...circles.map((c) => ({ value: c.id, label: c.name }))]} />
          <Select label="Holat" value={form.status} onChange={(v) => setForm({ ...form, status: v as ProjectStatus })}
            options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
          <div className="md:col-span-2">
            <Input label="Tavsif" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleSave}>Qo'shish</Button>
        </div>
      </Modal>
    </div>
  );
}
