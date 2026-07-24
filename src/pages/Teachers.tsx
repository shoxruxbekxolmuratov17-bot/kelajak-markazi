import { useEffect, useMemo, useState } from 'react';
import {
  Phone, Mail, BookOpen, Plus, Edit, Trash2, FileText, MapPin,
  KeyRound, Ban, Unlock, UserPlus, Shield,
} from 'lucide-react';
import { Card, Badge, ProgressBar, Button, Modal, Input } from '../components/ui';
import { useStore } from '../store/useStore';
import { RegionFilters, matchDistrict, useDistrictLabel, useIsViloyatAdmin } from '../components/RegionFilters';
import type { StaffAccount, Teacher } from '../types';
import { api } from '../api/client';

function displayName(t: Teacher) {
  if (t.isVacant) return "Lavozim bo'sh";
  return t.fullName || `${t.lastName} ${t.firstName}`.trim();
}

function initials(t: Teacher) {
  const name = displayName(t);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return (parts[0]?.[0] || '?').toUpperCase();
}

type AccountForm = {
  teacherId: string;
  fullName: string;
  username: string;
  password: string;
  phone: string;
};

const emptyAccountForm = (): AccountForm => ({
  teacherId: '',
  fullName: '',
  username: '',
  password: '',
  phone: '',
});

