import { test } from "node:test";
import assert from "node:assert/strict";
import { answerVerified, fileVerified, withdrawVerified } from "../../src/lib/verify.ts";
import type { Grievance, Standing } from "../../src/lib/types.ts";

const A = "0x" + "a".repeat(40);
const B = "0x" + "b".repeat(40);
const T = "I'm sorry that my comment about your pull request was rude.";
const g = (o: Partial<Grievance> = {}): Grievance => ({ grievance_id: "1".repeat(64), complainant: A, respondent: B, complaint: "Called my pull request lazy",
  state: "OPEN", attempts: 0, attempts_left: 3, max_attempts: 3, answers: [], ...o });
const st = (r: number, c: number): Standing => ({ wallet: B, resolved_by_owning: r, closed_unanswered: c });
const ans = (n: number, text: string, outcome: string) => ({ index: n, text, outcome });

test("file: the stored grievance names me, the respondent and the stripped complaint", () => {
  const s = { id: "1".repeat(64), me: A.toUpperCase().replace("0X", "0x"), respondent: " " + B + " ", complaint: " Called my pull request lazy " };
  assert.equal(fileVerified(g(), s), true);
  assert.equal(fileVerified(g({ attempts: 1 }), s), false);
  assert.equal(fileVerified(null, s), false);
});

test("OWNS_IT: resolved, attempts unchanged, standing +1 owned", () => {
  const before = { g: g(), standing: st(0, 0) };
  assert.equal(answerVerified(before, { g: g({ state: "RESOLVED", attempts_left: 0, answers: [ans(1, T, "OWNS_IT")] }), standing: st(1, 0) }, " " + T).ok, true);
  assert.equal(answerVerified(before, { g: g({ state: "RESOLVED", answers: [ans(1, T, "OWNS_IT")] }), standing: st(0, 0) }, T).ok, false);
  assert.equal(answerVerified(before, { g: g({ state: "OPEN", answers: [ans(1, T, "OWNS_IT")] }), standing: st(1, 0) }, T).ok, false);
});

test("DEFLECTS: one attempt used, still open, standing untouched", () => {
  const before = { g: g(), standing: st(0, 0) };
  assert.equal(answerVerified(before, { g: g({ attempts: 1, attempts_left: 2, answers: [ans(1, T, "DEFLECTS")] }), standing: st(0, 0) }, T).ok, true);
  assert.equal(answerVerified(before, { g: g({ attempts: 0, answers: [ans(1, T, "DEFLECTS")] }), standing: st(0, 0) }, T).ok, false);
});

test("the third DEFLECTS closes the grievance unanswered and counts it", () => {
  const prev = [ans(1, "a", "DEFLECTS"), ans(2, "b", "DEFLECTS")];
  const before = { g: g({ attempts: 2, attempts_left: 1, answers: prev }), standing: st(2, 0) };
  const after = g({ state: "CLOSED_UNANSWERED", attempts: 3, attempts_left: 0, answers: [...prev, ans(3, T, "DEFLECTS")] });
  assert.equal(answerVerified(before, { g: after, standing: st(2, 1) }, T).ok, true);
  assert.equal(answerVerified(before, { g: { ...after, state: "OPEN" }, standing: st(2, 1) }, T).ok, false);
  assert.equal(answerVerified(before, { g: after, standing: st(2, 0) }, T).ok, false);
});

test("an answer that is not mine, not new, or has an unknown outcome is not reported", () => {
  const before = { g: g(), standing: st(0, 0) };
  assert.equal(answerVerified(before, { g: g({ attempts: 1, answers: [ans(1, "other", "DEFLECTS")] }), standing: st(0, 0) }, T).ok, false);
  assert.equal(answerVerified(before, { g: g(), standing: st(0, 0) }, T).ok, false);
  assert.equal(answerVerified(before, { g: g({ attempts: 1, answers: [ans(1, T, "MAYBE")] }), standing: st(0, 0) }, T).ok, false);
});

test("withdraw is confirmed by the WITHDRAWN state", () => {
  assert.equal(withdrawVerified(g({ state: "WITHDRAWN" })), true);
  assert.equal(withdrawVerified(g()), false);
});
