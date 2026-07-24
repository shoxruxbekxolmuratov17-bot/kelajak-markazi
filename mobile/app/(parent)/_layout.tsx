import { Tabs, Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';

export default function ParentLayout() {
  const authUser = useStore((s) => s.authUser);
  const unread = useStore((s) => {
    const phone = s.parentPhone || s.authUser?.phone || '';
    return s.messages.filter((m) => {
      if (m.read) return false;
      if (!m.toAudience || m.toAudience === 'all' || m.toAudience === 'parents') return true;
      if (m.toAudience === 'user' && phone && m.toUserId === phone.replace(/\s/g, '')) return true;
      return false;
    }).length;
  });
  const { colors } = useTheme();

  if (!authUser || authUser.role !== 'parent') return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.dark,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "O'yinlar",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'game-controller' : 'game-controller-outline'} size={24} color={color} />
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
    </Tabs>
  );
}
