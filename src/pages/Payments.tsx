import { useMemo, useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, DollarSign, MapPin } from 'lucide-react';
import { Card, Badge, Button, SearchInput } from '../components/ui';
import { useStore } from '../store/useStore';
import { PAYMENT_STATUS_LABELS, MONTHLY_FEE } from '../types';
import { RegionFilters, matchDistrict, useDistrictLabel, useIsViloyatAdmin } from '../components/RegionFilters';
import type { PaymentStatus } from '../types';

const STATUS_ICONS: Record<PaymentStatus, typeof CheckCircle> = {
  paid: CheckCircle,
  pending: Clock,
  overdue: AlertTriangle,
  partial: DollarSign,
};

const STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: '#34C759',
  pending: '#FF9500',
  overdue: '#FF3B30',
  partial: '#5AC8FA',
};

export function PaymentsPage() {
  const { payments, students, updatePayment } = useStore();
  const districtLabel = useDistrictLabel();
  const isViloyat = useIsViloyatAdmin();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  const studentLabel = (p: { studentId: string; studentName: string }) => {
    const s = students.find((x) => x.id === p.studentId);
    return s ? `${s.lastName} ${s.firstName}` : p.studentName;
  };

  const scoped = useMemo(
    () => payments.filter((p) => matchDistrict(p.districtId, districtFilter)),
    [payments, districtFilter]
  );

  const filtered = scoped
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => studentLabel(p).toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: scoped.reduce((s, p) => s + p.amount, 0),
    paid: scoped.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    pending: scoped.filter((p) => p.status === 'pending').length,
    overdue: scoped.filter((p) => p.status === 'overdue').length,
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

  const markPaid = (id: string) => {
    updatePayment(id, { status: 'paid', paidAt: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-lg font-bold text-dark">{formatMoney(stats.total)}</p>
          <p className="text-xs text-muted mt-1">Jami summa</p>
        </Card>
        <Card className="text-center">
          <p className="text-lg font-bold text-success">{formatMoney(stats.paid)}</p>
          <p className="text-xs text-muted mt-1">To'langan</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-warning">{stats.pending}</p>
          <p className="text-xs text-muted mt-1">Kutilmoqda</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-danger">{stats.overdue}</p>
          <p className="text-xs text-muted mt-1">Muddati o'tgan</p>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <p className="text-sm text-dark">
          <strong>Badal to'lovi:</strong> Oyiga {formatMoney(MONTHLY_FEE)} (BHMning 15%).
          To'lov har oyning 10-sanasigacha amalga oshirilishi kerak. Sentabr oyi uchun — 30-sentyabrgacha.
        </p>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="O'quvchi qidirish..." />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border bg-card text-dark text-sm"
          >
            <option value="all">Barcha holatlar</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">O'quvchi</th>
                {isViloyat && (
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Tuman</th>
                )}
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">To'garak</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Oy</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Summa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Holat</th>
                {!isViloyat && (
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted uppercase">Amal</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => {
                const Icon = STATUS_ICONS[payment.status];
                return (
                  <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-surface/30">
                    <td className="px-5 py-4 font-medium text-dark">{studentLabel(payment)}</td>
                    {isViloyat && (
                      <td className="px-5 py-4 text-sm text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {districtLabel(payment.districtId)}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4 text-sm text-muted">{payment.circleName}</td>
                    <td className="px-5 py-4 text-sm">{payment.month}</td>
                    <td className="px-5 py-4 font-medium">{formatMoney(payment.amount)}</td>
                    <td className="px-5 py-4">
                      <Badge color={STATUS_COLORS[payment.status]}>
                        <Icon className="w-3 h-3 inline mr-1" />
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Badge>
                    </td>
                    {!isViloyat && (
                      <td className="px-5 py-4 text-right">
                        {payment.status !== 'paid' && (
                          <Button size="sm" onClick={() => markPaid(payment.id)}>
                            To'landi
                          </Button>
                        )}
                        {payment.paidAt && (
                          <span className="text-xs text-muted">{payment.paidAt}</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
