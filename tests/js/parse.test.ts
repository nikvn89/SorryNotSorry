import { test } from "node:test";
import assert from "node:assert/strict";
import { compatibleContract, CONTRACT_VERSION, parseGrievance, parseLimits, parseStanding } from "../../src/lib/parse.ts";
import * as parsedViews from "../../src/lib/parse.ts";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

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

test("ready and signing compatibility accepts 2.0.1 and rejects old or missing contracts", () => {
  assert.equal(CONTRACT_VERSION, "2.0.1");
  assert.equal(compatibleContract({ contract_name: "NoIfApology", version: "2.0.1" }), true);
  for (const limits of [null, undefined, {}, { contract_name: "NoIfApology", version: "2.0.0" },
    { contract_name: "OtherContract", version: "2.0.1" }]) {
    assert.equal(compatibleContract(limits), false);
  }
});

// Execute the real sendWrite function with SDK and wallet dependencies stubbed.
// No network request or real signature is made. This catches a stale version
// check in the signing path even when the ready indicator accepts the new version.
function signingHarness(version: string) {
  const account = "0x" + "1".repeat(40);
  let writes = 0;
  const requests: string[] = [];
  const client = {
    readContract: async () => JSON.stringify({ contract_name: "NoIfApology", version }),
    writeContract: async () => { writes++; return "0x" + "2".repeat(64); },
  };
  const dependencies: Record<string, unknown> = {
    "genlayer-js": { createClient: () => client },
    "genlayer-js/chains": { studionet: {} },
    "./config": { CONTRACT_ADDRESS: "0x" + "3".repeat(40), RPC_PATH: "/genlayer-rpc",
      STUDIONET_CHAIN_ID: 61999, STUDIONET_CHAIN_HEX: "0xf22f" },
    "./receipt": {},
    "./parse": parsedViews,
    "./calldata": { calldataBytes: () => 100, CALLDATA_LIMIT: 255 },
  };
  const source = readFileSync(new URL("../../src/lib/genlayer.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const exported: Record<string, any> = {};
  runInNewContext(compiled, {
    exports: exported,
    require: (name: string) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    window: { location: { origin: "https://example.test" }, ethereum: {
      request: async ({ method }: { method: string }) => {
        requests.push(method);
        if (method === "eth_chainId") return "0xf22f";
        if (method === "eth_accounts") return [account];
        throw new Error(`Unexpected wallet request: ${method}`);
      },
    } },
  });
  return { send: () => exported.sendWrite(account, "file_grievance", []),
    writes: () => writes, requests };
}

test("real signing path reaches the wallet/SDK for a fresh 2.0.1 contract read", async () => {
  const harness = signingHarness("2.0.1");
  assert.equal(await harness.send(), "0x" + "2".repeat(64));
  assert.equal(harness.writes(), 1);
  assert.deepEqual(harness.requests, ["eth_chainId", "eth_accounts"]);
});

test("real signing path rejects a fresh old-version read before requesting the wallet", async () => {
  const harness = signingHarness("2.0.0");
  await assert.rejects(harness.send(), /NoIfApology v2\.0\.1/);
  assert.equal(harness.writes(), 0);
  assert.deepEqual(harness.requests, []);
});
