import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/src/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { Card, Badge, Button } from '@/components/ui';
import {
  learningGames,
  GAME_CATEGORY_LABELS,
  GAME_DIFFICULTY_LABELS,
  ageToBand,
  getQuizQuestions,
  getOddOneRound,
  getMemoryPairs,
  getMatchPairs,
  type GameCategory,
  type GameDifficulty,
  type LearningGame,
} from '@shared/data/parentContent';
import { ModernGamePlayer } from '@/components/ModernGames';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizPlay({ game, onDone, colors }: {
  game: LearningGame;
  onDone: (s: number, t: number) => void;
  colors: { dark: string; muted: string; primary: string; border: string; card: string };
}) {
  const questions = useMemo(() => getQuizQuestions(game.id), [game.id]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const q = questions[i];

  return (
    <View>
      <Text style={{ color: colors.muted, fontSize: 13 }}>Savol {i + 1}/{questions.length}</Text>
      <Text style={{ color: colors.dark, fontSize: 20, fontWeight: '700', marginVertical: 12 }}>{q.q}</Text>
      {q.options.map((opt, idx) => (
        <Pressable
          key={opt}
          onPress={() => {
            const next = score + (idx === q.answer ? 1 : 0);
            if (i + 1 >= questions.length) onDone(next, questions.length);
            else { setScore(next); setI(i + 1); }
          }}
          style={[styles.opt, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Text style={{ color: colors.dark, fontWeight: '600' }}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function OddPlay({ game, onDone, colors }: {
  game: LearningGame;
  onDone: (s: number, t: number) => void;
  colors: { dark: string; muted: string; border: string; card: string };
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(() => getOddOneRound(game.difficulty));
  const total = 5;

  return (
    <View>
      <Text style={{ color: colors.muted, marginBottom: 12 }}>Bosqich {round + 1}/{total}</Text>
      <View style={styles.grid4}>
        {current.items.map((item, idx) => (
          <Pressable
            key={`${round}-${idx}`}
            onPress={() => {
              const next = score + (idx === current.oddIndex ? 1 : 0);
              if (round + 1 >= total) onDone(next, total);
              else {
                setScore(next);
                setRound(round + 1);
                setCurrent(getOddOneRound(game.difficulty));
              }
            }}
            style={[styles.emojiBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Text style={{ fontSize: 32 }}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MemoryPlay({ game, onDone, colors }: {
  game: LearningGame;
  onDone: (s: number, t: number) => void;
  colors: { dark: string; muted: string; border: string; card: string; primary: string };
}) {
  const pairs = useMemo(() => shuffle(getMemoryPairs(game.difficulty)), [game.difficulty]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    if (matched.length === pairs.length && pairs.length > 0) {
      const perfect = pairs.length / 2;
      onDone(Math.max(1, perfect - Math.floor(Math.max(0, moves - perfect) / 2)), perfect);
    }
  }, [matched, pairs.length, moves, onDone]);

  const flip = (idx: number) => {
    if (lock || flipped.includes(idx) || matched.includes(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      setLock(true);
      const [a, b] = next;
      if (pairs[a] === pairs[b]) {
        setMatched((m) => [...m, a, b]);
        setFlipped([]);
        setLock(false);
      } else {
        setTimeout(() => { setFlipped([]); setLock(false); }, 700);
      }
    }
  };

  return (
    <View>
      <Text style={{ color: colors.muted, marginBottom: 8 }}>Harakatlar: {moves}</Text>
      <View style={styles.grid4}>
        {pairs.map((emoji, idx) => {
          const open = flipped.includes(idx) || matched.includes(idx);
          return (
            <Pressable
              key={idx}
              onPress={() => flip(idx)}
              style={[
                styles.emojiBtn,
                {
                  borderColor: open ? colors.primary : colors.border,
                  backgroundColor: open ? colors.primary + '18' : colors.card,
                },
              ]}
            >
              <Text style={{ fontSize: open ? 28 : 20 }}>{open ? emoji : '?'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MatchPlay({ game, onDone, colors }: {
  game: LearningGame;
  onDone: (s: number, t: number) => void;
  colors: { dark: string; muted: string; border: string; card: string; primary: string; surface: string };
}) {
  const pairs = useMemo(() => getMatchPairs(game.difficulty), [game.difficulty]);
  const rights = useMemo(() => shuffle(pairs.map((p) => p.right)), [pairs]);
  const [left, setLeft] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1, gap: 6 }}>
        {pairs.map((p) => (
          <Pressable
            key={p.left}
            disabled={done.includes(p.left)}
            onPress={() => setLeft(p.left)}
            style={[
              styles.matchBtn,
              {
                opacity: done.includes(p.left) ? 0.4 : 1,
                borderColor: left === p.left ? colors.primary : colors.border,
                backgroundColor: left === p.left ? colors.primary + '18' : colors.card,
              },
            ]}
          >
            <Text style={{ color: colors.dark, fontSize: 13, fontWeight: '600' }}>{p.left}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        {rights.map((r) => (
          <Pressable
            key={r}
            onPress={() => {
              if (!left || done.includes(left)) return;
              const ok = pairs.find((p) => p.left === left)?.right === r;
              const nextScore = score + (ok ? 1 : 0);
              const nextDone = ok ? [...done, left] : done;
              setScore(nextScore);
              setLeft(null);
              if (ok) setDone(nextDone);
              if (nextDone.length === pairs.length) onDone(nextScore, pairs.length);
            }}
            style={[styles.matchBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Text style={{ color: colors.dark, fontSize: 13 }}>{r}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ParentGamesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cat?: string }>();
  const { parentPhone, authUser, students } = useStore();
  const { colors } = useTheme();
  const phone = parentPhone || authUser?.phone || '';
  const children = students.filter((s) => s.parentPhone.replace(/\s/g, '') === phone.replace(/\s/g, ''));
  const defaultAge = children[0]?.age ?? 10;

  const [category, setCategory] = useState<GameCategory | 'all'>(
    (params.cat as GameCategory) || 'all'
  );
  const [ageBand, setAgeBand] = useState(ageToBand(defaultAge));
  const [difficulty, setDifficulty] = useState<GameDifficulty | 'all'>('all');
  const [active, setActive] = useState<LearningGame | null>(null);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  const filtered = learningGames.filter((g) => {
    if (category !== 'all' && g.category !== category) return false;
    if (g.ageBand !== ageBand) return false;
    if (difficulty !== 'all' && g.difficulty !== difficulty) return false;
    return true;
  });

  const handleDone = useCallback((score: number, total: number) => {
    setResult({ score, total });
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surface }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.dark} />
        </Pressable>
        <Text style={[styles.title, { color: colors.dark }]}>Interaktiv o'yinlar</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {(['all', 'math', 'attention', 'language', 'logic'] as const).map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            style={[
              styles.chip,
              {
                backgroundColor: category === c ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: category === c ? '#fff' : colors.dark, fontSize: 12, fontWeight: '600' }}>
              {c === 'all' ? 'Barchasi' : GAME_CATEGORY_LABELS[c]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>YOSH</Text>
      <View style={styles.row}>
        {(['6-8', '9-11', '12-14', '15-18'] as const).map((b) => (
          <Pressable key={b} onPress={() => setAgeBand(b)} style={styles.ageBtn}>
            <Text style={{ color: ageBand === b ? colors.primary : colors.muted, fontWeight: '600', fontSize: 13 }}>
              {b}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '600', marginBottom: 6, marginTop: 8 }}>QIYINLIK</Text>
      <View style={styles.row}>
        {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
          <Pressable key={d} onPress={() => setDifficulty(d)} style={styles.ageBtn}>
            <Text style={{ color: difficulty === d ? colors.primary : colors.muted, fontWeight: '600', fontSize: 13 }}>
              {d === 'all' ? 'Barchasi' : GAME_DIFFICULTY_LABELS[d]}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.map((g) => (
        <Card key={g.id} colors={colors}>
          <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 16 }}>{g.title}</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>{g.description}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            <Badge label={GAME_CATEGORY_LABELS[g.category]} color={colors.primary} />
            <Badge label={GAME_DIFFICULTY_LABELS[g.difficulty]} color="#5AC8FA" />
            <Badge label={`${g.durationMin} daq`} color="#34C759" />
            {g.graphical ? <Badge label="Grafikali" color="#FF9500" /> : null}
          </View>
          <View style={{ marginTop: 12 }}>
            <Button
              label="Boshlash"
              onPress={() => { setActive(g); setResult(null); }}
              colors={colors}
            />
          </View>
        </Card>
      ))}

      {filtered.length === 0 && (
        <Card colors={colors}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>O'yin topilmadi</Text>
        </Card>
      )}

      <Modal visible={!!active} animationType="slide">
        <View style={[styles.playScreen, { backgroundColor: colors.surface }]}>
          <View style={styles.playHeader}>
            <Pressable
              onPress={() => { setActive(null); setResult(null); }}
              hitSlop={10}
            >
              <Ionicons name="close" size={28} color={colors.dark} />
            </Pressable>
            <Text style={{ color: colors.dark, fontWeight: '700', fontSize: 17, flex: 1, marginLeft: 12 }}>
              {active?.title}
            </Text>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {result ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="trophy" size={48} color="#FF9500" />
                <Text style={{ color: colors.dark, fontSize: 24, fontWeight: '700', marginTop: 12 }}>
                  {result.score}/{result.total}
                </Text>
                <View style={{ marginTop: 20, width: '100%', gap: 8 }}>
                  <Button label="Qayta o'ynash" onPress={() => setResult(null)} colors={colors} />
                  <Button
                    label="Ro'yxat"
                    onPress={() => { setActive(null); setResult(null); }}
                    colors={colors}
                    variant="ghost"
                  />
                </View>
              </View>
            ) : active?.mechanic === 'quiz' ? (
              <QuizPlay game={active} onDone={handleDone} colors={colors} />
            ) : active?.mechanic === 'odd-one' ? (
              <OddPlay game={active} onDone={handleDone} colors={colors} />
            ) : active?.mechanic === 'memory' ? (
              <MemoryPlay game={active} onDone={handleDone} colors={colors} />
            ) : active?.mechanic === 'match' ? (
              <MatchPlay game={active} onDone={handleDone} colors={colors} />
            ) : active ? (
              <ModernGamePlayer game={active} onDone={handleDone} colors={colors} />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  ageBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  opt: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  grid4: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBtn: { padding: 12, borderRadius: 12, borderWidth: 1 },
  playScreen: { flex: 1, paddingTop: 48 },
  playHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
});
