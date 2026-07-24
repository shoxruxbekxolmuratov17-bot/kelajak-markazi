import { useEffect, useMemo, useState } from 'react';
import { Check, Save, X } from 'lucide-react';
import { Card, Button, Select } from '../components/ui';
import { useStore } from '../store/useStore';
import { RegionFilters, matchDistrict } from '../components/RegionFilters';

export function AttendancePage() {
  const { circles, students, attendance, authUser, saveAttendanceBulk } = useStore();
  const [districtFilter, setDistrictFilter] = useState('all');
  const isViloyat = authUser?.role === 'superadmin';

  const teacherCircles = useMemo(() => {
    let list =
      authUser?.role === 'teacher' && authUser.teacherId
        ? circles.filter((c) => c.teacherId === authUser.teacherId)
        : circles.filter((c) => !c.isNetwork);
    list = list.filter((c) => matchDistrict(c.districtId, districtFilter));
    return [...list].sort((a, b) => {
      const aActive = a.enrolled > 0 ? 1 : 0;
      const bActive = b.enrolled > 0 ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      return b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'uz');
    });
  }, [circles, authUser, districtFilter]);

  const [circleId, setCircleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!circleId && teacherCircles[0]) setCircleId(teacherCircles[0].id);
  }, [teacherCircles, circleId]);

  const circleStudents = students.filter((s) => s.circleIds.includes(circleId) && s.status === 'active');

  useEffect(() => {
    if (!circleId) return;
    const next: Record<string, boolean> = {};
    for (const s of students.filter((st) => st.circleIds.includes(circleId))) {
      const existing = attendance.find((a) => a.studentId === s.id && a.circleId === circleId && a.date === date);
      next[s.id] = existing ? existing.present : true;
    }
    setMarks(next);
    setSaved(false);
  }, [circleId, date, students, attendance]);

  const presentCount = Object.values(marks).filter(Boolean).length;
  const total = circleStudents.length;
  const rate = total ? Math.round((presentCount / total) * 100) : 0;

  const handleSave = async () => {
    const records = circleStudents.map((s) => ({
      id: `a${Date.now()}${s.id}`,
      studentId: s.id,
      circleId,
      date,
      present: marks[s.id] ?? true,
    }));
    await saveAttendanceBulk(records);
    setSaved(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {isViloyat && (
        <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />
      )}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 max-w-xs">
          <Select
            label="To'garak"
            value={circleId}
            onChange={setCircleId}
            options={teacherCircles.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark mb-1.5">Sana</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-dark text-sm"
          />
        </div>
        <Button onClick={handleSave} disabled={!circleId || total === 0}>
          <Save className="w-4 h-4" />
          Saqlash
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-success">{presentCount}</p>
          <p className="text-xs text-muted mt-1">Kelgan</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-danger">{total - presentCount}</p>
          <p className="text-xs text-muted mt-1">Kelmagan</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-primary">{rate}%</p>
          <p className="text-xs text-muted mt-1">Davomat</p>
        </Card>
      </div>

      {saved && (
        <p className="text-sm text-success text-center">Davomat saqlandi</p>
      )}

      <Card className="!p-0 overflow-hidden">
        {circleStudents.length === 0 ? (
          <p className="text-center text-muted py-12">Bu to'garakda o'quvchilar yo'q</p>
        ) : (
          <div className="divide-y divide-border">
            {circleStudents.map((s) => {
              const present = marks[s.id] ?? true;
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-dark">{s.lastName} {s.firstName}</p>
                    <p className="text-xs text-muted">{s.school} · {s.grade}-sinf</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMarks((m) => ({ ...m, [s.id]: true }))}
                      className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1 ${
                        present ? 'bg-success/15 text-success' : 'bg-surface text-muted'
                      }`}
                    >
                      <Check className="w-4 h-4" /> Keldi
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarks((m) => ({ ...m, [s.id]: false }))}
                      className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-1 ${
                        !present ? 'bg-danger/15 text-danger' : 'bg-surface text-muted'
                      }`}
                    >
                      <X className="w-4 h-4" /> Yo'q
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
