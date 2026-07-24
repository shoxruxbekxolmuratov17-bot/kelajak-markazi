import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LearningGame } from '../../data/parentContent';
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
} from '../../data/gameEngines';

function SudokuBoard({
  game,
  onDone,
}: {
  game: LearningGame;
  onDone: (score: number, total: number) => void;
}) {
  const { size, holes } = useMemo(
    () => sudokuSizeForDifficulty(game.difficulty),
    [game.difficulty]
  );
  const pack = useMemo(() => generateSudoku(size, holes), [size, holes]);
  const [board, setBoard] = useState(() => pack.puzzle.map((r) => [...r]));
  const [fixed] = useState(() => pack.puzzle.map((row) => row.map((v) => v !== 0)));
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [solution] = useState(pack.solution);

  const cellSize = size === 9 ? 32 : size === 6 ? 40 : 52;

  const place = (num: number) => {
    if (!sel || fixed[sel.r][sel.c]) return;
    const next = board.map((row) => [...row]);
    next[sel.r][sel.c] = num;
    setBoard(next);
    if (isSudokuComplete(next, solution)) onDone(1, 1);
  };

  const clear = () => {
    if (!sel || fixed[sel.r][sel.c]) return;
    const next = board.map((row) => [...row]);
    next[sel.r][sel.c] = 0;
    setBoard(next);
  };

  return (
    <div className="space-y-4">
      <div
        className="mx-auto inline-grid gap-0.5 p-2 rounded-2xl shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          background: 'linear-gradient(135deg, #9588E8, #6B5FCF)',
        }}
      >
        {board.map((row, r) =>
          row.map((val, c) => {
            const conflict = val > 0 && isSudokuCellConflict(board, r, c, size as SudokuSize);
            const selected = sel?.r === r && sel?.c === c;
            const isFixed = fixed[r][c];
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => setSel({ r, c })}
                className="font-bold transition-transform"
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 8,
                  background: selected
                    ? '#FFE66D'
                    : conflict
                      ? '#FFCDD2'
                      : isFixed
                        ? '#F3F0FF'
                        : '#FFFFFF',
                  color: conflict ? '#C62828' : isFixed ? '#4A3F9A' : '#1a1a1a',
                  fontSize: size === 9 ? 14 : 18,
                  boxShadow: selected ? '0 0 0 2px #9588E8' : undefined,
                }}
              >
                {val || ''}
              </button>
            );
          })
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: size }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => place(n)}
            className="w-11 h-11 rounded-xl font-bold text-white shadow-md hover:scale-105 transition-transform"
            style={{
              background: `linear-gradient(145deg, hsl(${(n * 40) % 360} 70% 55%), hsl(${(n * 40 + 20) % 360} 70% 42%))`,
            }}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={clear}
          className="px-4 h-11 rounded-xl font-semibold bg-surface border border-border text-muted"
        >
          Tozalash
        </button>
      </div>
    </div>
  );
}

function Merge2048Game({
  game,
  onDone,
}: {
  game: LearningGame;
  onDone: (score: number, total: number) => void;
}) {
  const target = game.difficulty === 'easy' ? 128 : game.difficulty === 'medium' ? 1024 : 2048;
  const [grid, setGrid] = useState<Grid2048>(() => create2048(4));
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);

  const apply = useCallback(
    (dir: Dir2048) => {
      if (over) return;
      const res = move2048(grid, dir);
      if (!res.moved) return;
      setGrid(res.grid);
      setScore((s) => s + res.score);
      if (maxTile2048(res.grid) >= target) {
        onDone(Math.min(target, maxTile2048(res.grid)), target);
      } else if (!canMove2048(res.grid)) {
        setOver(true);
        onDone(maxTile2048(res.grid), target);
      }
    },
    [grid, over, target, onDone]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir2048> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      if (map[e.key]) {
        e.preventDefault();
        apply(map[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [apply]);

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      <div className="flex justify-between items-center">
        <div className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-sm">
          Ball: {score}
        </div>
        <div className="text-sm text-muted">Maqsad: {target}</div>
      </div>
      <div
        className="grid grid-cols-4 gap-2 p-3 rounded-2xl"
        style={{ background: 'linear-gradient(160deg, #BBADA0, #8F7A66)' }}
      >
        {grid.flatMap((row, r) =>
          row.map((v, c) => {
            const pal = TILE_COLORS_2048[v] || TILE_COLORS_2048[2048];
            return (
              <div
                key={`${r}-${c}`}
                className="aspect-square rounded-xl flex items-center justify-center font-black text-lg shadow-inner transition-all"
                style={{ background: pal.bg, color: pal.fg, fontSize: v >= 1000 ? 14 : 20 }}
              >
                {v || ''}
              </div>
            );
          })
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
        <div />
        <button type="button" className="btn-dir" onClick={() => apply('up')}>↑</button>
        <div />
        <button type="button" className="btn-dir" onClick={() => apply('left')}>←</button>
        <button type="button" className="btn-dir" onClick={() => apply('down')}>↓</button>
        <button type="button" className="btn-dir" onClick={() => apply('right')}>→</button>
      </div>
      <style>{`.btn-dir{height:44px;border-radius:12px;background:#9588E8;color:#fff;font-weight:700;font-size:18px}.btn-dir:hover{filter:brightness(1.08)}`}</style>
      {over && <p className="text-center text-danger text-sm font-medium">Yurishlar tugadi</p>}
      <p className="text-center text-xs text-muted">Klaviatura strelkalari yoki tugmalar</p>
    </div>
  );
}

function ColorSeqGame({
  game,
  onDone,
}: {
  game: LearningGame;
  onDone: (score: number, total: number) => void;
}) {
  const colorsN = game.difficulty === 'easy' ? 4 : game.difficulty === 'medium' ? 4 : 6;
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
    const play = async () => {
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
    };
    void play();
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
    } else {
      setInputIdx(nextIdx);
    }
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto text-center">
      <p className="text-sm text-muted">
        {phase === 'watch' ? 'Ranglar ketma-ketligini kuzating…' : 'Takrorlang!'} · Bosqich {round}/{maxRounds}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {palette.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={phase !== 'play'}
            onClick={() => tap(p.id)}
            className="aspect-square rounded-3xl shadow-lg transition-all duration-150 disabled:cursor-default"
            style={{
              background: p.color,
              transform: lit === p.id ? 'scale(1.08)' : 'scale(1)',
              filter: lit === p.id ? 'brightness(1.35)' : 'brightness(1)',
              boxShadow: lit === p.id ? `0 0 24px ${p.color}` : undefined,
              opacity: phase === 'watch' && lit !== p.id ? 0.55 : 1,
            }}
          />
        ))}
      </div>
      <p className="text-xs text-muted">Ball: {score}</p>
    </div>
  );
}

export function ModernGamePlayer({
  game,
  onDone,
}: {
  game: LearningGame;
  onDone: (score: number, total: number) => void;
}) {
  if (game.mechanic === 'sudoku') return <SudokuBoard game={game} onDone={onDone} />;
  if (game.mechanic === 'merge2048') return <Merge2048Game game={game} onDone={onDone} />;
  if (game.mechanic === 'color-seq') return <ColorSeqGame game={game} onDone={onDone} />;
  return null;
}
