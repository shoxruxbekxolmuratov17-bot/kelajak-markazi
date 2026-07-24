import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/src/store/useStore';
import { MONTHLY_FEE } from '@shared/types';
import type { ThemeColors } from '@/constants/theme';
import { Button, Input, Card } from '@/components/ui';

const formatMoney = (n: number) => new Intl.NumberFormat('uz-UZ').format(n) + " so'm";

type FormState = {
  firstName: string;
  lastName: string;
  age: string;
  school: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  circleId: string;
  pin: string;
  pinConfirm: string;
  socialRegistry: boolean;
};

const emptyForm: FormState = {
  firstName: '',
  lastName: '',
  age: '12',
  school: '',
  grade: '6',
  parentName: '',
  parentPhone: '',
  circleId: '',
  pin: '',
  pinConfirm: '',
  socialRegistry: false,
};

export function EnrollmentForm({ colors }: { colors: ThemeColors }) {
  const router = useRouter();
  const { circles, submitEnrollment, hydrateFromApi } = useStore();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void hydrateFromApi();
  }, [hydrateFromApi]);

  const availableCircles = [...circles]
    .filter(
      (c) =>
        (c.status === 'active' || c.status === 'planned') &&
        c.enrolled < c.capacity &&
        !c.isNetwork &&
        (!c.isInclusive || form.socialRegistry)
    )
    .sort((a, b) => {
      const aActive = a.enrolled > 0 ? 1 : 0;
      const bActive = b.enrolled > 0 ? 1 : 0;
      if (bActive !== aActive) return bActive - aActive;
      return b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'uz');
    });

  const handleSubmit = async () => {
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim() || !form.parentName.trim() || !form.parentPhone.trim() || !form.circleId) {
      setError("Majburiy maydonlarni to'ldiring");
      return;
    }
    const digits = form.parentPhone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError("Telefon raqam noto'g'ri. Masalan: +998 90 123 45 67");
      return;
    }
    if (form.pin.length < 4) {
      setError('PIN kod kamida 4 raqam bo‘lishi kerak');
      return;
    }
    if (form.pin !== form.pinConfirm) {
      setError('PIN kodlar mos kelmadi');
      return;
    }
    const circle = circles.find((c) => c.id === form.circleId);
    if (!circle) {
      setError("To'garak topilmadi");
      return;
    }

    setLoading(true);
    const err = await submitEnrollment({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      age: Number(form.age) || 12,
      school: form.school.trim() || "Ko'rsatilmagan",
      grade: Number(form.grade) || 1,
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      circleId: form.circleId,
      circleName: circle.name,
      pin: form.pin,
      socialRegistry: form.socialRegistry,
      subsidy: form.socialRegistry,
      note: form.socialRegistry ? 'Ijtimoiy reestr' : undefined,
    } as Parameters<typeof submitEnrollment>[0] & { socialRegistry?: boolean; subsidy?: boolean });
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setSubmitted(true);
    setForm(emptyForm);
  };

  return (
    <View>
      <Card colors={colors} style={{ backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }}>
        <View style={styles.heroRow}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="person-add" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.dark }]}>Onlayn ro'yxatdan o'tish</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 }}>
              Har qanday ota-ona farzandini yozdirishi mumkin. Keyin telefon + PIN bilan kiring. Oylik: {formatMoney(MONTHLY_FEE)}
            </Text>
          </View>
        </View>
      </Card>

      {submitted && (
        <Card colors={colors} style={{ backgroundColor: colors.success + '15', borderColor: colors.success + '40' }}>
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.dark, fontWeight: '600' }}>Ro'yxatdan o'tdingiz!</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                Telefon va PIN bilan ota-ona kabinetiga kiring.
              </Text>
              <Pressable onPress={() => router.replace('/login')} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Kirish →</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      )}

      <Card colors={colors}>
        <Text style={[styles.sectionTitle, { color: colors.dark }]}>Ro'yxatdan o'tish formasi</Text>

        {availableCircles.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
            Hozircha bo'sh o'rinli to'garak yo'q yoki ma'lumot yuklanmoqda...
          </Text>
        ) : null}

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.muted }]}>Ism</Text>
            <Input value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} placeholder="Ism" colors={colors} />
          </View>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.muted }]}>Familiya</Text>
            <Input value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} placeholder="Familiya" colors={colors} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.muted }]}>Yosh</Text>
            <Input value={form.age} onChangeText={(v) => setForm({ ...form, age: v })} placeholder="12" colors={colors} keyboardType="phone-pad" />
          </View>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.muted }]}>Sinf</Text>
            <Input value={form.grade} onChangeText={(v) => setForm({ ...form, grade: v })} placeholder="6" colors={colors} keyboardType="phone-pad" />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.muted }]}>Maktab</Text>
        <Input value={form.school} onChangeText={(v) => setForm({ ...form, school: v })} placeholder="Masalan: 3-son UM" colors={colors} />

        <Text style={[styles.label, { color: colors.muted, marginTop: 4 }]}>To'garak</Text>
        <View style={styles.circleList}>
          {availableCircles.map((c) => {
            const selected = form.circleId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setForm({ ...form, circleId: c.id })}
                style={[
                  styles.circleItem,
                  { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '12' : colors.surface },
                ]}
              >
                <Text style={{ color: colors.dark, fontWeight: selected ? '600' : '500', fontSize: 13 }}>{c.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                  {c.enrolled}/{c.capacity} o'rin · {c.ageRange}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.subsection, { color: colors.dark }]}>Ota-ona ma'lumotlari</Text>
        <Text style={[styles.label, { color: colors.muted }]}>Ota-ona ismi</Text>
        <Input value={form.parentName} onChangeText={(v) => setForm({ ...form, parentName: v })} placeholder="Ism familiya" colors={colors} />
        <Text style={[styles.label, { color: colors.muted }]}>Telefon raqam</Text>
        <Input
          value={form.parentPhone}
          onChangeText={(v) => setForm({ ...form, parentPhone: v })}
          placeholder="+998 90 123 45 67"
          colors={colors}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        <Pressable
          onPress={() => setForm({ ...form, socialRegistry: !form.socialRegistry })}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.socialRegistry }}
          accessibilityLabel="Ijtimoiy reestr farzandi"
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: colors.primary,
              backgroundColor: form.socialRegistry ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {form.socialRegistry ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <Text style={{ color: colors.dark, fontSize: 13, flex: 1 }}>
            Ijtimoiy reestr / inklyuziv (preferensial yozilish)
          </Text>
        </Pressable>
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.muted }]}>PIN kod</Text>
            <Input
              value={form.pin}
              onChangeText={(v) => setForm({ ...form, pin: v.replace(/\D/g, '').slice(0, 8) })}
              placeholder="Kamida 4"
              colors={colors}
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.muted }]}>PIN tasdiq</Text>
            <Input
              value={form.pinConfirm}
              onChangeText={(v) => setForm({ ...form, pinConfirm: v.replace(/\D/g, '').slice(0, 8) })}
              placeholder="Qayta"
              colors={colors}
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>
        </View>
        <Text style={{ color: colors.muted, fontSize: 11, marginBottom: 10 }}>
          Shu PIN bilan keyin kabinetga kirasiz. Uni eslab qoling.
        </Text>

        {error ? <Text style={{ color: colors.danger, fontSize: 13, marginBottom: 8 }}>{error}</Text> : null}
        <Button
          label={loading ? 'Yuborilmoqda...' : "Ro'yxatdan o'tish"}
          onPress={handleSubmit}
          colors={colors}
          disabled={loading}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 16, fontWeight: '700' },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  circleList: { gap: 8, marginBottom: 12 },
  circleItem: { borderWidth: 1, borderRadius: 12, padding: 12 },
  subsection: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 8 },
});
