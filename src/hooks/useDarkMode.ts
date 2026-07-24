import { useLayoutEffect } from 'react';
import { useStore } from '../store/useStore';

function readDarkModeFromStorage(): boolean {
  try {
    const raw = localStorage.getItem('kelajak-markazi-store');
    if (!raw) return false;
    return JSON.parse(raw)?.state?.darkMode === true;
  } catch {
    return false;
  }
}

export function useDarkMode() {
  const darkMode = useStore((s) => s.darkMode);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', readDarkModeFromStorage());
  }, []);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);
}
