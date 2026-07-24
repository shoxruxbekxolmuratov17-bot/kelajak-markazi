import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, CheckCircle, ArrowRight, Database } from 'lucide-react';
import { Card, Badge, Button } from '../components/ui';
import { MONTHLY_FEE, BHM_AMOUNT, MONTHLY_FEE_BHM_PERCENT } from '../types';
import { api } from '../api/client';
import { useStore } from '../store/useStore';

function dash(v?: string | null) {
  if (!v) return '—';
  return v;
}

const implementedFeatures = [
  { title: "Onlayn ro'yxatdan o'tish", path: '/royxat-admin', description: 'Ota-onalar farzandlarini to\'garaklarga onlayn yozdirishi mumkin' },
  { title: 'Ota-ona portali', path: '/login', description: 'Davomat, yutuqlar va to\'lovlarni kuzatish — login orqali' },
  { title: "Tarmoq to'garaklarni kengaytirish", path: '/tarmoq', description: 'Yangi maktablarda to\'garak ochish imkoniyati' },
  { title: 'Robototexnika laboratoriyasi', path: '/laboratoriya', description: 'Arduino, Raspberry Pi, 3D printer boshqaruvi' },
  { title: "Inklyuziv to'garaklar", path: '/togaraklar', description: 'Maxsus ehtiyojli bolalar uchun to\'garaklar' },
  { title: 'Xalqaro hamkorlik', path: '/hamkorlik', description: 'Hamkor tashkilotlar va onlayn master-klasslar' },
];

export function SettingsPage() {
  const formatMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";
  const apiOnline = useStore((s) => s.apiOnline);
  const authUser = useStore((s) => s.authUser);
  const districts = useStore((s) => s.districts);
  const activeDistrictId = useStore((s) => s.activeDistrictId);
  const setActiveDistrict = useStore((s) => s.setActiveDistrict);
  const centerInfo = useStore((s) => s.centerInfo);
  const [backupMsg, setBackupMsg] = useState('');
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!apiOnline) return;
    void api.health().then((h) => setHealth(h as Record<string, unknown>)).catch(() => setHealth(null));
  }, [apiOnline]);

  const handleBackup = async () => {
    try {
      const res = await api.backup();
      setBackupMsg(`Zaxira saqlandi: ${res.path}`);
    } catch (e) {
      setBackupMsg(e instanceof Error ? e.message : 'Zaxira xatosi');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-success/10 border-success/30">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-success" />
          <div>
            <p className="font-semibold text-dark">Tizim holati</p>
            <p className="text-sm text-muted">
              DB: {String(health?.db || (apiOnline ? '…' : 'offline'))}
              {health?.cache ? ` · cache=${String(health.cache)}` : ''}
              {apiOnline ? ' · API online' : ' · offline demo'}
              {health?.demoMode != null ? ` · demo=${String(health.demoMode)}` : ''}
            </p>
          </div>
        </div>
      </Card>

      {authUser?.role === 'superadmin' && districts.length > 0 && (
        <Card>
          <h3 className="font-bold text-dark mb-3">Viloyat monitoringi — tuman tanlash</h3>
          <p className="text-xs text-muted mb-3">Qashqadaryo viloyati · {districts.length} tuman/shahar</p>
          <select
            aria-label="Tuman tanlash"
            className="w-full rounded-xl border border-border bg-surface text-dark text-sm py-2.5 px-3"
            value={activeDistrictId || 'all'}
            onChange={(e) => void setActiveDistrict(e.target.value === 'all' ? 'all' : e.target.value)}
          >
            <option value="all">Qashqadaryo — barcha tumanlar</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Card>
      )}

      {apiOnline && (
        <Card className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-dark">Ma'lumotlar zaxirasi</p>
              <p className="text-xs text-muted">db.json nusxasini backups/ ga yozadi</p>
            </div>
          </div>
          <Button onClick={handleBackup}>Zaxira olish</Button>
        </Card>
      )}
      {backupMsg && <p className="text-sm text-muted">{backupMsg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {implementedFeatures.map((f) => (
          <Link key={f.path} to={f.path}>
            <Card className="hover:border-primary/40 hover:shadow-md transition-all h-full">
              <div className="flex items-start justify-between">
                <div>
                  <Badge color="#34C759">Faol</Badge>
                  <h4 className="font-semibold text-dark mt-2">{f.title}</h4>
                  <p className="text-xs text-muted mt-1">{f.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-dark text-lg mb-4">Markaz ma'lumotlari</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">KM</div>
              <div>
                <p className="font-bold text-dark">{dash(centerInfo.name)}</p>
                <p className="text-sm text-muted">
                  {dash(centerInfo.district)}
                  {centerInfo.region ? `, ${centerInfo.region}` : ''}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted"><MapPin className="w-4 h-4 text-primary" />{dash(centerInfo.address)}</div>
              <div className="flex items-center gap-2 text-muted"><Phone className="w-4 h-4 text-primary" />{dash(centerInfo.phone)}</div>
              <div className="flex items-center gap-2 text-muted"><Mail className="w-4 h-4 text-primary" />{dash(centerInfo.email)}</div>
              <div className="flex items-center gap-2 text-muted"><Clock className="w-4 h-4 text-primary" />{dash(centerInfo.workingHours)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div><p className="text-xs text-muted">Direktor</p><p className="text-sm font-medium">{dash(centerInfo.director)}</p></div>
              <div><p className="text-xs text-muted">Guruh</p><p className="text-sm font-medium">{dash(centerInfo.group)}</p></div>
              <div><p className="text-xs text-muted">Yosh oralig'i</p><p className="text-sm font-medium">{dash(centerInfo.ageRange)}</p></div>
              <div>
                <p className="text-xs text-muted">Mavsum</p>
                <p className="text-sm font-medium">
                  {centerInfo.seasonStart || centerInfo.seasonEnd
                    ? `${dash(centerInfo.seasonStart)} — ${dash(centerInfo.seasonEnd)}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-bold text-dark text-lg mb-4">To'lov ma'lumotlari</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <p className="text-sm text-muted">Oylik badal to'lovi</p>
              <p className="text-2xl font-bold text-primary mt-1">{formatMoney(MONTHLY_FEE)}</p>
              <p className="text-xs text-muted mt-1">BHM ({formatMoney(BHM_AMOUNT)}) ning {MONTHLY_FEE_BHM_PERCENT}%</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted">• To'lov har oyning <strong>10-sanasigacha</strong></p>
              <p className="text-muted">• Sentabr oyi uchun — <strong>30-sentyabrgacha</strong></p>
              <p className="text-muted">• 2026-yil sentyabrdan: BHMning <strong>30%</strong></p>
              <p className="text-muted">• Mablag'larning 10% — respublika jamg'armasiga</p>
              <p className="text-muted">• Tarmoq to'garaklarda 40% — maktab fondiga</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-dark text-lg mb-4">Faoliyat yo'nalishlari</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            'Robototexnika va AI', 'Dasturlash (Python, Web)', '3D modellashtirish',
            'Sport (futbol, voleybol)', "San'at va musiqa", 'Xorijiy tillar',
            'Matematika olimpiadasi', 'Kitobxonlik klubi', 'Mobilografiya',
            'Kasb-hunar', "Inklyuziv to'garaklar", 'STEAM loyihalar',
          ].map((dir) => (
            <div key={dir} className="p-3 rounded-xl bg-surface text-sm font-medium text-dark text-center">
              {dir}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
