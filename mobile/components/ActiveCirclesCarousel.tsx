import { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/src/store/useStore';
import { getCircleImage } from '@shared/data/circleImages';

/**
 * Boshqaruv paneli salomlashuvi ostidagi reklama lentasi:
 * eng faol 4 ta to'garak — har birining o'z fon rasmi bilan aylanadi.
 */
export function ActiveCirclesCarousel() {
  const router = useRouter();
  const circles = useStore((s) => s.circles);
  const role = useStore((s) => s.authUser?.role);

  const top = useMemo(
    () =>
      [...circles]
        .filter((c) => c.enrolled > 0)
        .sort((a, b) => b.enrolled - a.enrolled)
        .slice(0, 4),
    [circles]
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (top.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % top.length);
    }, 4000);
    return () => clearInterval(id);
  }, [top.length]);

  if (top.length === 0) return null;

  const current = top[index] ?? top[0];

  return (
    <View style={styles.wrap}>
      {top.map((circle, i) => (
        <View
          key={circle.id}
          style={[styles.slide, i === index ? styles.slideActive : styles.slideHidden]}
          pointerEvents="none"
        >
          <Image source={{ uri: getCircleImage(circle) }} style={styles.image} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.15)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ))}

      <Pressable
        onPress={() => {
          if (role === 'parent') return;
          router.push('/(tabs)/circles');
        }}
        style={({ pressed }) => [styles.content, { opacity: pressed ? 0.9 : 1 }]}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.eyebrow}>
            Eng faol to'garaklar · {index + 1}/{top.length}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {current.name}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="people" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.meta} numberOfLines={1}>
              {current.enrolled} o'quvchi
              {current.teacher && current.teacher !== 'Tayinlanmagan'
                ? ` · ${current.teacher.split(' ').slice(0, 2).join(' ')}`
                : ''}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
      </Pressable>

      <View style={styles.dots}>
        {top.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => setIndex(i)}
            hitSlop={8}
            style={[styles.dot, i === index ? styles.dotActive : styles.dotIdle]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#2a2a2a',
  },
  slide: {
    ...StyleSheet.absoluteFillObject,
  },
  slideActive: { opacity: 1, zIndex: 1 },
  slideHidden: { opacity: 0, zIndex: 0 },
  image: { width: '100%', height: '100%' },
  content: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  meta: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 18,
    zIndex: 3,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#fff',
  },
  dotIdle: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
