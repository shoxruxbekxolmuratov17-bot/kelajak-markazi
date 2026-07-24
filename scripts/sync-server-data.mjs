/**
 * Web src/data → server/src/data (Render Docker faqat server/ papkasini ko'radi).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fromDir = path.join(root, 'src', 'data');
const toDir = path.join(root, 'server', 'src', 'data');

const files = [
  'officialCircleLeaders.ts',
  'officialCircles.ts',
  'officialStaff.ts',
  'officialStudents.ts',
];

fs.mkdirSync(toDir, { recursive: true });

for (const file of files) {
  const src = path.join(fromDir, file);
  const dest = path.join(toDir, file);
  let content = fs.readFileSync(src, 'utf-8');
  content = content.replace(/from '\.\.\/types'/g, "from '../types.js'");
  content = content.replace(/from "\.\.\/types"/g, 'from "../types.js"');
  content = content.replace(/from '\.\/officialCircleLeaders'/g, "from './officialCircleLeaders.js'");
  fs.writeFileSync(dest, content);
  console.log('Synced', file);
}
