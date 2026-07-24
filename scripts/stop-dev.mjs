/**
 * Dev jarayonlarini to‘xtatish (Windows Ctrl+C ishlamaganda).
 * Portlar: 3001 (API), 5173 (Vite), 8081–8120 (Expo/Metro)
 */
import { execSync } from 'node:child_process';
import net from 'node:net';

const PORTS = [3001, 5173, 8081, 8090, 8085, 8086, 8087, 8088, 8089];

function findPidOnPort(port) {
  if (process.platform !== 'win32') {
    try {
      const out = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
      return out.split(/\s+/).filter(Boolean);
    } catch {
      return [];
    }
  }
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
    }
    return [...pids];
  } catch {
    return [];
  }
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
    console.log(`  ✓ PID ${pid} to‘xtatildi`);
  } catch {
    console.log(`  · PID ${pid} allaqachon yo‘q`);
  }
}

console.log('Dev jarayonlari to‘xtatilmoqda...\n');
const killed = new Set();
for (const port of PORTS) {
  for (const pid of findPidOnPort(port)) {
    if (killed.has(pid)) continue;
    killed.add(pid);
    console.log(`Port ${port} → PID ${pid}`);
    killPid(pid);
  }
}

// Expo / concurrently qolgan node bolalari
if (process.platform === 'win32') {
  try {
    const out = execSync(
      'wmic process where "CommandLine like \'%expo start%\' or CommandLine like \'%start-mobile%\' or CommandLine like \'%concurrently%kelajak%\'" get ProcessId /VALUE',
      { encoding: 'utf8' }
    );
    for (const m of out.matchAll(/ProcessId=(\d+)/g)) {
      const pid = m[1];
      if (!killed.has(pid)) {
        killed.add(pid);
        killPid(pid);
      }
    }
  } catch {
    // wmic ba'zan yo'q
  }
}

if (killed.size === 0) {
  console.log('Faol dev jarayon topilmadi (portlar bo‘sh).');
} else {
  console.log(`\nJami ${killed.size} jarayon to‘xtatildi.`);
}
console.log('Endi qayta: npm run dev:tunnel');
