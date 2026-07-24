import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';
import type { ThemeColors } from '@/constants/theme';

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlice(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  start: number,
  end: number
) {
  if (end - start >= 360) end = start + 359.99;
  const large = end - start > 180 ? 1 : 0;
  const oStart = polar(cx, cy, outerR, end);
  const oEnd = polar(cx, cy, outerR, start);
  const iStart = polar(cx, cy, innerR, start);
  const iEnd = polar(cx, cy, innerR, end);
  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${outerR} ${outerR} 0 ${large} 0 ${oEnd.x} ${oEnd.y}`,
    `L ${iStart.x} ${iStart.y}`,
    `A ${innerR} ${innerR} 0 ${large} 1 ${iEnd.x} ${iEnd.y}`,
    'Z',
  ].join(' ');
}

export function MiniBarChart({
  data,
  dataKey,
  color = '#9588E8',
  height = 48,
  showLabels = false,
  labelKey,
}: {
  data: Record<string, number | string>[];
  dataKey: string;
  color?: string;
  height?: number;
  showLabels?: boolean;
  labelKey?: string;
}) {
  const values = data.map((d) => Number(d[dataKey]));
  const max = Math.max(...values, 1);

  return (
    <View>
      <View style={[styles.barRow, { height }]}>
        {values.map((v, i) => {
          const h = Math.max((v / max) * (height - 8), 4);
          return (
            <View key={i} style={styles.barCol}>
              <View style={[styles.bar, { height: h, backgroundColor: color }]} />
            </View>
          );
        })}
      </View>
      {showLabels && labelKey && (
        <View style={styles.lineLabels}>
          {data.map((d, i) => (
            <Text key={i} style={styles.axisLabel}>
              {String(d[labelKey] ?? i)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export function GaugeChart({
  value,
  label,
  colors,
  size = 128,
}: {
  value: number;
  label: string;
  colors: ThemeColors;
  size?: number;
}) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.gaugeWrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation="-90" originX={center} originY={center}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.surface}
              strokeWidth={stroke}
              fill="none"
            />
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.primary}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
            />
          </G>
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, styles.gaugeCenter]}>
          <Text style={[styles.gaugeValue, { color: colors.dark }]}>{progress}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>%</Text>
        </View>
      </View>
      <Text style={[styles.gaugeLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

export function DonutChart({
  items,
  size = 180,
}: {
  items: { name: string; value: number; color: string }[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.39;
  const innerR = size * 0.25;
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  let angle = 0;
  const gap = 3;

  const slices = items.map((item) => {
    const sweep = (item.value / total) * (360 - gap * items.length);
    const start = angle;
    const end = angle + sweep;
    angle = end + gap;
    return { ...item, path: donutSlice(cx, cy, innerR, outerR, start, end) };
  });

  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size}>
        {slices.map((slice) => (
          <Path key={slice.name} d={slice.path} fill={slice.color} />
        ))}
      </Svg>
    </View>
  );
}

export function CategoryLegend({
  items,
  colors,
}: {
  items: { name: string; value: number; color: string }[];
  colors: ThemeColors;
}) {
  return (
    <View style={styles.legendGrid}>
      {items.map((item) => (
        <View key={item.name} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={{ color: colors.muted, fontSize: 11, flex: 1 }}>{item.name}</Text>
          <Text style={{ color: colors.dark, fontSize: 11, fontWeight: '700' }}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function MiniLineChart({
  data,
  dataKey,
  color = '#9588E8',
  height = 140,
  colors,
}: {
  data: Record<string, number | string>[];
  dataKey: string;
  color?: string;
  height?: number;
  colors: ThemeColors;
}) {
  const values = data.map((d) => Number(d[dataKey]));
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const width = 280;
  const padX = 16;
  const padY = 12;
  const chartH = height - padY * 2;
  const chartW = width - padX * 2;

  const points = values.map((v, i) => {
    const x = padX + (i / Math.max(values.length - 1, 1)) * chartW;
    const y = padY + chartH - ((v - min) / (max - min)) * chartH;
    return { x, y, v };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.5, 1].map((t) => {
          const y = padY + chartH * t;
          return (
            <Line
              key={t}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        })}
        <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
        ))}
      </Svg>
      <View style={styles.lineLabels}>
        {data.map((d, i) => (
          <Text key={i} style={[styles.axisLabel, { color: colors.muted }]}>
            {String((d as { week?: string; month?: string }).week ?? (d as { month?: string }).month ?? i)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', maxWidth: 18, borderRadius: 4, minHeight: 4 },
  gaugeWrap: { alignItems: 'center', paddingVertical: 4 },
  gaugeCenter: { alignItems: 'center', justifyContent: 'center' },
  gaugeValue: { fontSize: 30, fontWeight: '700' },
  gaugeLabel: { fontSize: 12, fontWeight: '500', marginTop: 10, textAlign: 'center' },
  donutWrap: { alignItems: 'center', marginVertical: 4 },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', width: '47%', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  lineLabels: { flexDirection: 'row', marginTop: 4 },
  axisLabel: { fontSize: 9, flex: 1, textAlign: 'center' },
});
