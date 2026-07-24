import { useEffect, useMemo, useState } from 'react';
import { Users, KeyRound, Search, Phone, GraduationCap } from 'lucide-react';
import { Card, Badge, Button, Modal, Input } from '../components/ui';
import { useStore } from '../store/useStore';
import { RegionFilters, matchDistrict, useIsViloyatAdmin } from '../components/RegionFilters';
import type { ParentAccount } from '../types';

const PAGE_SIZE = 100;

export function ParentsPage() {
  const { parentAccounts, loadParentAccounts, setParentPin, authUser } = useStore();
  const isViloyat = useIsViloyatAdmin();
  const canManage = authUser?.role === 'admin' || authUser?.role === 'district_admin' || authUser?.role === 'superadmin';
  const [districtFilter, setDistrictFilter] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pinModal, setPinModal] = useState<ParentAccount | null>(null);
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (canManage) void loadParentAccounts();
  }, [canManage, loadParentAccounts]);

  const scoped = useMemo(
    () =>
      parentAccounts.filter(
        (p) => matchDistrict(p.districtId, districtFilter) || districtFilter === 'all'
      ),
    [parentAccounts, districtFilter]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return scoped;
    return scoped.filter(
      (p) =>
        p.parentName.toLowerCase().includes(query) ||
        p.parentPhone.replace(/\s/g, '').includes(query.replace(/\s/g, '')) ||
        p.children.some(
          (c) =>
            `${c.lastName} ${c.firstName}`.toLowerCase().includes(query) ||
            c.school.toLowerCase().includes(query)
        )
    );
  }, [scoped, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, districtFilter]);

  const openPin = (p: ParentAccount) => {
    setPinModal(p);
    setNewPin(p.pin || '');
    setPinError('');
  };

  const savePin = async () => {
    if (!pinModal) return;
    if (newPin.trim().length < 4) {
      setPinError('PIN kamida 4 raqam');
      return;
    }
    setBusy(true);
    try {
      await setParentPin(pinModal.phoneNorm, newPin.trim());
      setPinModal(null);
    } catch (e) {
      setPinError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return (
      <Card className="text-center py-12">
        <p className="text-muted">Bu bo‘lim faqat direktor va admin uchun.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />

      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border bg-primary/5">
          <div>
            <h2 className="font-bold text-dark flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Ota-onalar
            </h2>
            <p className="text-xs text-muted mt-1">
              Ro‘yxatdan o‘tgan ota-onalar: telefon = login, PIN = parol. Farzandlari va ma’lumotlari.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-sm"
              placeholder="Ism, telefon yoki farzand..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="px-5 py-3 flex flex-wrap gap-4 text-sm border-b border-border">
          <span className="text-muted">Jami: <strong className="text-dark">{filtered.length}</strong></span>
          <span className="text-muted">PIN bor: <strong className="text-success">{filtered.filter((p) => p.hasPin).length}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border bg-surface/50">
                <th className="px-5 py-3 font-medium">Ota-ona F.I.Sh.</th>
                <th className="px-3 py-3 font-medium">Login (telefon)</th>
                <th className="px-3 py-3 font-medium">PIN (parol)</th>
                <th className="px-3 py-3 font-medium">Farzand(lar)</th>
                <th className="px-3 py-3 font-medium">Maktab / sinf</th>
                <th className="px-5 py-3 font-medium text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((p) => (
                <tr key={p.id} className="border-b border-border/70 hover:bg-primary/[0.03] align-top">
                  <td className="px-5 py-3 font-medium text-dark">{p.parentName}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1 text-muted">
                      <Phone className="w-3.5 h-3.5" />
                      {p.parentPhone}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">
                    {p.pin ? (
                      <span className="text-dark">{p.pin}</span>
                    ) : p.hasPin ? (
                      <span className="text-muted">Belgilangan (ko‘rinmaydi)</span>
                    ) : (
                      <Badge color="#FF9500">PIN yo‘q</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      {p.children.slice(0, 3).map((c) => (
                        <div key={c.id} className="flex items-center gap-1 text-dark">
                          <GraduationCap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span>{c.lastName} {c.firstName}</span>
                        </div>
                      ))}
                      {p.children.length > 3 && (
                        <span className="text-xs text-muted">+{p.children.length - 3} boshqa</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-muted text-xs">
                    {p.children.slice(0, 2).map((c) => (
                      <div key={c.id}>{c.school} · {c.grade}-sinf</div>
                    ))}
                    {p.children[0]?.circleNames?.length ? (
                      <div className="mt-1 text-primary">{p.children[0].circleNames.join(', ')}</div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {!isViloyat && (
                      <Button size="sm" variant="secondary" onClick={() => openPin(p)} title="PIN tahrirlash">
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted">
                    Ota-onalar topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-sm">
            <span className="text-muted">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Oldingi
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Keyingi
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={!!pinModal} onClose={() => setPinModal(null)} title="PIN tahrirlash">
        <div className="space-y-3">
          {pinModal && (
            <>
              <p className="text-sm text-muted">{pinModal.parentName} · {pinModal.parentPhone}</p>
              <Input label="PIN (parol)" value={newPin} onChange={setNewPin} />
            </>
          )}
          {pinError && <p className="text-sm text-danger">{pinError}</p>}
          <Button className="w-full" onClick={() => void savePin()} disabled={busy}>
            {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
