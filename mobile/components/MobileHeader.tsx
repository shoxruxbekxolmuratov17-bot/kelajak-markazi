import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/Logo';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showActions?: boolean;
}

export function MobileHeader({ title, subtitle, showActions = true }: MobileHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { authUser, messages } = useStore();
  const unread = messages.filter((m) => !m.read).length;
  const initials =
    (authUser?.fullName ?? '')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('') || 'KM';

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
        Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8 },
          android: { elevation: 2 },
        }),
      ]}
    >
      <View style={styles.row}>
        <View style={styles.brandCol}>
          <Logo size="sm" />
          <Text style={[styles.pageTitle, { color: colors.dark }]}>{title}</Text>
          {subtitle ? <Text style={[styles.pageSub, { color: colors.muted }]}>{subtitle}</Text> : null}
        </View>
        {showActions && (
          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push('/(tabs)/students')}
              style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="search" size={20} color={colors.muted} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/messages')}
              style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.muted} />
              {unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/more')}
              style={[styles.avatar, { backgroundColor: colors.primary + '25' }]}
            >
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 11 }}>{initials}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  brandCol: { flex: 1, gap: 6 },
  pageTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  pageSub: { fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
