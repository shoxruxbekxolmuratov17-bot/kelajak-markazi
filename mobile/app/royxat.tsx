import { ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { EnrollmentForm } from '@/components/EnrollmentForm';

export default function PublicEnrollmentScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      <EnrollmentForm colors={colors} />
      <Pressable onPress={() => router.replace('/login')} style={styles.backLink}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
          Tizimga kirish →
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  backLink: { alignItems: 'center', marginTop: 8, paddingVertical: 12 },
});
