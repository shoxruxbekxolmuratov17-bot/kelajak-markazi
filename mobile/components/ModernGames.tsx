import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import type { LearningGame } from '@shared/data/parentContent';
import {
  generateSudoku,
  sudokuSizeForDifficulty,
  isSudokuComplete,
  isSudokuCellConflict,
  create2048,
  move2048,
  canMove2048,
  maxTile2048,
  TILE_COLORS_2048,
  COLOR_SEQ_PALETTE,
  nextColorSeqLength,
  randomColorSeq,
  type Dir2048,
  type Grid2048,
  type SudokuSize,
} from '@shared/data/gameEngines';

const SCREEN_W = Dimensions.get('window').width;

export function ModernGamePlayer({
  game,
  onDone,
  colors,
}: {
  game: LearningGame;
  onDone: (score: number, total: number) => void;
  colors: { dark: string; muted: string; primary: string; surface: string; danger: string };
}) {
  if (game.mechanic === 'sudoku') return <SudokuPlay game={game} onDone={onDone} colors={colors} />;
  if (game.mechanic === 'merge2048') return <MergePlay game={game} onDone={onDone} colors={colors} />;
  if (game.mechanic === 'color-seq') return <ColorPlay game={game} onDone={onDone} colors={colors} />;
  return null;
}

