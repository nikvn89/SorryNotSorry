import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { grievanceId, idsFromInput } from "../../src/lib/ids.ts";
import { pyLen, pyNormalize, pyStrip } from "../../src/lib/pytext.ts";

const v = JSON.parse(readFileSync(new URL("./id-vectors.json", import.meta.url), "utf8"));

test("grievance ids match the contract, including whitespace edge cases", () => {
  assert.ok(v.grievances.length >= 7);
  for (const row of v.grievances) {
    assert.equal(pyNormalize(pyStrip(row.complaint)), row.normalized);
    assert.equal(pyLen(row.normalized), row.py_len);
    assert.equal(grievanceId(v.complainant, v.respondent, row.complaint), row.grievance_id, JSON.stringify(row.complaint));
    assert.equal(grievanceId(v.complainant.toUpperCase().replace("0X", "0x"), v.respondent.toUpperCase().replace("0X", "0x"), row.complaint), row.grievance_id);
  }
});

test("the grievances of the on-chain run are reproduced from the two wallets", () => {
  const A = "0x6276095FAEA15108740445ff277fdA8c304657F4", B = "0xAD05365aFe0C2450d4FFBcdbE555b6E5fB7Dfa35";
  assert.equal(grievanceId(A, B, "Called my pull request lazy in the public channel"), "3b4ae82aba3e9a12db3d369906071fdd574a7d979856f713b302278d0969b27a");
  assert.equal(grievanceId(A, B, "Took credit for my slides in the review"), "1ec8626846744824baa6c5a12d7c2e8828a21f8ac73f366108ab8035fbe112e7");
});

test("ids are found in a bare id, a 0x id, a link or a list, without duplicates", () => {
  const a = "3b4ae82aba3e9a12db3d369906071fdd574a7d979856f713b302278d0969b27a";
  const b = "1ec8626846744824baa6c5a12d7c2e8828a21f8ac73f366108ab8035fbe112e7";
  assert.deepEqual(idsFromInput(a), [a]);
  assert.deepEqual(idsFromInput("0x" + a.toUpperCase()), [a]);
  assert.deepEqual(idsFromInput(`https://x.app/?g=${a},${b}`), [a, b]);
  assert.deepEqual(idsFromInput(`${a} ${a}`), [a]);
  assert.deepEqual(idsFromInput(a + "ab"), []);
});
