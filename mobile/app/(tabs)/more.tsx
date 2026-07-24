import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/Screen';
import { Card, Button } from '@/components/ui';
import { ROLE_LABELS, STAFF_MENU } from '@/src/roles';
import type { UserRole } from '@shared/types';

export default function MoreScreen() {
  const router = useRouter();
  const { authUser, logout, darkMode, toggleDarkMode } = useStore();
  const { colors } = useTheme();

  const initials =
    (authUser?.fullName ?? '')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('') || 'KM';
  const role = authUser?.role as UserRole | undefined;
  const items = STAFF_MENU.filter((item) => role && item.roles.includes(role as never));

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <Screen title="Profil" subtitle="Hisob va sozlamalar" showHeaderActions={false}>
      <LinearGradient colors={['#9588E8', '#7B6FD4']} style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{authUser?.fullName}</Text>
        <Text style={styles.profileRole}>{role ? ROLE_LABELS[role] : ''}</Text>
        <Text style={styles.profileUser}>@{authUser?.username}</Text>
      </LinearGradient>

      <Card colors={colors}>
        <View style={styles.darkRow}>
          <View style={[styles.menuIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name={darkMode ? 'moon' : 'sunny'} size={20} color={colors.primary} />
          </View>
          <Text style={{ color: colors.dark, flex: 1, fontWeight: '600' }}>
            {darkMode ? "Qorong'u rejim" : "Yorug' rejim"}
          </Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} trackColor={{ true: colors.primary }} />
        </View>
      </Card>

      {items.length === 0 ? (
        <Card colors={colors}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>Qo‘shimcha bo‘limlar yo‘q</Text>
        </Card>
      ) : (
        <Card colors={colors} noPadding>
          {items.map((item, i) => (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as never)}
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                i === items.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={{ color: colors.dark, flex: 1, fontSize: 15, fontWeight: '500' }}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </Card>
      )}

      <Button label="Chiqish" onPress={handleLogout} colors={colors} variant="danger" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 24 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileRole: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 },
  profileUser: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  darkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1 },
});
