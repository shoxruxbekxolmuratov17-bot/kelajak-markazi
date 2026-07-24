/** Offline → online sync queue (localStorage) */
const QUEUE_KEY = 'kelajak-offline-queue';

export type OfflineOp =
  | { type: 'createMessage'; payload: { title: string; content: string; type?: string } }
  | { type: 'bulkAttendance'; payload: unknown[] }
  | { type: 'updatePayment'; payload: { id: string; data: Record<string, unknown> } }
  | { type: 'submitEnrollment'; payload: Record<string, unknown> };

type FlushApi = {
  createMessage: (p: OfflineOp extends never ? never : { title: string; content: string; type?: string }) => Promise<unknown>;
  bulkAttendance: (records: unknown[]) => Promise<unknown>;
  updatePayment: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  submitEnrollment: (data: Record<string, unknown>) => Promise<unknown>;
};

function readQueue(): OfflineOp[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as OfflineOp[];
  } catch {
    return [];
  }
}

function writeQueue(ops: OfflineOp[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
  } catch {
    // ignore
  }
}

export function enqueueOffline(op: OfflineOp) {
  const q = readQueue();
  q.push(op);
  writeQueue(q);
}

export async function flushOfflineQueue(api: FlushApi): Promise<number> {
  const q = readQueue();
  if (!q.length) return 0;
  const remaining: OfflineOp[] = [];
  let done = 0;
  for (const op of q) {
    try {
      if (op.type === 'createMessage') await api.createMessage(op.payload);
      else if (op.type === 'bulkAttendance') await api.bulkAttendance(op.payload);
      else if (op.type === 'updatePayment') await api.updatePayment(op.payload.id, op.payload.data);
      else if (op.type === 'submitEnrollment') await api.submitEnrollment(op.payload);
      done += 1;
    } catch {
      remaining.push(op);
    }
  }
  writeQueue(remaining);
  return done;
}
