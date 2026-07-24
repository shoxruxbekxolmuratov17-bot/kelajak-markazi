#!/usr/bin/env node
/**
 * Parallel login/bootstrap smoke — local capacity signal.
 * Usage: node scripts/load-smoke.mjs
 */
const API = process.env.API_URL || 'http://localhost:3001/api';
const N = Number(process.env.LOAD_N || 50);

async function one(i) {
  const t0 = Date.now();
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  if (!login.ok) throw new Error(`login ${login.status}`);
  const { token } = await login.json();
  const boot = await fetch(`${API}/bootstrap`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!boot.ok) throw new Error(`bootstrap ${boot.status}`);
  return Date.now() - t0;
}

async function main() {
  console.log(`Load smoke: ${N} parallel against ${API}`);
  const started = Date.now();
  const results = await Promise.allSettled(Array.from({ length: N }, (_, i) => one(i)));
  const ok = results.filter((r) => r.status === 'fulfilled');
  const fail = results.filter((r) => r.status === 'rejected');
  const times = ok.map((r) => r.value);
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)] || 0;
  const p95 = times[Math.floor(times.length * 0.95)] || 0;
  console.log({
    ok: ok.length,
    fail: fail.length,
    elapsedMs: Date.now() - started,
    p50Ms: p50,
    p95Ms: p95,
  });
  if (fail.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
