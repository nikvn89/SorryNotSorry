// Mirrors every revert of contracts/NoIfApology.py that can be predicted from
// state already read, in the SAME order the contract checks them. Whether an
// answer owns the conduct is NEVER decided here: only validators decide that,
// inside answer(). The outcome of each answer is read back from the view.

import { pyContainsToken, pyLen, pyNormalize, pyStrip } from "./pytext.ts";
import type { Grievance } from "./types.ts";

export const MAX_COMPLAINT_LENGTH = 120;
export const MAX_ANSWER_LENGTH = 200;

export const RESERVED_TOKENS = [
  "<UNTRUSTED_COMPLAINT>",
  "</UNTRUSTED_COMPLAINT>",
  "<UNTRUSTED_ANSWER>",
  "</UNTRUSTED_ANSWER>",
  "OWNS_IT",
  "DEFLECTS",
] as const;

export const REVERTS = {
  invalidWallet: "Invalid wallet address",
  self: "You cannot file a grievance against yourself",
  complaintEmpty: "Complaint is empty",
  complaintTooLong: "Complaint is too long",
  reserved: "Text contains a reserved token",
  openPair: "You already have an open grievance against this wallet",
  duplicate: "This grievance already exists",
  unknown: "Unknown grievance id",
  notOpen: "This grievance is no longer open",
  onlyRespondent: "Only the named respondent may answer this grievance",
  answerEmpty: "Answer is empty",
  answerTooLong: "Answer is too long",
  repeated: "This answer was already given",
  onlyComplainant: "Only the complainant may withdraw this grievance",
} as const;

/** UI-only reasons (the contract never sees these calls). */
export const UI = {
  noWallet: "Connect a wallet first",
  tooManyBytes: "This text is over the 255-byte calldata limit; shorten it",
} as const;

const ZERO = "0x0000000000000000000000000000000000000000";
const same = (a: string, b: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

/** The contract's _normalize_wallet: "" when invalid. */
export function normalizeWallet(value: string): string {
  const w = pyStrip(value).toLowerCase();
  if (w.length !== 42 || !w.startsWith("0x") || !/^[0-9a-f]{40}$/.test(w.slice(2)) || w === ZERO) return "";
  return w;
}

export type FileInput = { me: string; respondent: string; complaint: string; openWithRespondent: boolean; exists: boolean; bytes: number };

/** file_grievance order: wallet -> not yourself -> complaint -> reserved -> one open per pair -> duplicate. */
export function fileBlock(i: FileInput): string | null {
  if (!i.me) return UI.noWallet;
  const r = normalizeWallet(i.respondent);
  if (!r) return REVERTS.invalidWallet;
  if (same(r, i.me)) return REVERTS.self;
  const c = pyStrip(i.complaint);
  if (pyLen(c) === 0) return REVERTS.complaintEmpty;
  if (pyLen(c) > MAX_COMPLAINT_LENGTH) return REVERTS.complaintTooLong;
  if (pyContainsToken(c, RESERVED_TOKENS)) return REVERTS.reserved;
  if (i.openWithRespondent) return REVERTS.openPair;
  if (i.exists) return REVERTS.duplicate;
  if (i.bytes > 255) return UI.tooManyBytes;
  return null;
}

/** True when this exact answer (whitespace-normalized) was already given on this grievance. */
export function alreadyGiven(g: Grievance, text: string): boolean {
  const n = pyNormalize(pyStrip(text));
  return g.answers.some((a) => pyNormalize(a.text) === n);
}

/** answer order: OPEN -> respondent -> text -> reserved -> not given before. */
export function answerBlock(g: Grievance, me: string, text: string, bytes: number): string | null {
  if (!me) return UI.noWallet;
  if (g.state !== "OPEN") return REVERTS.notOpen;
  if (!same(g.respondent, me)) return REVERTS.onlyRespondent;
  const t = pyStrip(text);
  if (pyLen(t) === 0) return REVERTS.answerEmpty;
  if (pyLen(t) > MAX_ANSWER_LENGTH) return REVERTS.answerTooLong;
  if (pyContainsToken(t, RESERVED_TOKENS)) return REVERTS.reserved;
  if (alreadyGiven(g, t)) return REVERTS.repeated;
  if (bytes > 255) return UI.tooManyBytes;
  return null;
}

/** withdraw order: OPEN -> complainant. */
export function withdrawBlock(g: Grievance, me: string): string | null {
  if (!me) return UI.noWallet;
  if (g.state !== "OPEN") return REVERTS.notOpen;
  if (!same(g.complainant, me)) return REVERTS.onlyComplainant;
  return null;
}

export type Role = "complainant" | "respondent" | "reader";

export function roleOf(g: Grievance, me: string): Role {
  if (same(g.complainant, me)) return "complainant";
  if (same(g.respondent, me)) return "respondent";
  return "reader";
}

export type Stamp = { label: string; tone: "resolved" | "closed" | "withdrawn" | "open" };

/** The stamp and the attempt gauge, straight from the view's own fields. */
export function stampOf(g: Grievance): Stamp {
  switch (g.state) {
    case "RESOLVED": return { label: "RESOLVED", tone: "resolved" };
    case "CLOSED_UNANSWERED": return { label: "CLOSED_UNANSWERED", tone: "closed" };
    case "WITHDRAWN": return { label: "WITHDRAWN", tone: "withdrawn" };
    default: return { label: "OPEN", tone: "open" };
  }
}

export function attemptLine(g: Grievance): string {
  if (g.state === "OPEN") return `Attempt ${g.attempts + 1} of ${g.max_attempts} next · ${g.attempts_left} left`;
  return `${g.attempts} of ${g.max_attempts} deflecting answers used`;
}
