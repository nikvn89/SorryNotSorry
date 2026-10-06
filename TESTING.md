# TESTING

```
COMPILE PASS ≠ RUNTIME PASS
SUBMITTED ≠ ACCEPTED ≠ FINALIZED ≠ EXECUTION SUCCESS ≠ POSTCONDITION PASS
```

## Automated gates (run before release; CI runs them on every push)

| Gate | Command | Result |
|---|---|---|
| Kill-set + rubric gate | `python3 NOIFAPOLOGY_KILLSET_CHECK.py contracts/NoIfApology.py` | rc 0 — no word or word pair separates the classes; the rubric shares no content word with any case |
| genvm-linter | `python3 -m genvm_linter.cli lint contracts/NoIfApology.py` | pass |
| Contract tests (Direct Mode: the real py-genlayer v0.2.16 SDK, model mocked) | `python3 -m pytest tests/contract -q -p no:cacheprovider` | 47 passed |
| Mutation check | `python3 tools/mutate.py .` | 19/19 deliberate faults caught |
| Frontend build | `npm run build` | rc 0 |
| Frontend tests | `npm test` | 49 passed |
| Source hash | `npm run verify:source` | `contracts/NoIfApology.py` matches `SOURCE_SHA256.txt` |
| Calldata table | `node tools/calldata-bytes.mjs` | every write ≤ 255 bytes (largest case 165) |
| Calldata on the RPC | `node tools/probe-calldata.mjs <address>` | runs in CI against both addresses in `deployments.json` |

The mocked model labels drive the deterministic code paths; they say nothing about what the real model returns. The
on-chain runs do.

### What the mutation check catches

Each fault is applied to the contract alone and the suite must go red (`tests/mutations.py`): owning not resolving, a
deflection not spending an attempt, the attempt cap off by one, the standing not written on closing, the pair lock missing
or not freed on resolving, anyone allowed to answer or to withdraw, the same answer accepted twice (also through a
whitespace variant), the fail-safe flipped, an unknown label read as OWNS_IT, the validator accepting any label, the
reserved-token check dropped, a single-pass fence, a wallet leaking into the prompt, the state checked after the caller,
the id ignoring whitespace normalization, and the complaint length cap off by one.

### Calldata

Encoded exactly as genlayer-js 1.1.8 `writeContract` does. Answers in the case set measure 147–165 bytes. The longest
ASCII answer that fits is **161 characters**; the contract accepts 200, which measures 296 bytes and is refused by the
RPC. The answer box shows a live byte meter and disables Answer above 255 bytes.

## Frontend checks

- **Revert sentences** (`tests/js/rules.test.ts`): the set in `src/lib/rules.ts` equals the 14 sentences in the source,
  and for `file_grievance`, `answer` and `withdraw_grievance` the UI reports the earliest failing check in the source's
  order — including a repeated answer, compared with Python whitespace rules against the answers already on the thread.
- **Grievance ids** (`tests/js/ids.test.ts`, `tests/js/ids-html.test.ts`): viem Keccak-256 and Python whitespace rules;
  equal to vectors produced by the contract on the real SDK and to the grievances of the on-chain run.
- **Postconditions** (`tests/js/verify.test.ts`): an answer is reported only when the reloaded thread carries it as the next
  answer with this text, the state and attempt count moved exactly as the outcome says, and the respondent's standing
  moved with it.
- **Receipts** (`tests/js/receipt.test.ts`): a leader SUCCESS while validators are still proposing, committing or
  revealing is pending, not success.
- **Interface check** (Playwright against `vite preview`, the RPC mocked by decoding calldata): overview, an inbox as
  respondent and as complainant, a repeated answer, a resolved and a closed-unanswered thread, standing, the file form
  with an open pair and with the complainant's own wallet, and 390 px — no page error, no horizontal scroll.

## On-chain runs

See `RUNTIME_EVIDENCE.md`: the Intelligent Contract run (15 transactions, every must-verify row PASS) and the Project run
through this app.

## Consensus behaviour

The model is called once per answer. Validators re-run the reading and must agree on the exact label; a disagreement
rotates the leader or ends the transaction without recording the answer. `file_grievance` and `withdraw_grievance` are
deterministic.

## What this run does NOT prove

- Each case is sent once; label stability across repeated runs or validator sets is not measured.
- O2, O4, O5 are tested offline only.
- Answers longer than about 161 characters are not sent.
- The "one open grievance per pair" check is predicted only from grievances already in the app's inbox; a grievance the
  app has not seen is caught by the contract instead.
- Prompt-injection resistance rests on the fence and the reserved-token check; no adversarial model run is done.
