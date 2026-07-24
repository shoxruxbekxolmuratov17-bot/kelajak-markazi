import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bindGracefulStop } from './kill-tree.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3001;
const HEALTH = `http://127.0.0.1:${PORT}/api/health`;

async function isApiUp() {
  try {
    const res = await fetch(HEALTH, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.ok === true;
  } catch {
    return false;
  }
}

function keepAlive(msg) {
  console.log(msg);
  console.log('Ctrl+C yoki: npm run stop');
  const stop = () => {
    console.log('\nTo‘xtatildi (API alohida ishlayotgan bo‘lishi mumkin — npm run stop).');
    process.exit(0);
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  setInterval(() => {}, 60_000);
}

async function main() {
  if (await isApiUp()) {
    keepAlive(`API allaqachon ishlayapti → http://localhost:${PORT}`);
    return;
  }

  const child = spawn('npm', ['run', 'start', '--prefix', 'server'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  bindGracefulStop(child);
  child.on('exit', (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
