import { useMemo, useState } from 'react';
import { Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select } from '../components/ui';
import { useStore } from '../store/useStore';
import { RegionFilters, matchDistrict, useDistrictLabel, useIsViloyatAdmin } from '../components/RegionFilters';

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const DAY_COLORS = ['#9588E8', '#5AC8FA', '#34C759', '#FF9500', '#AF52DE', '#FF6482'];

export function SchedulePage() {
  const { schedule, circles, addScheduleItem, deleteScheduleItem, authUser } = useStore();
  const isViloyat = useIsViloyatAdmin();
  const districtLabel = useDistrictLabel();
  const [selectedDay, setSelectedDay] = useState('Dushanba');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    circleId: '', day: 'Dushanba', startTime: '14:00', endTime: '16:00', room: '',
  });

  const daySchedule = useMemo(
    () =>
      schedule.filter(
        (s) => s.day === selectedDay && matchDistrict(s.districtId, districtFilter)
      ),
    [schedule, selectedDay, districtFilter]
  );
  const isAdmin = authUser?.role === 'admin' || authUser?.role === 'district_admin';

  const handleAdd = () => {
    const circle = circles.find((c) => c.id === form.circleId);
    if (!circle) return;
    addScheduleItem({
      id: `sch${Date.now()}`,
      circleId: circle.id,
      circleName: circle.name,
      teacher: circle.teacher.split(' ').slice(0, 2).map((p, i) => (i === 0 ? p : `${p[0]}.`)).join(' '),
      day: form.day,
      startTime: form.startTime,
      endTime: form.endTime,
      room: form.room || circle.location,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedDay === day
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card text-muted border border-border hover:border-primary/30'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        {isAdmin && (
          <Button onClick={() => { setForm({ ...form, day: selectedDay, circleId: circles[0]?.id || '' }); setModalOpen(true); }}>
            <Plus className="w-4 h-4" /> Qo'shish
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-semibold text-dark">{selectedDay} — {daySchedule.length} ta mashg'ulot</h3>

          {daySchedule.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-muted">Bu kunda mashg'ulotlar yo'q</p>
            </Card>
          ) : (
            daySchedule.map((item, i) => (
              <Card key={item.id} className="flex items-center gap-4">
                <div className="w-1 h-16 rounded-full" style={{ backgroundColor: DAY_COLORS[i % DAY_COLORS.length] }} />
                <div className="w-24 text-center">
                  <p className="text-lg font-bold text-dark">{item.startTime}</p>
                  <p className="text-xs text-muted">{item.endTime} gacha</p>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-dark">{item.circleName}</h4>
                  <p className="text-sm text-muted">{item.teacher}</p>
                  {isViloyat && (
                    <p className="text-xs text-primary mt-0.5">{districtLabel(item.districtId)}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                    <MapPin className="w-3.5 h-3.5" />{item.room}
                  </div>
                </div>
                <Badge color={DAY_COLORS[i % DAY_COLORS.length]}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {Math.max(1, parseInt(item.endTime) - parseInt(item.startTime.split(':')[0]) || 2)} soat
                </Badge>
                {isAdmin && (
                  <button type="button" onClick={() => deleteScheduleItem(item.id)} className="text-muted hover:text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <h3 className="font-semibold text-dark mb-4">Haftalik ko'rinish</h3>
            <div className="space-y-3">
              {DAYS.slice(0, 5).map((day) => {
                const count = schedule.filter((s) => s.day === day).length;
                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      selectedDay === day ? 'bg-primary/10' : 'bg-surface hover:bg-primary/5'
                    }`}
                    onClick={() => setSelectedDay(day)}
                  >
                    <span className="text-sm font-medium text-dark">{day}</span>
                    <Badge color="#9588E8">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Mashg'ulot qo'shish">
        <div className="space-y-3">
          <Select
            label="To'garak"
            value={form.circleId}
            onChange={(v) => setForm({ ...form, circleId: v })}
            options={circles.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Kun"
            value={form.day}
            onChange={(v) => setForm({ ...form, day: v })}
            options={DAYS.map((d) => ({ value: d, label: d }))}
          />
          <Input label="Boshlanish" value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} placeholder="14:00" />
          <Input label="Tugash" value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} placeholder="16:00" />
          <Input label="Xona" value={form.room} onChange={(v) => setForm({ ...form, room: v })} />
          <Button className="w-full" onClick={handleAdd}>Saqlash</Button>
        </div>
      </Modal>
    </div>
  );
}
