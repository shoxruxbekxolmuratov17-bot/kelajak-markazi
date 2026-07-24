import { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, Pressable } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Badge, Button } from '@/components/ui';
import { isCenterAdmin, isViloyat } from '@/src/roles';
import { api } from '@/src/api/client';
import { MONTHLY_FEE } from '@shared/types';

function dash(v?: string | null) {
  if (!v) return '—';
  return v;
}

export default function SettingsScreen() {
  const {
    circles,
    authUser,
    centerInfo,
    apiOnline,
    districts,
    activeDistrictId,
    setActiveDistrict,
    runBackup,
  } = useStore();
  const { colors } = useTheme();
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [backupMsg, setBackupMsg] = useState('');

  const canBackup =
    !!authUser &&
    (isCenterAdmin(authUser.role) || isViloyat(authUser.role));
  const isSuperadmin = isViloyat(authUser?.role);

  useEffect(() => {
    if (!apiOnline) return;
    void api.health().then((h) => setHealth(h as Record<string, unknown>)).catch(() => setHealth(null));
  }, [apiOnline]);

  const handleBackup = async () => {
    try {
      const path = await runBackup();
      setBackupMsg(`Zaxira saqlandi: ${path}`);
    } catch (e) {
      setBackupMsg(e instanceof Error ? e.message : 'Zaxira xatosi');
    }
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      <Card colors={colors}>
        <Text style={[styles.title, { color: colors.dark }]}>Tizim holati</Text>
        <Badge
          label={apiOnline ? 'API online' : 'Offline demo'}
          color={apiOnline ? colors.success : colors.warning}
        />
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>
          DB: {String(health?.db || (apiOnline ? '…' : 'offline'))}
          {health?.cache != null ? ` · cache=${String(health.cache)}` : ''}
          {health?.demoMode != null ? ` · demo=${String(health.demoMode)}` : ''}
        </Text>
      </Card>

      {isSuperadmin && districts.length > 0 && (
        <Card colors={colors}>
          <Text style={[styles.title, { color: colors.dark }]}>Viloyat monitoringi — tuman tanlash</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>
            Qashqadaryo viloyati · {districts.length} tuman/shahar
          </Text>
          <Pressable
            onPress={() => void setActiveDistrict('all')}
            style={[
              styles.districtChip,
              {
                backgroundColor: !activeDistrictId ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: !activeDistrictId ? '#fff' : colors.dark, fontSize: 13 }}>
              Barcha tumanlar
            </Text>
          </Pressable>
          {districts.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => void setActiveDistrict(d.id)}
              style={[
                styles.districtChip,
                {
                  backgroundColor: activeDistrictId === d.id ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: activeDistrictId === d.id ? '#fff' : colors.dark, fontSize: 13 }}>
                {d.name}
              </Text>
            </Pressable>
          ))}
        </Card>
      )}

      {canBackup && apiOnline && (
        <Card colors={colors}>
          <Text style={[styles.title, { color: colors.dark }]}>Ma'lumotlar zaxirasi</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 10 }}>
            db.json nusxasini backups/ ga yozadi
          </Text>
          <Button label="Zaxira olish" onPress={() => void handleBackup()} colors={colors} />
          {!!backupMsg && (
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{backupMsg}</Text>
          )}
        </Card>
      )}

      <Card colors={colors}>
        <Text style={[styles.title, { color: colors.dark }]}>{dash(centerInfo.name)}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
          {dash(centerInfo.district)}{centerInfo.region ? `, ${centerInfo.region}` : ''}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{dash(centerInfo.address)}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{dash(centerInfo.phone)}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{dash(centerInfo.email)}</Text>
        {centerInfo.ageRange && (
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
            Yosh: {centerInfo.ageRange}
          </Text>
        )}
      </Card>

      <Card colors={colors}>
        <Text style={[styles.title, { color: colors.dark }]}>To'lov</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>Oylik badal: {formatMoney(MONTHLY_FEE)}</Text>
        {(centerInfo.seasonStart || centerInfo.seasonEnd) && (
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
            Mavsum: {dash(centerInfo.seasonStart)} — {dash(centerInfo.seasonEnd)}
          </Text>
        )}
      </Card>

      <Card colors={colors}>
        <Text style={[styles.title, { color: colors.dark }]}>Statistika</Text>
        <Text style={{ color: colors.muted, fontSize: 13 }}>{circles.length} ta to'garak</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 16, fontWeight: '700' },
  districtChip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
});
