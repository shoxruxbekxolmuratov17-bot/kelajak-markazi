import { View, Text, StyleSheet, Pressable, TextInput, type ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type IconName } from '@/components/AppIcon';
import type { ThemeColors } from '@/constants/theme';

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: { elevation: 3 },
  default: {},
});

export function Card({
  children,
  colors,
  style,
  noPadding,
}: {
  children: React.ReactNode;
  colors: ThemeColors;
  style?: ViewStyle | ViewStyle[];
  noPadding?: boolean;
}) {
  return (
    <View
      style={[
        styles.card,
        cardShadow,
        { backgroundColor: colors.card, borderColor: colors.border },
        noPadding && { padding: 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ title, colors }: { title: string; colors: ThemeColors }) {
  return <Text style={[styles.sectionTitle, { color: colors.dark }]}>{title}</Text>;
}

function StatCardContent({
  title,
  value,
  subtitle,
  colors,
  icon,
  trend,
  chart,
  highlight,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  colors: ThemeColors;
  icon?: IconName;
  trend?: { value: number; label: string };
  chart?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <>
      <View style={styles.statTop}>
        <Text style={[styles.statTitle, { color: highlight ? 'rgba(255,255,255,0.8)' : colors.muted }]}>{title}</Text>
        {icon && (
          <View style={[styles.statIcon, { backgroundColor: highlight ? 'rgba(255,255,255,0.2)' : colors.primary + '18' }]}>
            <AppIcon name={icon} size={18} color={highlight ? '#fff' : colors.primary} />
          </View>
        )}
      </View>
      <Text style={[styles.statValue, { color: highlight ? '#fff' : colors.dark }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSub, { color: highlight ? 'rgba(255,255,255,0.75)' : colors.muted }]}>{subtitle}</Text>
      )}
      {trend && (
        <View style={styles.trendRow}>
          <Text style={{ color: trend.value >= 0 ? '#34C759' : colors.danger, fontSize: 11, fontWeight: '700' }}>
            {trend.value >= 0 ? '+' : ''}{trend.value}%
          </Text>
          <Text style={{ color: highlight ? 'rgba(255,255,255,0.7)' : colors.muted, fontSize: 11, marginLeft: 4 }}>
            {trend.label}
          </Text>
        </View>
      )}
      {chart && <View style={{ marginTop: 10 }}>{chart}</View>}
    </>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  colors,
  icon,
  trend,
  chart,
  highlight,
  style,
  onPress,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  colors: ThemeColors;
  icon?: IconName;
  trend?: { value: number; label: string };
  chart?: React.ReactNode;
  highlight?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const content = (
    <StatCardContent
      title={title}
      value={value}
      subtitle={subtitle}
      colors={colors}
      icon={icon}
      trend={trend}
      chart={chart}
      highlight={highlight}
    />
  );

  if (highlight) {
    const gradient = (
      <LinearGradient
        colors={['#9588E8', '#7B6FD4']}
        style={[styles.card, cardShadow, { flex: 1, minWidth: '45%' }, style]}
      >
        {content}
      </LinearGradient>
    );
    if (!onPress) return gradient;
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, minWidth: '45%', opacity: pressed ? 0.85 : 1 }]}>
        {gradient}
      </Pressable>
    );
  }

  const card = (
    <Card colors={colors} style={[{ flex: 1, minWidth: '45%' }, ...(style ? [style] : [])]}>
      {content}
    </Card>
  );
  if (!onPress) return card;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, minWidth: '45%', opacity: pressed ? 0.85 : 1 }]}>
      {card}
    </Pressable>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({
  value,
  colors,
  showLabel,
}: {
  value: number;
  colors: ThemeColors;
  showLabel?: boolean;
}) {
  return (
    <View>
      {showLabel && (
        <View style={styles.progressLabelRow}>
          <Text style={{ color: colors.muted, fontSize: 11 }}>Progress</Text>
          <Text style={{ color: colors.muted, fontSize: 11 }}>{value}%</Text>
        </View>
      )}
      <View style={[styles.progressBg, { backgroundColor: colors.surface }]}>
        <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%`, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

export function Button({
  label,
  onPress,
  colors,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  colors: ThemeColors;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent';
  const textColor = variant === 'ghost' ? colors.primary : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        cardShadow,
        { backgroundColor: bg, opacity: pressed || disabled ? 0.7 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function Input({
  value,
  onChangeText,
  placeholder,
  colors,
  secureTextEntry,
  icon,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  keyboardType = 'default',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  colors: ThemeColors;
  secureTextEntry?: boolean;
  icon?: IconName;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon && <AppIcon name={icon} size={18} color={colors.muted} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        style={[styles.input, { color: colors.dark }]}
      />
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  colors,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.searchBar, cardShadow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <AppIcon name="search" size={18} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={[styles.searchInput, { color: colors.dark }]}
      />
    </View>
  );
}

export function InfoRow({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={styles.infoRow}>
      <Text style={{ color: colors.muted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: colors.dark, fontSize: 13, fontWeight: '600', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statTitle: { fontSize: 12, fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  statSub: { fontSize: 11, marginTop: 3 },
  trendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  button: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 10,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  infoRow: { flex: 1, minWidth: '45%' },
});
