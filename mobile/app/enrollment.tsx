import { ScrollView, StyleSheet } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { EnrollmentForm } from '@/components/EnrollmentForm';
import { EnrollmentAdminPanel } from '@/components/EnrollmentAdminPanel';

export default function EnrollmentScreen() {
  const authUser = useStore((s) => s.authUser);
  const { colors } = useTheme();
  const canManage =
    authUser?.role === 'admin' || authUser?.role === 'district_admin';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      <EnrollmentForm colors={colors} />
      {canManage && <EnrollmentAdminPanel colors={colors} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
});