function SudokuPlay({
  game,
  onDone,
  colors,
}: {
  game: LearningGame;
  onDone: (s: number, t: number) => void;
  colors: { dark: string; muted: string; primary: string; surface: string; danger: string };
}) {
  const { size, holes } = useMemo(() => sudokuSizeForDifficulty(game.difficulty), [game.difficulty]);
  const pack = useMemo(() => generateSudoku(size, holes), [size, holes]);
  const [board, setBoard] = useState(() => pack.puzzle.map((r) => [...r]));
  const [fixed] = useState(() => pack.puzzle.map((row) => row.map((v) => v !== 0)));
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const cell = Math.min(52, Math.floor((SCREEN_W - 64) / size) - 2);

  const place = (num: number) => {
    if (!sel || fixed[sel.r][sel.c]) return;
    const next = board.map((row) => [...row]);
    next[sel.r][sel.c] = num;
    setBoard(next);
    if (isSudokuComplete(next, pack.solution)) onDone(1, 1);
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[s.sudokuWrap, { width: size * (cell + 2) + 12 }]}>
        {board.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((val, c) => {
              const conflict = val > 0 && isSudokuCellConflict(board, r, c, size as SudokuSize);
              const selected = sel?.r === r && sel?.c === c;
              const isFixed = fixed[r][c];
              return (
                <Pressable
                  key={`${r}-${c}`}
                  onPress={() => setSel({ r, c })}
                  style={{
                    width: cell,
                    height: cell,
                    margin: 1,
                    borderRadius: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? '#FFE66D' : conflict ? '#FFCDD2' : isFixed ? '#F3F0FF' : '#fff',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '800',
                      fontSize: size === 9 ? 14 : 18,
                      color: conflict ? colors.danger : isFixed ? '#4A3F9A' : colors.dark,
                    }}
                  >
                    {val || ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <View style={s.numRow}>
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
          <Pressable
            key={n}
            onPress={() => place(n)}
            style={[s.numBtn, { backgroundColor: `hsl(${(n * 40) % 360}, 70%, 50%)` }]}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{n}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => {
            if (!sel || fixed[sel.r][sel.c]) return;
            const next = board.map((row) => [...row]);
            next[sel.r][sel.c] = 0;
            setBoard(next);
          }}
          style={[s.numBtn, { backgroundColor: colors.surface, minWidth: 64 }]}
        >
          <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 12 }}>Toza</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MergePlay({
  game,
  onDone,
  colors,
}: {
  game: LearningGame;
  onDone: (s: number, t: number) => void;
  colors: { dark: string; muted: string; primary: string };
}) {
  const target = game.difficulty === 'easy' ? 128 : game.difficulty === 'medium' ? 1024 : 2048;
  const [grid, setGrid] = useState<Grid2048>(() => create2048(4));
  const [score, setScore] = useState(0);

  const apply = useCallback(
    (dir: Dir2048) => {
      const res = move2048(grid, dir);
      if (!res.moved) return;
      setGrid(res.grid);
      setScore((s) => s + res.score);
      const max = maxTile2048(res.grid);
      if (max >= target) onDone(Math.min(target, max), target);
      else if (!canMove2048(res.grid)) onDone(max, target);
    },
    [grid, target, onDone]
  );

  const tile = Math.floor((SCREEN_W - 80) / 4);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={s.scoreRow}>
        <View style={[s.scoreBadge, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Ball: {score}</Text>
        </View>
        <Text style={{ color: colors.muted }}>Maqsad: {target}</Text>
      </View>
      <View style={s.grid2048}>
        {grid.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((v, c) => {
              const pal = TILE_COLORS_2048[v] || TILE_COLORS_2048[2048];
              return (
                <View
                  key={`${r}-${c}`}
                  style={{
                    width: tile,
                    height: tile,
                    margin: 3,
                    borderRadius: 10,
                    backgroundColor: pal.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: pal.fg, fontWeight: '900', fontSize: v >= 1000 ? 14 : 18 }}>
                    {v || ''}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={s.pad}>
        <View style={s.padRow}>
          <View style={{ width: 56 }} />
          <Pressable style={[s.padBtn, { backgroundColor: colors.primary }]} onPress={() => apply('up')}>
            <Text style={s.padTxt}>↑</Text>
          </Pressable>
          <View style={{ width: 56 }} />
        </View>
        <View style={s.padRow}>
          <Pressable style={[s.padBtn, { backgroundColor: colors.primary }]} onPress={() => apply('left')}>
            <Text style={s.padTxt}>←</Text>
          </Pressable>
          <Pressable style={[s.padBtn, { backgroundColor: colors.primary }]} onPress={() => apply('down')}>
            <Text style={s.padTxt}>↓</Text>
          </Pressable>
          <Pressable style={[s.padBtn, { backgroundColor: colors.primary }]} onPress={() => apply('right')}>
            <Text style={s.padTxt}>→</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ColorPlay({
  game,
  onDone,
  colors,
}: {
  game: LearningGame;
  onDone: (s: number, t: number) => void;
  colors: { muted: string };
}) {
  const colorsN = game.difficulty === 'hard' ? 6 : 4;
  const palette = COLOR_SEQ_PALETTE.slice(0, colorsN);
  const maxRounds = game.difficulty === 'easy' ? 5 : game.difficulty === 'medium' ? 7 : 9;
  const [round, setRound] = useState(1);
  const [seq, setSeq] = useState(() => randomColorSeq(nextColorSeqLength(1, game.difficulty), colorsN));
  const [phase, setPhase] = useState<'watch' | 'play'>('watch');
  const [lit, setLit] = useState<number | null>(null);
  const [inputIdx, setInputIdx] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase('watch');
      setInputIdx(0);
      await new Promise((r) => setTimeout(r, 400));
      for (let i = 0; i < seq.length; i++) {
        if (cancelled) return;
        setLit(seq[i]);
        await new Promise((r) => setTimeout(r, 500));
        setLit(null);
        await new Promise((r) => setTimeout(r, 180));
      }
      if (!cancelled) setPhase('play');
    })();
    return () => { cancelled = true; };
  }, [seq]);

  const tap = (id: number) => {
    if (phase !== 'play') return;
    if (seq[inputIdx] !== id) {
      onDone(score, maxRounds);
      return;
    }
    const nextIdx = inputIdx + 1;
    if (nextIdx >= seq.length) {
      const nextScore = score + 1;
      setScore(nextScore);
      if (nextScore >= maxRounds) {
        onDone(nextScore, maxRounds);
        return;
      }
      const nr = round + 1;
      setRound(nr);
      setSeq(randomColorSeq(nextColorSeqLength(nr, game.difficulty), colorsN));
    } else setInputIdx(nextIdx);
  };

  return (
    <View>
      <Text style={{ color: colors.muted, textAlign: 'center', marginBottom: 12 }}>
        {phase === 'watch' ? 'Kuzating…' : 'Takrorlang!'} · {round}/{maxRounds} · Ball {score}
      </Text>
      <View style={s.colorGrid}>
        {palette.map((p) => (
          <Pressable
            key={p.id}
            disabled={phase !== 'play'}
            onPress={() => tap(p.id)}
            style={{
              width: '46%',
              aspectRatio: 1,
              borderRadius: 24,
              backgroundColor: p.color,
              margin: '2%',
              opacity: phase === 'watch' && lit !== p.id ? 0.5 : 1,
              transform: [{ scale: lit === p.id ? 1.06 : 1 }],
            }}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sudokuWrap: {
    backgroundColor: '#9588E8',
    padding: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  numRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  numBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  grid2048: { backgroundColor: '#BBADA0', padding: 6, borderRadius: 16 },
  pad: { marginTop: 16, alignItems: 'center' },
  padRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  padBtn: { width: 56, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  padTxt: { color: '#fff', fontSize: 22, fontWeight: '700' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
});
