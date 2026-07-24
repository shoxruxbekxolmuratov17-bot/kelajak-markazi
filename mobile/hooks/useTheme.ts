import { useStore } from '@/src/store/useStore';
import { colors, darkColors, type ThemeColors } from '@/constants/theme';

export function useTheme() {
  const darkMode = useStore((s) => s.darkMode);
  const c: ThemeColors = darkMode ? darkColors : colors;
  return { colors: c, darkMode };
}
