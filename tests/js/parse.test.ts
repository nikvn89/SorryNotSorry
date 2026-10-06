import { test } from "node:test";
import assert from "node:assert/strict";
import { parseGrievance, parseLimits, parseStanding } from "../../src/lib/parse.ts";

const G = '{"grievance_id": "3b4a", "complainant": "0xa", "respondent": "0xb", "complaint": "C", "state": "OPEN", "attempts": 1, "attempts_left": 2, "max_attempts": 3, "answers": [{"index": 1, "text": "t", "outcome": "DEFLECTS"}]}';

test("views are parsed as JSON once, or twice when the RPC double-encodes them", () => {
  assert.equal(parseGrievance(G)?.answers[0].outcome, "DEFLECTS");
  assert.equal(parseGrievance(JSON.stringify(G))?.attempts_left, 2);
  assert.equal(parseStanding('{"wallet": "0xb", "resolved_by_owning": 3, "closed_unanswered": 1}')?.closed_unanswered, 1);
  assert.equal(parseLimits('{"rubric_hash": "ab", "max_attempts": 3}')?.max_attempts, 3);
});

test("unknown id, broken JSON or a wrong shape read as nothing", () => {
  assert.equal(parseGrievance("{}"), null);
  assert.equal(parseGrievance("not json"), null);
  assert.equal(parseGrievance(G.replace('"answers": [', '"replies": [')), null);
  assert.equal(parseStanding('{"resolved_by_owning": "3", "closed_unanswered": 1}'), null);
});
