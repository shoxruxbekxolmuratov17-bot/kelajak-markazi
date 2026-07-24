import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Button, Input, Card } from '@/components/ui';
import { Logo } from '@/components/Logo';

const STATS = [
  { val: '79', label: "To'garaklar" },
  { val: '1410', label: "O'quvchilar" },
  { val: '6-18', label: 'Yosh' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithCredentials, loginParentWithPhone } = useStore();
  const { colors } = useTheme();

  const [mode, setMode] = useState<'staff' | 'parent'>('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStaffLogin = async () => {
    setError('');
    setLoading(true);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    const apiError = await loginWithCredentials(trimmedUser, trimmedPass);
    setLoading(false);
    if (!apiError) {
      router.replace('/(tabs)');
      return;
    }
    setError(apiError || "Login yoki parol noto'g'ri");
  };

  const handleParentLogin = async () => {
    setError('');
    setLoading(true);

    const apiError = await loginParentWithPhone(phone, pin);
    setLoading(false);
    if (!apiError) {
      router.replace('/(parent)');
      return;
    }
    setError(apiError || "Telefon yoki PIN noto'g'ri");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={['#9588E8', '#7B6FD4', '#6B5FCF']} style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />
          <Logo size="lg" variant="white" centered />
          <Text style={styles.heroDesc}>
            Qamashi tumani bolalar va yoshlar uchun zamonaviy qo'shimcha ta'lim markazi
          </Text>
          <View style={styles.statsRow}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.formWrap}>
          <Card colors={colors} style={styles.formCard}>
            <Text style={[styles.formTitle, { color: colors.dark }]}>Tizimga kirish</Text>
            <Text style={[styles.formSub, { color: colors.muted }]}>Xodimlar va ota-onalar uchun</Text>

            <View style={[styles.modeRow, { backgroundColor: colors.surface }]}>
              {(['staff', 'parent'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => { setMode(m); setError(''); }}
                  style={[styles.modeBtn, mode === m && { backgroundColor: colors.card }]}
                >
                  <Text style={{ color: mode === m ? colors.dark : colors.muted, fontWeight: '600', fontSize: 13 }}>
                    {m === 'staff' ? 'Xodimlar' : 'Ota-ona'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === 'staff' ? (
              <>
                <Input
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Login"
                  colors={colors}
                  icon="person-outline"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View>
                  <Input
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Parol"
                    colors={colors}
                    icon="lock-closed-outline"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
                  </Pressable>
                </View>
                <Button
                  label={loading ? "Server javobini kutmoqda..." : 'Kirish'}
                  onPress={handleStaffLogin}
                  colors={colors}
                  disabled={loading}
                />
              </>
            ) : (
              <>
                <Input
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+998 90 123 45 67"
                  colors={colors}
                  icon="call-outline"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
                <Input
                  value={pin}
                  onChangeText={setPin}
                  placeholder="4 raqamli PIN"
                  colors={colors}
                  icon="key-outline"
                  secureTextEntry
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
                <Button
                  label={loading ? "Server javobini kutmoqda..." : 'Kirish'}
                  onPress={handleParentLogin}
                  colors={colors}
                  disabled={loading}
                />
              </>
            )}

            {error ? (
              <Text style={{ color: colors.danger, textAlign: 'center', marginTop: 8, fontSize: 12, lineHeight: 18 }}>
                {error}
              </Text>
            ) : null}

            <Pressable onPress={() => router.push('/royxat')} style={[styles.enrollLink, { borderTopColor: colors.border }]}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                Ro'yxatdan o'tish uchun bosing →
              </Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 28, paddingTop: 64, alignItems: 'center', overflow: 'hidden' },
  heroDecor1: { position: 'absolute', top: 40, left: 20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  heroDecor2: { position: 'absolute', bottom: 20, right: 10, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 16, lineHeight: 20, paddingHorizontal: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 12, alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '700' },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 2 },
  formWrap: { padding: 20, marginTop: -28 },
  formCard: { padding: 24 },
  formTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  formSub: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  modeRow: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 18 },
  modeBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 11 },
  enrollLink: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, alignItems: 'center' },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
});
