import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';
import { useTheme } from '@/hooks/useTheme';

export default function TabLayout() {
  const authUser = useStore((s) => s.authUser);
  const messages = useStore((s) => s.messages);
  const parentPhone = useStore((s) => s.parentPhone);
  const phone = parentPhone || authUser?.phone || '';
  const unread = messages.filter((m) => {
    if (m.read) return false;
    if (!m.toAudience || m.toAudience === 'all') return true;
    if (m.fromUserId && authUser?.id && m.fromUserId === authUser.id) return true;
    if (m.toAudience === 'staff' && (authUser?.role === 'admin' || authUser?.role === 'teacher')) return true;
    if (m.toAudience === 'user') {
      if (authUser?.id && m.toUserId === authUser.id) return true;
      if (authUser?.teacherId && m.toUserId === authUser.teacherId) return true;
      if (phone && m.toUserId === phone.replace(/\s/g, '')) return true;
      if (authUser?.role === 'admin') return true;
    }
    return false;
  }).length;
  const { colors } = useTheme();

  if (!authUser?.id || !authUser.fullName) return <Redirect href="/login" />;
  if (authUser.role === 'parent') return <Redirect href="/(parent)" />;

  return (
    <>
      <ApiStatusBanner />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
            android: { elevation: 8 },
          }),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: "To'garaklar",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "O'quvchilar",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Xabarlar',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 10 },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
    </>
  );
}
