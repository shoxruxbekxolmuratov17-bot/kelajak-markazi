import { View, Text, Image, StyleSheet } from 'react-native';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showDistrict?: boolean;
  variant?: 'default' | 'white';
  centered?: boolean;
};

const boxSizes = { sm: 40, md: 48, lg: 56 };
const titleSizes = { sm: 15, md: 17, lg: 22 };
const subSizes = { sm: 11, md: 12, lg: 14 };
const radiusRatio = 0.22;

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={require('../assets/images/brand-logo.png')}
      style={{ width: size, height: size, borderRadius: size * radiusRatio }}
      resizeMode="cover"
    />
  );
}

export function Logo({
  size = 'md',
  showText = true,
  showDistrict = false,
  variant = 'default',
  centered = false,
}: LogoProps) {
  const box = boxSizes[size];
  const isWhite = variant === 'white';

  return (
    <View style={[styles.row, centered && styles.centered]}>
      <LogoMark size={box} />
      {showText && (
        <View>
          <Text
            style={[
              styles.title,
              {
                fontSize: titleSizes[size],
                color: isWhite ? '#F2F2F7' : '#373737',
              },
            ]}
          >
            Kelajak Markazi
          </Text>
          {showDistrict && (
            <Text
              style={[
                styles.sub,
                { fontSize: subSizes[size], color: isWhite ? 'rgba(255,255,255,0.85)' : '#8E8E93' },
              ]}
            >
              Qamashi tumani
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  centered: { justifyContent: 'center' },
  title: { fontWeight: '600', letterSpacing: -0.2 },
  sub: { marginTop: 2 },
});
