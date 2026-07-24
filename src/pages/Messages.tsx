import { useMemo, useState } from 'react';
import { Bell, Calendar, Info, CheckCircle, AlertTriangle, Plus, MessageCircle, Send } from 'lucide-react';
import { Card, Badge, Button, Modal, Input, Select } from '../components/ui';
import { useStore } from '../store/useStore';
import { RegionFilters, matchDistrict } from '../components/RegionFilters';
import type { Message, UserRole } from '../types';

const TYPE_CONFIG = {
  info: { icon: Info, color: '#5AC8FA', label: "Ma'lumot" },
  warning: { icon: AlertTriangle, color: '#FF9500', label: 'Ogohlantirish' },
  success: { icon: CheckCircle, color: '#34C759', label: 'Yangilik' },
  event: { icon: Calendar, color: '#9588E8', label: 'Tadbir' },
  direct: { icon: MessageCircle, color: '#AF52DE', label: 'Shaxsiy' },
};

function visibleToUser(
  msg: Message,
  role: UserRole | undefined,
  userId: string | undefined,
  teacherId: string | undefined,
  phone: string | undefined
) {
  if (!msg.toAudience || msg.toAudience === 'all') return true;
  if (msg.fromUserId && userId && msg.fromUserId === userId) return true;
  if (msg.toAudience === 'staff' && (role === 'admin' || role === 'district_admin' || role === 'superadmin' || role === 'teacher')) return true;
  if (msg.toAudience === 'parents' && role === 'parent') return true;
  if (msg.toAudience === 'user') {
    if (userId && msg.toUserId === userId) return true;
    if (teacherId && msg.toUserId === teacherId) return true;
    if (phone && msg.toUserId === phone.replace(/\s/g, '')) return true;
    if (role === 'admin' || role === 'district_admin' || role === 'superadmin') return true;
  }
  return false;
}

