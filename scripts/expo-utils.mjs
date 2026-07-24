import { spawn } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bindGracefulStop } from './kill-tree.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileDir = path.resolve(__dirname, '..', 'mobile');

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port);
  });
}

export async function findFreePort(start = 8085, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = start + i;
    if (await isPortFree(port)) return port;
  }
  throw new Error(`${start}-${start + maxAttempts - 1} oralig'ida bo'sh port topilmadi`);
}

export function getLocalIp() {
  const preferred = [];
  const fallback = [];
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      const addr = iface.address;
      if (
        addr.startsWith('172.') ||
        addr.startsWith('192.168.56.') ||
        addr.startsWith('169.254.')
      ) {
        fallback.push(addr);
      } else {
        preferred.push(addr);
      }
    }
  }
  return preferred[0] || fallback[0] || '127.0.0.1';
}

export function printExpoBanner({ port, tunnel = false }) {
  const ip = getLocalIp();
  console.log('\n========================================');
  console.log('  MOBIL — Expo Go');
  if (tunnel) {
    console.log('  Rejim: TUNNEL (ngrok)');
    console.log('  QR kod pastda chiqadi');
  } else {
    console.log(`  Manzil: exp://${ip}:${port}`);
    console.log('  QR kod pastda chiqadi (skanerlang)');
  }
  console.log("  QR ko'rinmasa — Expo Go da URL kiriting");
  console.log("  To'xtatish: Ctrl+C (ishlamasa → npm run stop)");
  console.log('========================================\n');
}

function buildEnv() {
  const ip = getLocalIp();
  const lanApi = `http://${ip}:3001/api`;
  const fromEnv = process.env.EXPO_PUBLIC_API_URL || '';
  // .env dagi localhost telefon/emulatorda ishlamaydi — LAN IP ga majburiy
  const apiUrl =
    fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv) ? fromEnv : lanApi;
  return {
    ...process.env,
    EXPO_NO_TELEMETRY: '1',
    EXPO_PUBLIC_API_URL: apiUrl,
  };
}

function runExpo(extraArgs, { port, tunnel }) {
  const args = [
    'expo', 'start', '--go',
    ...(tunnel ? ['--tunnel'] : ['--lan']),
    '--port', String(port),
    ...extraArgs,
  ];

  const env = buildEnv();
  console.log(`  API: ${env.EXPO_PUBLIC_API_URL}`);
  console.log(`  Expo: ${tunnel ? 'tunnel' : 'lan'} · port ${port}\n`);

  return new Promise((resolve) => {
    const child = spawn('npx', args, {
      cwd: mobileDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env,
    });

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    bindGracefulStop(child, () => {
      finish({ code: 0, signal: 'SIGINT' });
    });

    child.on('exit', (code, signal) => {
      finish({ code: code ?? 1, signal });
    });
  });
}

/**
 * Tunnel: 2 marta urinadi, bo'lmasa LAN ga o'tadi (watch mode saqlanadi).
 */
export async function startExpo(extraArgs = [], { port, tunnel = false } = {}) {
  if (!tunnel) {
    printExpoBanner({ port, tunnel: false });
    const { code } = await runExpo(extraArgs, { port, tunnel: false });
    process.exit(code);
    return;
  }

  const attempts = 2;
  for (let i = 1; i <= attempts; i++) {
    printExpoBanner({ port, tunnel: true });
    console.log(`Tunnel urinish ${i}/${attempts}...`);
    const { code, signal } = await runExpo(
      i === 1 ? ['--clear', ...extraArgs] : extraArgs,
      { port, tunnel: true }
    );

    if (signal === 'SIGINT' || signal === 'SIGTERM') {
      process.exit(0);
      return;
    }

    if (code === 0) {
      process.exit(0);
      return;
    }

    console.log(`\n⚠ Tunnel muvaffaqiyatsiz (kod ${code}).\n`);
    if (i < attempts) {
      console.log('3 soniyadan keyin qayta uriniladi...\n');
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log('========================================');
  console.log("  Tunnel (ngrok) ishlamadi — LAN rejimiga o'tildi");
  console.log('  Telefon va kompyuter BIR xil Wi‑Fi da bo\'lsin');
  console.log('========================================\n');

  printExpoBanner({ port, tunnel: false });
  const { code } = await runExpo(extraArgs, { port, tunnel: false });
  process.exit(code);
}
