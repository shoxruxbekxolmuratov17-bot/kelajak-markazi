import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getCircleImage } from '../data/circleImages';

/**
 * Boshqaruv paneli salomlashuvi ostidagi reklama lentasi:
 * eng faol 4 ta to'garak — har birining o'z fon rasmi bilan aylanadi.
 */
export function ActiveCirclesCarousel({ href }: { href?: string }) {
  const navigate = useNavigate();
  const circles = useStore((s) => s.circles);
  const role = useStore((s) => s.authUser?.role);
  const target = href || (role === 'parent' ? '/ota-ona#togaraklar' : '/togaraklar');

  const top = useMemo(
    () =>
      [...circles]
        .filter((c) => c.enrolled > 0)
        .sort((a, b) => b.enrolled - a.enrolled)
        .slice(0, 4),
    [circles]
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (top.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % top.length);
    }, 4000);
    return () => window.clearInterval(id);
  }, [top.length]);

  if (top.length === 0) return null;

  const current = top[index];

  return (
    <section
      className="relative w-full overflow-hidden rounded-2xl h-[120px] md:h-[132px] shadow-md ring-1 ring-black/5"
      aria-label="Eng faol to'garaklar reklama lentasi"
    >
      {/* Fon rasmlari — har bir to'garak uchun alohida */}
      {top.map((circle, i) => (
        <div
          key={circle.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
          }`}
          aria-hidden={i !== index}
        >
          <img
            src={getCircleImage(circle)}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[4000ms] ease-out ${
              i === index ? 'scale-105' : 'scale-100'
            }`}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
        </div>
      ))}

      {/* Matn qatlami */}
      <button
        type="button"
        onClick={() => navigate(target)}
        className="absolute inset-0 z-[2] flex items-center text-left px-5 md:px-6 group"
      >
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80 mb-1">
            Eng faol to'garaklar · {index + 1}/{top.length}
          </p>
          <h3
            key={current.id}
            className="text-lg md:text-xl font-bold text-white drop-shadow-sm truncate animate-[fadeSlide_0.5s_ease-out]"
          >
            {current.name}
          </h3>
          <p className="mt-1.5 text-sm text-white/90 flex items-center gap-2">
            <Users className="w-4 h-4 flex-shrink-0 opacity-90" />
            <span>
              {current.enrolled} o'quvchi
              {current.teacher && current.teacher !== 'Tayinlanmagan'
                ? ` · ${current.teacher.split(' ').slice(0, 2).join(' ')}`
                : ''}
            </span>
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-white/90 bg-white/15 backdrop-blur-sm px-3 py-2 rounded-xl group-hover:bg-white/25 transition-colors flex-shrink-0">
          Batafsil
          <ChevronRight className="w-4 h-4" />
        </span>
      </button>

      {/* Indikator nuqtalar */}
      <div className="absolute bottom-3 left-5 md:left-6 z-[3] flex gap-1.5">
        {top.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-label={c.name}
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
