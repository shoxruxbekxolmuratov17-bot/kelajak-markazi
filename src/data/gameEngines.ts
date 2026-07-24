/** Sudoku, 2048 va rangli o'yinlar — web/mobile umumiy mantiq */

export type SudokuSize = 4 | 6 | 9;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function boxDims(size: SudokuSize): { br: number; bc: number } {
  if (size === 4) return { br: 2, bc: 2 };
  if (size === 6) return { br: 2, bc: 3 };
  return { br: 3, bc: 3 };
}

function isValid(board: number[][], row: number, col: number, num: number, size: SudokuSize): boolean {
  for (let i = 0; i < size; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const { br, bc } = boxDims(size);
  const r0 = Math.floor(row / br) * br;
  const c0 = Math.floor(col / bc) * bc;
  for (let r = 0; r < br; r++) {
    for (let c = 0; c < bc; c++) {
      if (board[r0 + r][c0 + c] === num) return false;
    }
  }
  return true;
}

function solve(board: number[][], size: SudokuSize): boolean {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] !== 0) continue;
      for (const num of shuffle(Array.from({ length: size }, (_, i) => i + 1))) {
        if (!isValid(board, r, c, num, size)) continue;
        board[r][c] = num;
        if (solve(board, size)) return true;
        board[r][c] = 0;
      }
      return false;
    }
  }
  return true;
}

function cloneBoard(board: number[][]): number[][] {
  return board.map((row) => [...row]);
}

/** Puzzle + yechim. holes — ochiq kataklar soni. */
export function generateSudoku(size: SudokuSize, holes: number): {
  puzzle: number[][];
  solution: number[][];
} {
  const board = Array.from({ length: size }, () => Array(size).fill(0));
  solve(board, size);
  const solution = cloneBoard(board);
  const puzzle = cloneBoard(board);
  const cells = shuffle(
    Array.from({ length: size * size }, (_, i) => ({ r: Math.floor(i / size), c: i % size }))
  );
  let removed = 0;
  for (const { r, c } of cells) {
    if (removed >= holes) break;
    puzzle[r][c] = 0;
    removed++;
  }
  return { puzzle, solution };
}

export function sudokuSizeForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): {
  size: SudokuSize;
  holes: number;
} {
  if (difficulty === 'easy') return { size: 4, holes: 8 };
  if (difficulty === 'medium') return { size: 6, holes: 18 };
  return { size: 9, holes: 45 };
}

export function isSudokuComplete(board: number[][], solution: number[][]): boolean {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board.length; c++) {
      if (board[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export function isSudokuCellConflict(
  board: number[][],
  row: number,
  col: number,
  size: SudokuSize
): boolean {
  const val = board[row][col];
  if (!val) return false;
  for (let i = 0; i < size; i++) {
    if (i !== col && board[row][i] === val) return true;
    if (i !== row && board[i][col] === val) return true;
  }
  const { br, bc } = boxDims(size);
  const r0 = Math.floor(row / br) * br;
  const c0 = Math.floor(col / bc) * bc;
  for (let r = 0; r < br; r++) {
    for (let c = 0; c < bc; c++) {
      const rr = r0 + r;
      const cc = c0 + c;
      if ((rr !== row || cc !== col) && board[rr][cc] === val) return true;
    }
  }
  return false;
}

/* ——— 2048 ——— */

export type Grid2048 = number[][];

export function create2048(size = 4): Grid2048 {
  const g = Array.from({ length: size }, () => Array(size).fill(0));
  spawn(g);
  spawn(g);
  return g;
}

function spawn(grid: Grid2048) {
  const empty: { r: number; c: number }[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid.length; c++) {
      if (grid[r][c] === 0) empty.push({ r, c });
    }
  }
  if (!empty.length) return;
  const cell = empty[Math.floor(Math.random() * empty.length)];
  grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
}

function slideLine(line: number[]): { line: number[]; score: number; moved: boolean } {
  const filtered = line.filter((n) => n !== 0);
  const result: number[] = [];
  let score = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      result.push(merged);
      score += merged;
      i += 2;
    } else {
      result.push(filtered[i]);
      i += 1;
    }
  }
  while (result.length < line.length) result.push(0);
  const moved = result.some((v, idx) => v !== line[idx]);
  return { line: result, score, moved };
}

export type Dir2048 = 'up' | 'down' | 'left' | 'right';

export function move2048(grid: Grid2048, dir: Dir2048): { grid: Grid2048; score: number; moved: boolean } {
  const size = grid.length;
  const next = grid.map((row) => [...row]);
  let score = 0;
  let moved = false;

  const apply = (get: (i: number, j: number) => number, set: (i: number, j: number, v: number) => void) => {
    for (let i = 0; i < size; i++) {
      const line = Array.from({ length: size }, (_, j) => get(i, j));
      const res = slideLine(line);
      score += res.score;
      if (res.moved) moved = true;
      res.line.forEach((v, j) => set(i, j, v));
    }
  };

  if (dir === 'left') apply((r, c) => next[r][c], (r, c, v) => { next[r][c] = v; });
  if (dir === 'right') apply((r, c) => next[r][size - 1 - c], (r, c, v) => { next[r][size - 1 - c] = v; });
  if (dir === 'up') apply((c, r) => next[r][c], (c, r, v) => { next[r][c] = v; });
  if (dir === 'down') apply((c, r) => next[size - 1 - r][c], (c, r, v) => { next[size - 1 - r][c] = v; });

  if (moved) spawn(next);
  return { grid: next, score, moved };
}

