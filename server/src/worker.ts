/**
 * Background worker stub — SMS / notification queue consumer.
 * Run: npm run worker
 */
import 'dotenv/config';
import { initRedis, queuePop, cacheMode } from './redis.js';
import { logJson } from './metrics.js';
import { sendSms } from './sms.js';

async function tick() {
  const raw = await queuePop('notifications');
  if (!raw) return;
  try {
    const job = JSON.parse(raw) as { type?: string; phone?: string; text?: string };
    if (job.phone) {
      await sendSms(job.phone, job.text || `Kelajak Markazi: ${job.type || 'xabar'}`);
    }
    logJson('info', 'worker_job_done', { job });
  } catch (e) {
    logJson('error', 'worker_job_failed', { error: String(e) });
  }
}

async function main() {
  const mode = await initRedis();
  logJson('info', 'worker_started', { cache: mode });
  setInterval(() => {
    void tick();
  }, 2000);
}

void main();
