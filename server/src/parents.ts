import type { DbData, ParentAccount, Student } from './types.js';
import { normalizePhone } from './scope.js';

export function listParentAccounts(db: DbData, districtId?: string): ParentAccount[] {
  const hints = db.parentPinHints || {};
  const map = new Map<string, ParentAccount>();

  const students = districtId
    ? db.students.filter((s) => !s.districtId || s.districtId === districtId)
    : db.students;

  for (const s of students) {
    const phoneNorm = normalizePhone(s.parentPhone);
    if (phoneNorm.length < 9) continue;

    const circleNames = s.circleIds
      .map((id) => db.circles.find((c) => c.id === id)?.name)
      .filter(Boolean) as string[];

    const child = {
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      school: s.school,
      grade: s.grade,
      circleNames,
      status: s.status,
    };

    const existing = map.get(phoneNorm);
    if (existing) {
      existing.children.push(child);
      if (s.parentName && s.parentName.length > existing.parentName.length) {
        existing.parentName = s.parentName;
      }
    } else {
      map.set(phoneNorm, {
        id: `parent-${phoneNorm}`,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        phoneNorm,
        pin: hints[phoneNorm],
        hasPin: !!(db.parentPins && db.parentPins[phoneNorm]),
        districtId: s.districtId,
        children: [child],
      });
    }
  }

  return [...map.values()].sort((a, b) =>
    a.parentName.localeCompare(b.parentName, 'uz') || a.parentPhone.localeCompare(b.parentPhone)
  );
}

export function setParentPinHint(db: DbData, phoneNorm: string, pin: string) {
  if (!db.parentPinHints) db.parentPinHints = {};
  db.parentPinHints[phoneNorm] = pin;
}

export function saveParentPin(db: DbData, phoneNorm: string, pin: string, hash: string) {
  if (!db.parentPins) db.parentPins = {};
  db.parentPins[phoneNorm] = hash;
  setParentPinHint(db, phoneNorm, pin);
}
