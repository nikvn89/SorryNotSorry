// Postconditions checked AFTER the receipt says SUCCESS, against reloaded
// accepted state. A write is reported as done only when the state shows it.

import { pyStrip } from "./pytext.ts";
import type { Answer, Grievance, Standing } from "./types.ts";

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function fileVerified(g: Grievance | null, s: { id: string; me: string; respondent: string; complaint: string }): boolean {
  return !!g && g.grievance_id === s.id && same(g.complainant, s.me) && same(g.respondent, pyStrip(s.respondent)) &&
    g.complaint === pyStrip(s.complaint) && g.state === "OPEN" && g.attempts === 0 && g.answers.length === 0;
}

export type AnswerCheck = { ok: true; answer: Answer } | { ok: false };

/**
 * The new answer is the next one, with my text. OWNS_IT -> RESOLVED and attempts
 * unchanged; DEFLECTS -> attempts + 1, and CLOSED_UNANSWERED exactly when the cap
 * is reached. The respondent's standing moves with the closing state.
 */
export function answerVerified(
  before: { g: Grievance; standing: Standing | null },
  after: { g: Grievance | null; standing: Standing | null },
  text: string,
): AnswerCheck {
  const g = after.g;
  if (!g || g.answers.length !== before.g.answers.length + 1) return { ok: false };
  const a = g.answers[g.answers.length - 1];
  if (a.text !== pyStrip(text)) return { ok: false };
  const r0 = before.standing?.resolved_by_owning ?? 0;
  const c0 = before.standing?.closed_unanswered ?? 0;
  const r1 = after.standing?.resolved_by_owning ?? 0;
  const c1 = after.standing?.closed_unanswered ?? 0;
  if (a.outcome === "OWNS_IT") {
    const ok = g.state === "RESOLVED" && g.attempts === before.g.attempts && r1 === r0 + 1 && c1 === c0;
    return ok ? { ok: true, answer: a } : { ok: false };
  }
  if (a.outcome === "DEFLECTS") {
    const attempts = before.g.attempts + 1;
    const closes = attempts >= before.g.max_attempts;
    const ok = g.attempts === attempts && g.state === (closes ? "CLOSED_UNANSWERED" : "OPEN") &&
      r1 === r0 && c1 === c0 + (closes ? 1 : 0);
    return ok ? { ok: true, answer: a } : { ok: false };
  }
  return { ok: false };
}

export function withdrawVerified(g: Grievance | null): boolean {
  return !!g && g.state === "WITHDRAWN";
}
