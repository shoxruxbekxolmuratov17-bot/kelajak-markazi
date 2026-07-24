import { useMemo, useState } from 'react';
import { Cpu, Printer, CircuitBoard, Wrench, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { Card, Badge, Button, ProgressBar } from '../components/ui';
import { useStore } from '../store/useStore';
import { RegionFilters, matchDistrict, useDistrictLabel, useIsViloyatAdmin } from '../components/RegionFilters';
import type { LabEquipment, LabEquipmentStatus } from '../types';

const TYPE_LABELS = {
  arduino: 'Arduino',
  raspberry: 'Raspberry Pi',
  '3d_printer': '3D Printer',
  sensor: 'Sensorlar',
  other: 'Boshqa',
};

const TYPE_ICONS = {
  arduino: CircuitBoard,
  raspberry: Cpu,
  '3d_printer': Printer,
  sensor: CircuitBoard,
  other: Wrench,
};

const STATUS_CONFIG: Record<LabEquipmentStatus, { label: string; color: string }> = {
  available: { label: 'Mavjud', color: '#34C759' },
  in_use: { label: 'Ishlatilmoqda', color: '#5AC8FA' },
  maintenance: { label: 'Ta\'mirda', color: '#FF9500' },
  broken: { label: 'Nosoz', color: '#FF3B30' },
};

export function LaboratoryPage() {
  const { labEquipment, updateLabEquipment } = useStore();
  const isViloyat = useIsViloyatAdmin();
  const districtLabel = useDistrictLabel();
  const [districtFilter, setDistrictFilter] = useState('all');

  const scoped = useMemo(
    () => labEquipment.filter((e) => matchDistrict(e.districtId, districtFilter)),
    [labEquipment, districtFilter]
  );

  const stats = {
    total: scoped.reduce((s, e) => s + e.quantity, 0),
    available: scoped.reduce((s, e) => s + e.available, 0),
    inUse: scoped.filter((e) => e.status === 'in_use').length,
    maintenance: scoped.filter((e) => e.status === 'maintenance').length,
  };

  const grouped = {
    arduino: scoped.filter((e) => e.type === 'arduino'),
    raspberry: scoped.filter((e) => e.type === 'raspberry'),
    '3d_printer': scoped.filter((e) => e.type === '3d_printer'),
    sensor: scoped.filter((e) => e.type === 'sensor'),
    other: scoped.filter((e) => e.type === 'other'),
  };

  const toggleMaintenance = (eq: LabEquipment) => {
    if (eq.status === 'maintenance') {
      updateLabEquipment(eq.id, { status: 'available' });
    } else {
      updateLabEquipment(eq.id, { status: 'maintenance', available: 0 });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <RegionFilters districtFilter={districtFilter} onDistrictChange={setDistrictFilter} />
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-dark text-lg">Robototexnika laboratoriyasi</h3>
            <p className="text-sm text-muted">
              Arduino, Raspberry Pi, 3D printerlar va sensorlar bilan jihozlangan zamonaviy laboratoriya
              {isViloyat ? ` · ${districtFilter === 'all' ? 'barcha tumanlar' : districtLabel(districtFilter)}` : ''}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-muted">Jami jihozlar</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-success">{stats.available}</p>
          <p className="text-xs text-muted">Bo'sh</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-teal">{stats.inUse}</p>
          <p className="text-xs text-muted">Ishlatilmoqda</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-warning">{stats.maintenance}</p>
          <p className="text-xs text-muted">Ta'mirda</p>
        </Card>
      </div>

      {Object.entries(grouped).map(([type, items]) => {
        if (items.length === 0) return null;
        const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS];
        return (
          <div key={type}>
            <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              {TYPE_LABELS[type as keyof typeof TYPE_LABELS]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((eq) => {
                const statusCfg = STATUS_CONFIG[eq.status];
                return (
                  <Card key={eq.id}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-dark">{eq.name}</h4>
                        <p className="text-sm text-muted">{eq.model}</p>
                      </div>
                      <Badge color={statusCfg.color}>{statusCfg.label}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <p className="text-xs text-muted">Jami</p>
                        <p className="font-semibold">{eq.quantity} dona</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Bo'sh</p>
                        <p className="font-semibold text-success">{eq.available} dona</p>
                      </div>
                    </div>
                    <ProgressBar value={eq.available} max={eq.quantity} color="#9588E8" showLabel />
                    <div className="flex items-center justify-between mt-3 text-xs text-muted">
                      <span>{eq.location}</span>
                      {eq.lastMaintenance && <span>Ta'mir: {eq.lastMaintenance}</span>}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => toggleMaintenance(eq)}
                    >
                      {eq.status === 'maintenance'
                        ? <><CheckCircle className="w-3.5 h-3.5" /> Tayyor deb belgilash</>
                        : <><AlertTriangle className="w-3.5 h-3.5" /> Ta'mirga yuborish</>}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
