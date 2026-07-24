import { useEffect, useState } from 'react';

/** Brauzer oynasi tor (planshet/telefon) */
export function useIsMobile(breakpoint = 1024) {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);

  return mobile;
}
