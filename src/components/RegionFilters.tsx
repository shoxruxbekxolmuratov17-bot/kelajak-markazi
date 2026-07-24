import { useMemo } from 'react';
import { useStore } from '../store/useStore';

/** Tuman nomi (id → name). */
export function useDistrictLabel() {
  const districts = useStore((s) => s.districts);
  return (districtId?: string | null) => {
    if (!districtId) return '—';
    return districts.find((d) => d.id === districtId)?.name || '—';
  };
}

export function useIsViloyatAdmin() {
  return useStore((s) => s.authUser?.role === 'superadmin');
}

type RegionFiltersProps = {
  districtFilter: string;
  onDistrictChange: (id: string) => void;
  /** Maktab filtri (ixtiyoriy) */
  schoolFilter?: string;
  onSchoolChange?: (school: string) => void;
  schoolOptions?: string[];
  className?: string;
};

/**
 * Viloyat admin uchun sahifa ichidagi tuman (+ ixtiyoriy maktab) filtri.
 * Headerdagi kontekstdan mustaqil — «barcha tumanlar» ichida ham ishlaydi.
 */
export function RegionFilters({
  districtFilter,
  onDistrictChange,
  schoolFilter,
  onSchoolChange,
  schoolOptions = [],
  className = '',
}: RegionFiltersProps) {
  const isViloyat = useIsViloyatAdmin();
  const districts = useStore((s) => s.districts);

  if (!isViloyat) return null;

  const sorted = useMemo(
    () => [...districts].sort((a, b) => a.name.localeCompare(b.name, 'uz')),
    [districts]
  );

  return (
    <div className={`flex flex-col sm:flex-row flex-wrap gap-2 ${className}`}>
      <select
        aria-label="Tuman filtri"
        value={districtFilter}
        onChange={(e) => {
          onDistrictChange(e.target.value);
          onSchoolChange?.('all');
        }}
        className="px-3 py-2.5 rounded-xl border border-border bg-card text-dark text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="all">Barcha tumanlar</option>
        {sorted.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      {onSchoolChange && (
        <select
          aria-label="Maktab filtri"
          value={schoolFilter || 'all'}
          onChange={(e) => onSchoolChange(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-card text-dark text-sm min-w-[180px] focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Barcha maktablar</option>
          {schoolOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

/** districtId bo‘yicha filter (all = hammasi). */
export function matchDistrict(
  rowDistrictId: string | undefined,
  filter: string
): boolean {
  if (filter === 'all') return true;
  return rowDistrictId === filter;
}
