/**
 * Android APK (EAS Build, cloud).
 *
 * Birinchi marta:
 *   cd mobile && npx eas-cli login
 *   npx eas-cli init
 *
 * Render API tayyor bo'lgach:
 *   npm run build:apk -- --url https://SIZNING-API.onrender.com/api
 *
 * Faqat LAN demo (bir Wi-Fi):
 *   npm run build:apk
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLocalIp } from './expo-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(__dirname, '..', 'mobile');

function parseUrlArg() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--url' || args[i] === '-u') && args[i + 1]) {
      return args[i + 1].trim().replace(/\/$/, '');
    }
  }
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return `http://${getLocalIp()}:3001/api`;
}

function run(cmd, cmdArgs, env = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: mobileDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const apiUrl = parseUrlArg();

console.log('\n========================================');
console.log('  Kelajak Markazi — Android APK');
console.log(`  API: ${apiUrl}`);
if (/^http:\/\//i.test(apiUrl) && !/192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\./.test(apiUrl)) {
  console.log('  ⚠ HTTP faqat LAN uchun. Render uchun https://.../api bering.');
}
console.log('========================================\n');

const whoami = spawnSync('npx', ['eas-cli', 'whoami'], {
  cwd: mobileDir,
  encoding: 'utf8',
  shell: true,
});
if (whoami.status !== 0 || /not logged in/i.test(whoami.stdout + whoami.stderr)) {
  console.error('Expo hisobiga kirmagansiz. Avval terminalda:');
  console.error('  cd mobile');
  console.error('  npx eas-cli login');
  console.error('  npx eas-cli init');
  process.exit(1);
}

run('npx', [
  'eas-cli',
  'build',
  '--platform',
  'android',
  '--profile',
  'preview',
  '--non-interactive',
], {
  EXPO_PUBLIC_API_URL: apiUrl,
});

console.log('\nAPK tayyor bo‘lgach EAS dashboard yoki terminaldagi havoladan yuklab oling.\n');
