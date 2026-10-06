// Contract views return JSON strings. NoIfApology holds no money, so every
// number in a view is a small counter.
import type { Grievance, Standing } from "./types.ts";

function parseObject(raw: string): Record<string, unknown> | null {
  try {
    let value: unknown = JSON.parse(raw);
    if (typeof value === "string") value = JSON.parse(value);
    if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length === 0) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parseGrievance(raw: string): Grievance | null {
  const o = parseObject(raw);
  if (!o || typeof o.grievance_id !== "string" || !Array.isArray(o.answers) || typeof o.attempts !== "number") return null;
  return o as unknown as Grievance;
}

export function parseStanding(raw: string): Standing | null {
  const o = parseObject(raw);
  if (!o || typeof o.resolved_by_owning !== "number" || typeof o.closed_unanswered !== "number") return null;
  return o as unknown as Standing;
}

export type Limits = { rubric_hash?: string; contract_name?: string; version?: string; max_attempts?: number };

export function parseLimits(raw: string): Limits | null {
  return parseObject(raw) as Limits | null;
}
