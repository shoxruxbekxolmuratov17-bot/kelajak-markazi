import { ActivityIndicator, Text, View } from 'react-native';
import { useStore } from '@/src/store/useStore';

export function ApiStatusBanner() {
  const apiSyncing = useStore((s) => s.apiSyncing);
  const apiOnline = useStore((s) => s.apiOnline);

  if (!apiSyncing && apiOnline) return null;

  return (
    <View
      style={{
        backgroundColor: apiSyncing ? '#9588E8' : '#FF9500',
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {apiSyncing ? <ActivityIndicator color="#fff" size="small" /> : null}
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
        {apiSyncing
          ? "Ma'lumotlar yuklanmoqda (Render uyg'onishi 1 daqiqagacha davom etishi mumkin)..."
          : "Server bilan aloqa yo'q. Internet yoki API holatini tekshiring."}
      </Text>
    </View>
  );
}
