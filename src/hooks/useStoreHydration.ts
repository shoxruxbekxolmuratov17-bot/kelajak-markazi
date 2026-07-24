import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { apiAvailable, getToken, initApiConfig } from '../api/client';

export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());
  const hydrateFromApi = useStore((s) => s.hydrateFromApi);
  const restoreSession = useStore((s) => s.restoreSession);
  const setApiOnline = useStore((s) => s.setApiOnline);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      await initApiConfig();
      if (getToken()) {
        await restoreSession();
      }
      if (!cancelled) setHydrated(true);

      const online = await apiAvailable();
      if (cancelled) return;
      setApiOnline(online);
      if (online) {
        void hydrateFromApi();
      }
    };

    if (useStore.persist.hasHydrated()) {
      void finish();
      return;
    }

    const unsub = useStore.persist.onFinishHydration(() => {
      void finish();
    });
    const timer = setTimeout(() => {
      void finish();
    }, 400);

    return () => {
      cancelled = true;
      unsub();
      clearTimeout(timer);
    };
  }, [hydrateFromApi, restoreSession, setApiOnline]);

  return hydrated;
}
