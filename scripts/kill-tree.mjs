/**
 * Windows-friendly process kill (Ctrl+C often fails with shell+Expo).
 */
import { spawn } from 'node:child_process';

export function killProcessTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        shell: true,
        windowsHide: true,
      });
    } catch {
      // ignore
    }
    return;
  }
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // ignore
    }
  }
}

/** Listen once for Ctrl+C / close and kill child tree. */
export function bindGracefulStop(child, onStop) {
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    console.log('\nTo‘xtatilmoqda...');
    killProcessTree(child.pid);
    onStop?.();
    // Force exit if child hangs
    setTimeout(() => process.exit(0), 1500).unref?.();
  };

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  process.once('SIGHUP', stop);
  // Windows console close / Ctrl+Break
  if (process.platform === 'win32') {
    try {
      process.once('SIGBREAK', stop);
    } catch {
      // ignore
    }
  }
  return stop;
}
