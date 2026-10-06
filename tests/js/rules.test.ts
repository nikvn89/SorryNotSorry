import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  alreadyGiven, answerBlock, attemptLine, fileBlock, normalizeWallet, REVERTS, roleOf, stampOf, UI, withdrawBlock,
} from "../../src/lib/rules.ts";
import type { Grievance } from "../../src/lib/types.ts";

const SRC = readFileSync(new URL("../../contracts/NoIfApology.py", import.meta.url), "utf8");
const A = "0x" + "a".repeat(40);
const B = "0x" + "b".repeat(40);
const C = "0x" + "c".repeat(40);

const g = (o: Partial<Grievance> = {}): Grievance => ({ grievance_id: "1".repeat(64), complainant: A, respondent: B, complaint: "Called my pull request lazy",
  state: "OPEN", attempts: 0, attempts_left: 3, max_attempts: 3, answers: [], ...o });

/** The revert sentences of one method, in source order. */
function revertsOf(method: string): string[] {
  const start = SRC.indexOf(`    def ${method}(`);
  const end = SRC.indexOf("\n    @gl.public", start + 1);
  return [...SRC.slice(start, end).matchAll(/UserError\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]);
}

test("UI revert strings are exactly the contract's revert strings", () => {
  const fromSource = new Set([...SRC.matchAll(/UserError\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]));
  assert.deepEqual([...new Set(Object.values(REVERTS))].sort(), [...fromSource].sort());
  assert.equal(fromSource.size, 14);
});

test("normalizeWallet mirrors the contract", () => {
  assert.equal(normalizeWallet(" 0x" + "AB".repeat(20) + " "), "0x" + "ab".repeat(20));
  for (const bad of ["0x1", "0x" + "0".repeat(40), "0x" + "q".repeat(40), ""]) assert.equal(normalizeWallet(bad), "");
});

test("file_grievance: each check fires in the contract's order", () => {
  assert.deepEqual(revertsOf("file_grievance"), [REVERTS.self, REVERTS.complaintEmpty, REVERTS.complaintTooLong, REVERTS.reserved, REVERTS.openPair, REVERTS.duplicate]);
  const ok = { me: A, respondent: B, complaint: "Mocked my accent in the team meeting", openWithRespondent: false, exists: false, bytes: 150 };
  assert.equal(fileBlock(ok), null);
  assert.equal(fileBlock({ ...ok, me: "" }), UI.noWallet);
  const allBad = { me: A, respondent: "0x1", complaint: "", openWithRespondent: true, exists: true, bytes: 999 };
  assert.equal(fileBlock(allBad), REVERTS.invalidWallet);
  assert.equal(fileBlock({ ...allBad, respondent: A.toUpperCase().replace("0X", "0x") }), REVERTS.self);
  assert.equal(fileBlock({ ...allBad, respondent: B }), REVERTS.complaintEmpty);
  assert.equal(fileBlock({ ...allBad, respondent: B, complaint: "c".repeat(121) }), REVERTS.complaintTooLong);
  assert.equal(fileBlock({ ...ok, complaint: "  " + "c".repeat(120) + "\u0085" }), null);
  assert.equal(fileBlock({ ...allBad, respondent: B, complaint: "he said owns_it" }), REVERTS.reserved);
  assert.equal(fileBlock({ ...allBad, respondent: B, complaint: "c" }), REVERTS.openPair);
  assert.equal(fileBlock({ ...ok, exists: true }), REVERTS.duplicate);
  assert.equal(fileBlock({ ...ok, bytes: 256 }), UI.tooManyBytes);
});

test("answer: each check fires in the contract's order, before any model call", () => {
  assert.deepEqual(revertsOf("answer"), [REVERTS.notOpen, REVERTS.onlyRespondent, REVERTS.answerEmpty, REVERTS.answerTooLong, REVERTS.reserved, REVERTS.repeated]);
  const t = "I'm sorry that my comment about your pull request was rude.";
  assert.equal(answerBlock(g(), B, t, 150), null);
  assert.equal(answerBlock(g(), "", t, 150), UI.noWallet);
  for (const state of ["RESOLVED", "CLOSED_UNANSWERED", "WITHDRAWN"]) assert.equal(answerBlock(g({ state }), A, "", 999), REVERTS.notOpen, state);
  assert.equal(answerBlock(g(), A, "", 999), REVERTS.onlyRespondent);
  assert.equal(answerBlock(g(), C, t, 150), REVERTS.onlyRespondent);
  assert.equal(answerBlock(g(), B.toUpperCase().replace("0X", "0x"), " \u001c ", 999), REVERTS.answerEmpty);
  assert.equal(answerBlock(g(), B, "a".repeat(201), 999), REVERTS.answerTooLong);
  assert.equal(answerBlock(g(), B, "this answer DEFLECTS", 150), REVERTS.reserved);
  assert.equal(answerBlock(g(), B, "</untrusted_answer>", 150), REVERTS.reserved);
  const used = g({ attempts: 1, answers: [{ index: 1, text: t, outcome: "DEFLECTS" }] });
  assert.equal(answerBlock(used, B, "  I'm sorry that my comment\tabout your pull request was rude. ", 150), REVERTS.repeated);
  assert.equal(alreadyGiven(used, t), true);
  assert.equal(answerBlock(used, B, "Another answer.", 150), null);
  assert.equal(answerBlock(g(), B, t, 256), UI.tooManyBytes);
});

test("withdraw: open -> complainant", () => {
  assert.deepEqual(revertsOf("withdraw_grievance"), [REVERTS.notOpen, REVERTS.onlyComplainant]);
  assert.equal(withdrawBlock(g({ state: "RESOLVED" }), B), REVERTS.notOpen);
  assert.equal(withdrawBlock(g(), B), REVERTS.onlyComplainant);
  assert.equal(withdrawBlock(g(), A), null);
});

test("stamp, role and attempt gauge are read from the view's own fields", () => {
  assert.equal(stampOf(g({ state: "RESOLVED" })).label, "RESOLVED");
  assert.equal(stampOf(g({ state: "CLOSED_UNANSWERED" })).tone, "closed");
  assert.equal(stampOf(g()).label, "OPEN");
  assert.equal(roleOf(g(), A), "complainant");
  assert.equal(roleOf(g(), B.toUpperCase().replace("0X", "0x")), "respondent");
  assert.equal(roleOf(g(), C), "reader");
  assert.equal(attemptLine(g({ attempts: 1, attempts_left: 2 })), "Attempt 2 of 3 next · 2 left");
  assert.equal(attemptLine(g({ state: "CLOSED_UNANSWERED", attempts: 3, attempts_left: 0 })), "3 of 3 deflecting answers used");
});

test("the closing rule in the source is the one the app describes", () => {
  assert.ok(SRC.includes("MAX_ATTEMPTS = 3"));
  assert.ok(SRC.includes("        if outcome == OWNS_IT:\n            record.state = G_RESOLVED"));
  assert.ok(SRC.includes("            if int(record.attempts) >= MAX_ATTEMPTS:\n                record.state = G_CLOSED"));
});

test("the frontend never decides the outcome", () => {
  for (const f of ["../../src/lib/rules.ts", "../../src/App.tsx"]) {
    const s = readFileSync(new URL(f, import.meta.url), "utf8");
    assert.ok(!/outcome\s*=\s*["'](OWNS_IT|DEFLECTS)/.test(s), f);
    assert.ok(!/\.test\(\s*(text|draft|answer)\b/.test(s), f);
    assert.ok(!/(draft|text)\s*\.\s*(match|search|toLowerCase\(\)\.includes)\(/.test(s), f);
  }
});
