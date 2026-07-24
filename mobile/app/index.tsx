import { Redirect } from 'expo-router';
import { useStore } from '@/src/store/useStore';

export default function Index() {
  const authUser = useStore((s) => s.authUser);
  const hasHydrated = useStore((s) => s._hasHydrated);

  if (!hasHydrated) return null;

  if (!authUser?.id || !authUser.fullName) return <Redirect href="/login" />;
  if (authUser.role === 'parent') return <Redirect href="/(parent)" />;
  return <Redirect href="/(tabs)" />;
}