export function MessagesPage() {
  const {
    messages, markMessageRead, addMessage, authUser, parentPhone,
    teachers, students, circles,
  } = useStore();
  const role = authUser?.role;
  const phone = parentPhone || authUser?.phone || '';
  const [districtFilter, setDistrictFilter] = useState('all');
  const isViloyat = role === 'superadmin';

  const inbox = useMemo(
    () =>
      messages
        .filter((m) => visibleToUser(m, role, authUser?.id, authUser?.teacherId, phone))
        .filter((m) => matchDistrict(m.districtId, districtFilter)),
    [messages, role, authUser?.id, authUser?.teacherId, phone, districtFilter]
  );
  const unread = inbox.filter((m) => !m.read);

  const [composeOpen, setComposeOpen] = useState(false);
  const [viewMsg, setViewMsg] = useState<Message | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'info',
    audience: 'staff' as 'all' | 'staff' | 'parents' | 'user',
    toUserId: '',
    toName: '',
  });

  const recipientOptions = useMemo(() => {
    if (role === 'parent') {
      const myChildren = students.filter(
        (s) => s.parentPhone.replace(/\s/g, '') === phone.replace(/\s/g, '')
      );
      const teacherIds = new Set<string>();
      for (const child of myChildren) {
        for (const cid of child.circleIds) {
          const circle = circles.find((c) => c.id === cid);
          if (circle?.teacherId) teacherIds.add(circle.teacherId);
        }
      }
      return teachers
        .filter((t) => teacherIds.has(t.id) || teacherIds.size === 0)
        .filter((t) => !t.isVacant)
        .map((t) => ({
          value: t.id,
          label: `${t.fullName || `${t.lastName} ${t.firstName}`} — ${t.specialty}`,
          name: t.fullName || `${t.lastName} ${t.firstName}`,
        }));
    }
    // Staff: boshqa xodimlar + ota-onalar
    const staff = teachers
      .filter((t) => !t.isVacant)
      .map((t) => ({
        value: t.id,
        label: `Xodim: ${t.fullName || `${t.lastName} ${t.firstName}`}`,
        name: t.fullName || `${t.lastName} ${t.firstName}`,
      }));
    const parents = students.map((s) => ({
      value: s.parentPhone.replace(/\s/g, ''),
      label: `Ota-ona: ${s.parentName} (${s.firstName} ${s.lastName})`,
      name: s.parentName,
    }));
    // unique parents by phone
    const seen = new Set<string>();
    const uniqueParents = parents.filter((p) => {
      if (seen.has(p.value)) return false;
      seen.add(p.value);
      return true;
    });
    return [...staff, ...uniqueParents];
  }, [role, teachers, students, circles, phone]);

  const openMessage = (msg: Message) => {
    setViewMsg(msg);
    if (!msg.read) markMessageRead(msg.id);
  };

  const handleSend = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (form.audience === 'user' && !form.toUserId) return;

    const audience = role === 'parent' ? 'user' : form.audience;
    const toUserId = audience === 'user' ? form.toUserId : undefined;
    const toName =
      audience === 'user'
        ? form.toName || recipientOptions.find((r) => r.value === form.toUserId)?.name
        : audience === 'staff'
          ? 'Barcha xodimlar'
          : audience === 'parents'
            ? 'Barcha ota-onalar'
            : 'Hammaga';

    addMessage({
      title: form.title.trim(),
      content: form.content.trim(),
      type: audience === 'user' ? 'direct' : (form.type as Message['type']),
      fromName: authUser?.fullName,
      fromRole: authUser?.role,
      fromUserId: authUser?.id,
      toAudience: audience,
      toUserId,
      toName,
    });
    setForm({ title: '', content: '', type: 'info', audience: role === 'parent' ? 'user' : 'staff', toUserId: '', toName: '' });
    setComposeOpen(false);
  };

  const canSend = !!authUser;

  return (
    <div className="space-y-6 animate-fade-in">
      {isViloyat && (
        <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />
      )}
      <div className="flex justify-between items-center gap-3">
        {unread.length > 0 ? (
          <Card className="bg-primary/5 border-primary/20 flex items-center gap-3 flex-1 !mb-0">
            <Bell className="w-5 h-5 text-primary" />
            <p className="text-sm text-dark">
              <strong>{unread.length} ta</strong> o'qilmagan xabar mavjud
            </p>
          </Card>
        ) : <div />}
        {canSend && !isViloyat && (
          <Button onClick={() => {
            setForm((f) => ({ ...f, audience: role === 'parent' ? 'user' : 'staff' }));
            setComposeOpen(true);
          }}>
            <Plus className="w-4 h-4" /> Yuborish
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {inbox.length === 0 ? (
          <Card>
            <p className="text-sm text-muted text-center py-6">Xabarlar yo'q</p>
          </Card>
        ) : inbox.map((msg) => {
          const config = TYPE_CONFIG[msg.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
          const Icon = config.icon;
          return (
            <Card
              key={msg.id}
              className={`cursor-pointer transition-all hover:shadow-md ${!msg.read ? 'border-l-4 border-l-primary' : ''}`}
              onClick={() => openMessage(msg)}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className={`font-semibold ${!msg.read ? 'text-dark' : 'text-muted'}`}>{msg.title}</h3>
                      <p className="text-sm text-muted mt-1 line-clamp-2">{msg.content}</p>
                      {(msg.fromName || msg.toName) && (
                        <p className="text-xs text-muted/80 mt-1.5">
                          {msg.fromName ? `Kimdan: ${msg.fromName}` : ''}
                          {msg.fromName && msg.toName ? ' · ' : ''}
                          {msg.toName ? `Kimga: ${msg.toName}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge color={config.color}>{config.label}</Badge>
                      <p className="text-xs text-muted mt-2">{msg.date}</p>
                    </div>
                  </div>
                </div>
                {!msg.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={!!viewMsg} onClose={() => setViewMsg(null)} title={viewMsg?.title || 'Xabar'}>
        {viewMsg && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge color={(TYPE_CONFIG[viewMsg.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info).color}>
                {(TYPE_CONFIG[viewMsg.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info).label}
              </Badge>
              <span className="text-xs text-muted">{viewMsg.date}</span>
            </div>
            {(viewMsg.fromName || viewMsg.toName) && (
              <div className="text-sm text-muted space-y-1">
                {viewMsg.fromName && <p><span className="font-medium text-dark">Kimdan:</span> {viewMsg.fromName}</p>}
                {viewMsg.toName && <p><span className="font-medium text-dark">Kimga:</span> {viewMsg.toName}</p>}
              </div>
            )}
            <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap">{viewMsg.content}</p>
            <Button className="w-full" variant="secondary" onClick={() => setViewMsg(null)}>Yopish</Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={composeOpen} onClose={() => setComposeOpen(false)} title="Yangi xabar">
        <div className="space-y-3">
          <Input label="Sarlavha" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <label className="block text-sm font-medium text-dark mb-1.5">Matn</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-dark text-sm min-h-[100px]"
            placeholder="Xabar matni..."
          />

          {role === 'parent' ? (
            <Select
              label="O'qituvchi / xodim"
              value={form.toUserId}
              onChange={(v) => {
                const opt = recipientOptions.find((r) => r.value === v);
                setForm({ ...form, audience: 'user', toUserId: v, toName: opt?.name || '' });
              }}
              options={[
                { value: '', label: 'Tanlang...' },
                ...recipientOptions.map((r) => ({ value: r.value, label: r.label })),
              ]}
            />
          ) : (
            <>
              <Select
                label="Kimga"
                value={form.audience}
                onChange={(v) => setForm({ ...form, audience: v as typeof form.audience, toUserId: '', toName: '' })}
                options={[
                  { value: 'staff', label: 'Barcha xodimlar' },
                  { value: 'parents', label: 'Barcha ota-onalar' },
                  { value: 'all', label: 'Hammaga (umumiy e\'lon)' },
                  { value: 'user', label: 'Aniq shaxs' },
                ]}
              />
              {form.audience === 'user' && (
                <Select
                  label="Qabul qiluvchi"
                  value={form.toUserId}
                  onChange={(v) => {
                    const opt = recipientOptions.find((r) => r.value === v);
                    setForm({ ...form, toUserId: v, toName: opt?.name || '' });
                  }}
                  options={[
                    { value: '', label: 'Tanlang...' },
                    ...recipientOptions.map((r) => ({ value: r.value, label: r.label })),
                  ]}
                />
              )}
              {form.audience !== 'user' && (
                <Select
                  label="Tur"
                  value={form.type}
                  onChange={(v) => setForm({ ...form, type: v })}
                  options={[
                    { value: 'info', label: "Ma'lumot" },
                    { value: 'warning', label: 'Ogohlantirish' },
                    { value: 'success', label: 'Yangilik' },
                    { value: 'event', label: 'Tadbir' },
                  ]}
                />
              )}
            </>
          )}

          <Button className="w-full" onClick={handleSend}>
            <Send className="w-4 h-4" /> Yuborish
          </Button>
        </div>
      </Modal>
    </div>
  );
}
