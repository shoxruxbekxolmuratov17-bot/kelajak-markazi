/**
 * Entity-level repository — prefers targeted writes over full-blob mutate.
 * Multi-entity flows (enrollment) use `transaction` intentionally.
 */
import { dbBackend, loadDb, mutate, persistPayment, saveDb } from '../db.js';
import type { DbData } from '../types.js';
import { DEFAULT_DISTRICT_ID, DEFAULT_REGION_ID, type Circle, type Message, type Payment, type Student } from '../types.js';

export const repo = {
  backend: () => dbBackend(),

  getPayments: () => loadDb().payments,
  getStudents: () => loadDb().students,
  getCircles: () => loadDb().circles,
  getMessages: () => loadDb().messages,

  /** Atomic multi-entity update (enrollment, approve, bulk). */
  transaction<T>(fn: (db: DbData) => T): T {
    let result!: T;
    mutate((db) => {
      result = fn(db);
    });
    return result;
  },

  upsertPayment(pay: Payment) {
    persistPayment(pay);
    return pay;
  },

  upsertStudent(student: Student) {
    mutate((db) => {
      const i = db.students.findIndex((s) => s.id === student.id);
      if (i >= 0) db.students[i] = student;
      else db.students.push(student);
    });
    return student;
  },

  deleteStudent(id: string) {
    mutate((db) => {
      db.students = db.students.filter((s) => s.id !== id);
      db.payments = db.payments.filter((p) => p.studentId !== id);
    });
  },

  upsertCircle(circle: Circle) {
    mutate((db) => {
      const i = db.circles.findIndex((c) => c.id === circle.id);
      if (i >= 0) db.circles[i] = circle;
      else db.circles.push(circle);
    });
    return circle;
  },

  deleteCircle(id: string) {
    mutate((db) => {
      db.circles = db.circles.filter((c) => c.id !== id);
    });
  },

  upsertMessage(msg: Message) {
    mutate((db) => {
      const i = db.messages.findIndex((m) => m.id === msg.id);
      if (i >= 0) db.messages[i] = msg;
      else db.messages.unshift(msg);
    });
    return msg;
  },

  /** Replace full snapshot (seed / admin import). */
  replaceAll(data: Parameters<typeof saveDb>[0]) {
    saveDb({
      ...data,
      districts: data.districts?.length
        ? data.districts
        : [{ id: DEFAULT_DISTRICT_ID, name: 'Qamashi tumani', region: 'Qashqadaryo viloyati', code: 'qamashi', regionId: DEFAULT_REGION_ID }],
    });
  },
};