export function TeachersPage() {
  const {
    teachers,
    circles,
    staffAccounts,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    loadStaffAccounts,
    createStaffAccount,
    updateStaffAccount,
    setStaffPassword,
    blockStaffAccount,
    deleteStaffAccount,
    authUser,
  } = useStore();
  const isAdmin = authUser?.role === 'admin' || authUser?.role === 'district_admin';
  const isViloyat = useIsViloyatAdmin();
  const canManageAccounts = isAdmin || authUser?.role === 'superadmin';
  const districtLabel = useDistrictLabel();
  const [districtFilter, setDistrictFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '', firstName: '', lastName: '', specialty: '', department: '',
    phone: '', email: '', orderInfo: '', isVacant: false,
  });

  const [accountModal, setAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm());
  const [accountError, setAccountError] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [createdPasswordHint, setCreatedPasswordHint] = useState<string | null>(null);

  useEffect(() => {
    if (canManageAccounts) void loadStaffAccounts();
  }, [canManageAccounts, loadStaffAccounts]);

  const scoped = useMemo(
    () => teachers.filter((t) => matchDistrict(t.districtId, districtFilter)),
    [teachers, districtFilter]
  );
  const filled = scoped.filter((t) => !t.isVacant);
  const vacant = scoped.filter((t) => t.isVacant).length;
  const departments = useMemo(() => {
    const map = new Map<string, Teacher[]>();
    for (const t of scoped) {
      const key = t.department || 'Boshqa';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return [...map.entries()];
  }, [scoped]);

  const accountByTeacher = useMemo(() => {
    const map = new Map<string, StaffAccount>();
    for (const a of staffAccounts) {
      if (a.teacherId) map.set(a.teacherId, a);
    }
    return map;
  }, [staffAccounts]);

  /** To‘garak rahbarlari va markaz xodimlari — akkaunt boshqaruvi jadvali */
  const leaderRows = useMemo(() => {
    return scoped
      .filter(
        (t) =>
          !t.isVacant &&
          (t.id.startsWith('tl') || (t.id.startsWith('st') && t.id !== 'st1' && t.id !== 'st2'))
      )
      .sort((a, b) => displayName(a).localeCompare(displayName(b), 'uz'));
  }, [scoped]);

  const teachersWithoutAccount = useMemo(
    () => leaderRows.filter((t) => !accountByTeacher.has(t.id)),
    [leaderRows, accountByTeacher]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({
      fullName: '', firstName: '', lastName: '', specialty: '', department: '',
      phone: '', email: '', orderInfo: '', isVacant: false,
    });
    setModalOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditingId(t.id);
    setForm({
      fullName: t.fullName || displayName(t),
      firstName: t.firstName,
      lastName: t.lastName,
      specialty: t.specialty,
      department: t.department || '',
      phone: t.phone,
      email: t.email,
      orderInfo: t.orderInfo || '',
      isVacant: !!t.isVacant,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const fullName = form.fullName.trim();
    if (!fullName && (!form.firstName || !form.lastName)) return;
    const parts = fullName.split(/\s+/);
    const lastName = form.lastName.trim() || parts[0] || '';
    const firstName = form.firstName.trim() || parts.slice(1).join(' ') || fullName;
    const data = {
      fullName: fullName || `${lastName} ${firstName}`.trim(),
      firstName,
      lastName,
      specialty: form.specialty,
      department: form.department || undefined,
      orderInfo: form.orderInfo || undefined,
      phone: form.phone,
      email: form.email,
      isVacant: form.isVacant,
    };
    if (editingId) updateTeacher(editingId, data);
    else {
      addTeacher({
        id: `st${Date.now()}`,
        ...data,
        circleIds: [],
        experience: 0,
        rating: 0,
        isInclusive: false,
      });
    }
    setModalOpen(false);
  };

  const openCreateAccount = async (teacher?: Teacher) => {
    setEditingAccountId(null);
    setAccountError('');
    setCreatedPasswordHint(null);
    const t = teacher || teachersWithoutAccount[0];
    const fullName = t ? displayName(t) : '';
    let username = '';
    if (fullName) {
      try {
        const s = await api.suggestUsername(fullName);
        username = s.username;
      } catch {
        username = '';
      }
    }
    setAccountForm({
      teacherId: t?.id || '',
      fullName,
      username,
      password: 'teacher123',
      phone: t && t.phone !== '—' ? t.phone : '',
    });
    setAccountModal(true);
  };

  const openEditAccount = (account: StaffAccount) => {
    setEditingAccountId(account.id);
    setAccountError('');
    setCreatedPasswordHint(null);
    setAccountForm({
      teacherId: account.teacherId || '',
      fullName: account.fullName,
      username: account.username,
      password: '',
      phone: account.phone || '',
    });
    setAccountModal(true);
  };

  const onPickTeacher = async (teacherId: string) => {
    const t = teachers.find((x) => x.id === teacherId);
    const fullName = t ? displayName(t) : accountForm.fullName;
    let username = accountForm.username;
    if (t && !editingAccountId) {
      try {
        const s = await api.suggestUsername(fullName);
        username = s.username;
      } catch {
        /* keep */
      }
    }
    setAccountForm({
      ...accountForm,
      teacherId,
      fullName,
      username,
      phone: t && t.phone !== '—' ? t.phone : accountForm.phone,
    });
  };

  const saveAccount = async () => {
    setAccountError('');
    setAccountBusy(true);
    try {
      if (editingAccountId) {
        await updateStaffAccount(editingAccountId, {
          username: accountForm.username.trim(),
          fullName: accountForm.fullName.trim(),
          phone: accountForm.phone.trim() || undefined,
          teacherId: accountForm.teacherId || undefined,
        });
        if (accountForm.password.trim()) {
          await setStaffPassword(editingAccountId, accountForm.password.trim());
        }
        setAccountModal(false);
      } else {
        if (!accountForm.teacherId) {
          setAccountError('O‘qituvchini tanlang');
          return;
        }
        const created = await createStaffAccount({
          username: accountForm.username.trim(),
          password: accountForm.password.trim() || 'teacher123',
          fullName: accountForm.fullName.trim(),
          teacherId: accountForm.teacherId,
          phone: accountForm.phone.trim() || undefined,
        });
        if (created?.tempPassword) {
          setCreatedPasswordHint(
            `Akkaunt yaratildi. Login: ${created.username} · Parol: ${created.tempPassword}`
          );
        }
        setAccountModal(false);
      }
      await loadStaffAccounts();
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
    } finally {
      setAccountBusy(false);
    }
  };

  const toggleBlock = async (account: StaffAccount) => {
    try {
      await blockStaffAccount(account.id, !account.blocked);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Bloklashda xato');
    }
  };

  const removeAccount = async (account: StaffAccount) => {
    if (!confirm(`${account.fullName} akkauntini o‘chirasizmi?`)) return;
    try {
      await deleteStaffAccount(account.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'O‘chirishda xato');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />

      {canManageAccounts && !isViloyat && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border bg-primary/5">
            <div>
              <h2 className="font-bold text-dark flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                O‘qituvchi akkauntlari
              </h2>
              <p className="text-xs text-muted mt-1">
                Har bir o‘qituvchi/xodimga login/parol bering. Standart parol: <strong className="text-dark">teacher123</strong>
              </p>
            </div>
            <Button onClick={() => openCreateAccount()} disabled={!teachersWithoutAccount.length}>
              <UserPlus className="w-4 h-4" /> Akkaunt yaratish
            </Button>
          </div>

          {createdPasswordHint && (
            <div className="mx-5 mt-4 rounded-xl bg-success/10 text-success text-sm px-4 py-3">
              {createdPasswordHint}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border bg-surface/50">
                  <th className="px-5 py-3 font-medium">F.I.Sh.</th>
                  <th className="px-3 py-3 font-medium">Lavozim</th>
                  <th className="px-3 py-3 font-medium">Login</th>
                  <th className="px-3 py-3 font-medium">Parol</th>
                  <th className="px-3 py-3 font-medium">To‘garak</th>
                  <th className="px-3 py-3 font-medium">Holat</th>
                  <th className="px-5 py-3 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {leaderRows.map((teacher) => {
                  const account = accountByTeacher.get(teacher.id);
                  const teacherCircles = circles.filter(
                    (c) => c.teacherId === teacher.id || teacher.circleIds?.includes(c.id)
                  );
                  return (
                    <tr key={teacher.id} className="border-b border-border/70 hover:bg-primary/[0.03]">
                      <td className="px-5 py-3 font-medium text-dark">{displayName(teacher)}</td>
                      <td className="px-3 py-3 text-muted">{teacher.specialty}</td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {account?.username || <span className="text-warning">— yo‘q</span>}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-muted">
                        {account ? (account.defaultPassword || 'teacher123') : '—'}
                      </td>
                      <td className="px-3 py-3 text-muted">{teacherCircles.length}</td>
                      <td className="px-3 py-3">
                        {!account && <Badge color="#FF9500">Akkaunt yo‘q</Badge>}
                        {account && !account.blocked && <Badge color="#34C759">Faol</Badge>}
                        {account?.blocked && <Badge color="#FF3B30">Bloklangan</Badge>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {!account ? (
                            <Button size="sm" variant="secondary" onClick={() => openCreateAccount(teacher)}>
                              <UserPlus className="w-3.5 h-3.5" /> Yaratish
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => openEditAccount(account)} title="Login/parol">
                                <KeyRound className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => toggleBlock(account)}
                                title={account.blocked ? 'Blokdan chiqarish' : 'Bloklash'}
                              >
                                {account.blocked ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => removeAccount(account)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {leaderRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted">
                      Bu tuman uchun o‘qituvchilar topilmadi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isAdmin && !isViloyat && (
        <div className="flex justify-end">
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> Xodim qo&apos;shish</Button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-primary">{scoped.length}</p>
          <p className="text-xs text-muted mt-1">Jami shtat o&apos;rinlari</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-success">{filled.length}</p>
          <p className="text-xs text-muted mt-1">Band lavozimlar</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-warning">{vacant}</p>
          <p className="text-xs text-muted mt-1">Bo&apos;sh lavozimlar</p>
        </Card>
      </div>

      {scoped.length === 0 && (
        <Card className="text-center py-10">
          <p className="text-muted text-sm">Bu tuman uchun xodimlar hali kiritilmagan.</p>
          <p className="text-xs text-muted mt-1">Lavozimlar bo‘sh — Qamashi ma’lumotlari ko‘rsatilmaydi.</p>
        </Card>
      )}

      {departments.map(([dept, list]) => (
        <div key={dept} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{dept}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((teacher) => {
              const teacherCircles = circles.filter((c) => teacher.circleIds.includes(c.id));
              const totalStudents = teacherCircles.reduce((s, c) => s + c.enrolled, 0);
              const name = displayName(teacher);
              const account = accountByTeacher.get(teacher.id);

              return (
                <Card key={teacher.id} className={teacher.isVacant ? 'opacity-70 border-dashed' : undefined}>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                      {teacher.isVacant ? '—' : initials(teacher)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-dark leading-snug">{name}</h3>
                      <p className="text-sm text-primary font-medium mt-0.5">{teacher.specialty}</p>
                      {account && (
                        <p className="text-xs text-muted mt-1 font-mono">@{account.username}</p>
                      )}
                      {isViloyat && (
                        <p className="text-xs text-muted mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{districtLabel(teacher.districtId)}
                        </p>
                      )}
                      {teacher.isVacant && <Badge color="#FF9500">Bo&apos;sh</Badge>}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    {!teacher.isVacant && (
                      <>
                        <div className="flex items-center gap-2 text-muted"><Phone className="w-4 h-4 flex-shrink-0" /><span>{teacher.phone}</span></div>
                        {teacher.email && teacher.email !== '—' && (
                          <div className="flex items-center gap-2 text-muted"><Mail className="w-4 h-4 flex-shrink-0" /><span className="truncate">{teacher.email}</span></div>
                        )}
                      </>
                    )}
                    {teacher.orderInfo && (
                      <div className="flex items-start gap-2 text-muted"><FileText className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{teacher.orderInfo}</span></div>
                    )}
                  </div>

                  {teacherCircles.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted flex items-center gap-1">
                          <BookOpen className="w-4 h-4" /> {teacherCircles.length} to&apos;garak
                        </span>
                        <span className="font-medium">{totalStudents} o&apos;quvchi</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {teacherCircles.slice(0, 4).map((c) => (
                          <Badge key={c.id} color="#9588E8">{c.name}</Badge>
                        ))}
                        {teacherCircles.length > 4 && (
                          <Badge color="#9588E8">+{teacherCircles.length - 4}</Badge>
                        )}
                      </div>
                      <div className="mt-3">
                        <ProgressBar
                          value={Math.min(100, Math.round((totalStudents / Math.max(1, teacherCircles.reduce((s, c) => s + c.capacity, 0))) * 100))}
                          showLabel
                          color="#9588E8"
                        />
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(teacher)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="danger" size="sm" onClick={() => deleteTeacher(teacher.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Tahrirlash' : "Xodim qo'shish"}>
        <div className="space-y-3">
          <Input label="To'liq F.I.Sh." value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} />
          <Input label="Familiya" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
          <Input label="Ism va otasining ismi" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
          <Input label="Lavozim" value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} />
          <Input label="Bo'lim" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          <Input label="Buyruq (sana, raqam)" value={form.orderInfo} onChange={(v) => setForm({ ...form, orderInfo: v })} />
          <Input label="Telefon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <label className="flex items-center gap-2 text-sm text-dark">
            <input type="checkbox" checked={form.isVacant} onChange={(e) => setForm({ ...form, isVacant: e.target.checked })} />
            Lavozim bo&apos;sh
          </label>
          <Button className="w-full" onClick={handleSave}>Saqlash</Button>
        </div>
      </Modal>

      <Modal
        isOpen={accountModal}
        onClose={() => setAccountModal(false)}
        title={editingAccountId ? 'Akkauntni tahrirlash' : 'Yangi akkaunt'}
      >
        <div className="space-y-3">
          {!editingAccountId && (
            <label className="block text-sm">
              <span className="text-muted mb-1 block">O‘qituvchi</span>
              <select
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-dark"
                value={accountForm.teacherId}
                onChange={(e) => void onPickTeacher(e.target.value)}
              >
                <option value="">Tanlang…</option>
                {teachersWithoutAccount.map((t) => (
                  <option key={t.id} value={t.id}>{displayName(t)}</option>
                ))}
              </select>
            </label>
          )}
          <Input
            label="F.I.Sh."
            value={accountForm.fullName}
            onChange={(v) => setAccountForm({ ...accountForm, fullName: v })}
          />
          <Input
            label="Login"
            value={accountForm.username}
            onChange={(v) => setAccountForm({ ...accountForm, username: v })}
          />
          <Input
            label={editingAccountId ? 'Yangi parol (bo‘sh qoldirilsa o‘zgarmaydi)' : 'Parol'}
            type="password"
            value={accountForm.password}
            onChange={(v) => setAccountForm({ ...accountForm, password: v })}
          />
          <Input
            label="Telefon"
            value={accountForm.phone}
            onChange={(v) => setAccountForm({ ...accountForm, phone: v })}
          />
          {accountError && <p className="text-sm text-danger">{accountError}</p>}
          <Button className="w-full" onClick={() => void saveAccount()} disabled={accountBusy}>
            {accountBusy ? 'Saqlanmoqda…' : 'Saqlash'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
