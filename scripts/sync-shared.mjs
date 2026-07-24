import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pairs = [
  ['src/types/index.ts', 'mobile/src/shared/types/index.ts'],
  ['src/data/officialCircles.ts', 'mobile/src/shared/data/officialCircles.ts'],
  ['src/data/officialStudents.ts', 'mobile/src/shared/data/officialStudents.ts'],
  ['src/data/officialCircleLeaders.ts', 'mobile/src/shared/data/officialCircleLeaders.ts'],
  ['src/data/officialStaff.ts', 'mobile/src/shared/data/officialStaff.ts'],
  ['src/data/initialData.ts', 'mobile/src/shared/data/initialData.ts'],
  ['src/data/circleImages.ts', 'mobile/src/shared/data/circleImages.ts'],
  ['src/data/parentContent.ts', 'mobile/src/shared/data/parentContent.ts'],
  ['src/data/gameEngines.ts', 'mobile/src/shared/data/gameEngines.ts'],
];

for (const [from, to] of pairs) {
  const src = path.join(root, from);
  const dest = path.join(root, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  let content = fs.readFileSync(src, 'utf-8');
  // Keep mobile imports working if paths differ — types/data are self-contained
  content = content
    .replace(/from '\.\.\/types'/g, "from '../types'")
    .replace(/from '\.\.\/types'/g, "from '../types'");
  fs.writeFileSync(dest, content);
  console.log('Synced', from, '→', to);
}
