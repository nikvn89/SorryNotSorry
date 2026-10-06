import { keccak256, stringToBytes } from "viem";
import { pyLen, pyNormalize, pyStrip } from "./pytext.ts";

// Keccak-256 (Ethereum), not NIST SHA3-256. Same payload as the contract:
// keccak256("NO_IF_APOLOGY:GRIEVANCE:V1|" + complainant_lower + "|" + respondent_lower + "|" + len(c) + "|" + c),
// with the complaint stripped and its whitespace collapsed exactly like Python.
export function grievanceId(complainant: string, respondent: string, complaint: string): string {
  const c = pyNormalize(pyStrip(complaint));
  const payload = "NO_IF_APOLOGY:GRIEVANCE:V1|" + complainant.toLowerCase() + "|" + pyStrip(respondent).toLowerCase() + "|" + String(pyLen(c)) + "|" + c;
  return keccak256(stringToBytes(payload)).slice(2);
}

/** Every 64-hex id found in a bare id, a 0x id, a link or a comma list. */
export function idsFromInput(value: string): string[] {
  const out: string[] = [];
  for (const m of value.matchAll(/(?<![0-9a-fA-F])([0-9a-fA-F]{64})(?![0-9a-fA-F])/g)) {
    const id = m[1].toLowerCase();
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

export function short(value: string, head = 6, tail = 4): string {
  if (!value || value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}
