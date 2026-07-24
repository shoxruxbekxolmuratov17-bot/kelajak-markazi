import { useMemo, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Brain, Calculator, Languages, Play, Trophy, Puzzle, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, Badge, Button } from '../components/ui';
import { useStore } from '../store/useStore';
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
} from '../data/parentContent';
import { ModernGamePlayer } from '../components/parent/ModernGames';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function QuizGame({ game, onDone }: { game: LearningGame; onDone: (score: number, total: number) => void }) {
  const questions = useMemo(() => getQuizQuestions(game.id), [game.id]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const q = questions[i];

  const pick = (idx: number) => {
    const next = score + (idx === q.answer ? 1 : 0);
    if (i + 1 >= questions.length) onDone(next, questions.length);
    else {
      setScore(next);
      setI(i + 1);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Savol {i + 1}/{questions.length}</p>
      <h3 className="text-xl font-bold text-dark">{q.q}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.options.map((opt, idx) => (
          <button
            key={opt}
            type="button"
            onClick={() => pick(idx)}
            className="p-4 rounded-xl border border-border bg-card text-left font-medium hover:border-primary hover:bg-primary/5 transition-colors"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function OddOneGame({ game, onDone }: { game: LearningGame; onDone: (score: number, total: number) => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [current, setCurrent] = useState(() => getOddOneRound(game.difficulty));
  const total = 5;

  const pick = (idx: number) => {
    const next = score + (idx === current.oddIndex ? 1 : 0);
    if (round + 1 >= total) onDone(next, total);
    else {
      setScore(next);
      setRound(round + 1);
      setCurrent(getOddOneRound(game.difficulty));
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Bosqich {round + 1}/{total} — farqni toping</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {current.items.map((item, idx) => (
          <button
            key={`${round}-${idx}`}
            type="button"
            onClick={() => pick(idx)}
            className="aspect-square rounded-2xl border border-border bg-card text-3xl sm:text-4xl flex items-center justify-center hover:border-primary hover:scale-[1.02] transition-all"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function MemoryGame({ game, onDone }: { game: LearningGame; onDone: (score: number, total: number) => void }) {
  const pairs = useMemo(() => shuffle(getMemoryPairs(game.difficulty)), [game.difficulty]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    if (matched.length === pairs.length && pairs.length > 0) {
      const perfect = pairs.length / 2;
      const score = Math.max(1, perfect - Math.floor(Math.max(0, moves - perfect) / 2));
      onDone(score, perfect);
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
        setTimeout(() => {
          setFlipped([]);
          setLock(false);
        }, 700);
      }
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Harakatlar: {moves} · Juftlar: {matched.length / 2}/{pairs.length / 2}</p>
      <div className="grid grid-cols-4 gap-2">
        {pairs.map((emoji, idx) => {
          const open = flipped.includes(idx) || matched.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => flip(idx)}
              className={`aspect-square rounded-xl border text-2xl flex items-center justify-center transition-all ${
                open ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              {open ? emoji : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchGame({ game, onDone }: { game: LearningGame; onDone: (score: number, total: number) => void }) {
  const pairs = useMemo(() => getMatchPairs(game.difficulty), [game.difficulty]);
  const rights = useMemo(() => shuffle(pairs.map((p) => p.right)), [pairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  const pickRight = (right: string) => {
    if (!selectedLeft || done.includes(selectedLeft)) return;
    const ok = pairs.find((p) => p.left === selectedLeft)?.right === right;
    const nextScore = score + (ok ? 1 : 0);
    const nextDone = ok ? [...done, selectedLeft] : done;
    setScore(nextScore);
    setSelectedLeft(null);
    if (ok) setDone(nextDone);
    if (nextDone.length === pairs.length) onDone(nextScore, pairs.length);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Chapdan so‘z, o‘ngdan tarjimani tanlang</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {pairs.map((p) => (
            <button
              key={p.left}
              type="button"
              disabled={done.includes(p.left)}
              onClick={() => setSelectedLeft(p.left)}
              className={`w-full p-3 rounded-xl border text-left font-medium transition-colors ${
                done.includes(p.left)
                  ? 'opacity-40 border-border'
                  : selectedLeft === p.left
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary'
              }`}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rights.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => pickRight(r)}
              className="w-full p-3 rounded-xl border border-border text-left font-medium hover:border-primary hover:bg-primary/5"
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GamePlayer({ game, onBack }: { game: LearningGame; onBack: () => void }) {
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const handleDone = useCallback((score: number, total: number) => {
    setResult({ score, total });
  }, []);

  return (
    <Card>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </Button>
        <div>
          <h2 className="font-bold text-dark">{game.title}</h2>
          <p className="text-xs text-muted">
            {GAME_CATEGORY_LABELS[game.category]} · {GAME_DIFFICULTY_LABELS[game.difficulty]} · {game.ageBand} yosh
          </p>
        </div>
      </div>

      {result ? (
        <div className="text-center py-8 space-y-3">
          <Trophy className="w-12 h-12 text-warning mx-auto" />
          <h3 className="text-2xl font-bold text-dark">Natija: {result.score}/{result.total}</h3>
          <p className="text-muted text-sm">
            {result.score === result.total
              ? 'Ajoyib! Hammasi to‘g‘ri!'
              : result.score >= result.total / 2
                ? 'Yaxshi natija — yana mashq qiling!'
                : 'Davom eting, mashq qilish foydali!'}
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setResult(null)}>Qayta o‘ynash</Button>
            <Button variant="secondary" onClick={onBack}>Ro‘yxat</Button>
          </div>
        </div>
      ) : game.mechanic === 'quiz' ? (
        <QuizGame game={game} onDone={handleDone} />
      ) : game.mechanic === 'odd-one' ? (
        <OddOneGame game={game} onDone={handleDone} />
      ) : game.mechanic === 'memory' ? (
        <MemoryGame game={game} onDone={handleDone} />
      ) : game.mechanic === 'match' ? (
        <MatchGame game={game} onDone={handleDone} />
      ) : (
        <ModernGamePlayer game={game} onDone={handleDone} />
      )}
    </Card>
  );
}

const CAT_ICONS = {
  math: Calculator,
  attention: Brain,
  language: Languages,
  logic: Puzzle,
};

export function ParentGamesPage() {
  const [params] = useSearchParams();
  const { parentPhone, authUser, students } = useStore();
  const phone = parentPhone || authUser?.phone || '';
  const children = students.filter((s) => s.parentPhone.replace(/\s/g, '') === phone.replace(/\s/g, ''));
  const defaultAge = children[0]?.age ?? 10;

  const [category, setCategory] = useState<GameCategory | 'all'>(
    (params.get('cat') as GameCategory) || 'all'
  );
  const [ageBand, setAgeBand] = useState(ageToBand(defaultAge));
  const [difficulty, setDifficulty] = useState<GameDifficulty | 'all'>('all');
  const [active, setActive] = useState<LearningGame | null>(null);

  const filtered = learningGames.filter((g) => {
    if (category !== 'all' && g.category !== category) return false;
    if (g.ageBand !== ageBand) return false;
    if (difficulty !== 'all' && g.difficulty !== difficulty) return false;
    return true;
  });

  if (active) {
    return (
      <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
        <GamePlayer game={active} onBack={() => setActive(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-dark">Interaktiv o‘yinlar</h2>
          <p className="text-sm text-muted mt-1">
            Matematika, diqqat va tillar — yosh va qiyinlik bo‘yicha
          </p>
        </div>
        <Link to="/ota-ona">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'math', 'attention', 'language', 'logic'] as const).map((c) => {
          const Icon = c === 'all' ? Play : CAT_ICONS[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                category === c ? 'bg-primary text-white border-primary' : 'bg-card border-border text-dark hover:border-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {c === 'all' ? 'Barchasi' : GAME_CATEGORY_LABELS[c]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted font-semibold uppercase tracking-wide">Yosh:</span>
        {(['6-8', '9-11', '12-14', '15-18'] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setAgeBand(b)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              ageBand === b ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-surface'
            }`}
          >
            {b}
          </button>
        ))}
        <span className="text-xs text-muted font-semibold uppercase tracking-wide ml-2">Qiyinlik:</span>
        {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              difficulty === d ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-surface'
            }`}
          >
            {d === 'all' ? 'Barchasi' : GAME_DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-muted py-8">Bu filtrlar bo‘yicha o‘yin topilmadi</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((g) => {
            const Icon = CAT_ICONS[g.category];
            return (
              <Card key={g.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark">{g.title}</h3>
                    <p className="text-sm text-muted mt-1">{g.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Badge color="#9588E8">{GAME_CATEGORY_LABELS[g.category]}</Badge>
                      <Badge color="#5AC8FA">{GAME_DIFFICULTY_LABELS[g.difficulty]}</Badge>
                      <Badge color="#34C759">{g.durationMin} daq</Badge>
                      {g.graphical && (
                        <Badge color="#FF9500">
                          <Sparkles className="w-3 h-3 inline mr-0.5" /> Grafikali
                        </Badge>
                      )}
                    </div>
                    <Button className="mt-3" size="sm" onClick={() => setActive(g)}>
                      <Play className="w-4 h-4" /> Boshlash
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