export function canMove2048(grid: Grid2048): boolean {
  for (const dir of ['up', 'down', 'left', 'right'] as Dir2048[]) {
    if (move2048(grid, dir).moved) return true;
  }
  return false;
}

export function maxTile2048(grid: Grid2048): number {
  return Math.max(...grid.flat());
}

/** Rangli plitkalar — zamonaviy ko'rinish */
export const TILE_COLORS_2048: Record<number, { bg: string; fg: string }> = {
  0: { bg: '#CDC1B4', fg: '#776E65' },
  2: { bg: '#EEE4DA', fg: '#776E65' },
  4: { bg: '#EDE0C8', fg: '#776E65' },
  8: { bg: '#F2B179', fg: '#F9F6F2' },
  16: { bg: '#F59563', fg: '#F9F6F2' },
  32: { bg: '#F67C5F', fg: '#F9F6F2' },
  64: { bg: '#F65E3B', fg: '#F9F6F2' },
  128: { bg: '#EDCF72', fg: '#F9F6F2' },
  256: { bg: '#EDCC61', fg: '#F9F6F2' },
  512: { bg: '#EDC850', fg: '#F9F6F2' },
  1024: { bg: '#EDC53F', fg: '#F9F6F2' },
  2048: { bg: '#EDC22E', fg: '#F9F6F2' },
};

/* ——— Rang ketma-ketligi (Simon-style) ——— */

export const COLOR_SEQ_PALETTE = [
  { id: 0, color: '#FF6B6B', label: 'Qizil' },
  { id: 1, color: '#4ECDC4', label: 'Moviy' },
  { id: 2, color: '#FFE66D', label: 'Sariq' },
  { id: 3, color: '#95E06C', label: 'Yashil' },
  { id: 4, color: '#A78BFA', label: 'Binafsha' },
  { id: 5, color: '#FB923C', label: 'To‘q sariq' },
];

export function nextColorSeqLength(round: number, difficulty: 'easy' | 'medium' | 'hard'): number {
  const base = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
  return base + Math.floor(round / 2);
}

export function randomColorSeq(length: number, colorsAvailable: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * colorsAvailable));
}

/* ——— Ota-ona maslahatlari / qulayliklar matnlari ——— */

export interface ParentTip {
  id: string;
  title: string;
  body: string;
  icon: 'clock' | 'book' | 'heart' | 'game' | 'pay' | 'chat';
}

export const parentTips: ParentTip[] = [
  {
    id: 't1',
    title: 'Darsdan oldin 10 daqiqa',
    body: "Bolangiz bilan bugungi dars mavzusini qisqa suhbat qiling — qiziqish va diqqat oshadi.",
    icon: 'clock',
  },
  {
    id: 't2',
    title: 'Uy vazifasini birga',
    body: "Har kuni 15–20 daqiqa birga o'tirish — mustaqil o'rganish odatini shakllantiradi.",
    icon: 'book',
  },
  {
    id: 't3',
    title: "O'yin = mashq",
    body: "Interaktiv o'yinlar matematika va tillarni mustahkamlaydi. Kuniga 1–2 o'yin yetarli.",
    icon: 'game',
  },
  {
    id: 't4',
    title: "To'lovni oldindan",
    body: "Onlayn to'lov orqali muddatni o'tkazib yubormang — eslatmalar lichkangizda ko'rinadi.",
    icon: 'pay',
  },
  {
    id: 't5',
    title: 'Murabbiy bilan aloqa',
    body: "Savol yoki izoh bo'lsa — Xabarlar orqali to'g'ridan-to'g'ri murabbiyga yozing.",
    icon: 'chat',
  },
  {
    id: 't6',
    title: 'Maqtov muhim',
    body: "Kichik yutuqlarni ham maqtang — bu motivatsiyani saqlaydi va markazga qiziqishni oshiradi.",
    icon: 'heart',
  },
];

export const PARENT_QUICK_LINKS = [
  { id: 'pay', label: "To'lovlar", hash: 'tolovlar', icon: 'wallet' },
  { id: 'lessons', label: 'Darslar', hash: 'darslar', icon: 'clock' },
  { id: 'circles', label: "To'garaklar", hash: 'togaraklar', icon: 'book' },
  { id: 'games', label: "O'yinlar", path: '/ota-ona/oyinlar', icon: 'game' },
  { id: 'hw', label: 'Vazifalar', hash: 'vazifalar', icon: 'edit' },
  { id: 'msg', label: 'Xabarlar', path: '/ota-ona/xabarlar', icon: 'chat' },
] as const;
