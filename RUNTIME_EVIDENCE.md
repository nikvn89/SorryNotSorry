# Runtime evidence — SorryNotSorry 2.0.1

Core live regressions were observed on 2026-10-18. Extended hosted fault coverage
is incomplete; this report does not certify all requested live fault scenarios.
No result from the historical 2.0.0 run is counted as a 2.0.1 pass.

## Current deployment

- Contract: https://explorer-studio.genlayer.com/address/0xBe58c1Cd9A9790F43F5084d8fd2d696139F8245B
- Deploy: https://explorer-studio.genlayer.com/tx/0x9e63d346c84e30ddbe0a8af5799ecbff782b082e7c4a9e3d3df1d96927bd1400
- Independently checked: FINALIZED, MAJORITY_AGREE, leader execution SUCCESS.
- `get_limits`: NoIfApology 2.0.1; rubric hash `026676925bd6ec53a1acece549b9acc765dfb570e841bf9f0f966112c63781d5`.
- Exact deployed source SHA-256: `4b02304dd91fdbd7dca2a13e9830937f3ec2d8ec2bfc37ef9c4f6fe494b7e51c`.
- Uploaded source commit has not been supplied. Do not invent a SHA or a compare BASE.

## Current run — 2026-10-18

Wallets A and B are listed in the historical section below and were reused.
All allegations remained UNVERIFIED.

| Case | Observed state / aggregate change | Verification scope |
|---|---|---|
| Exact failed counterexample, then English and Vietnamese equivalents | Three DEFLECTS, OPEN/1 then OPEN/2 then CLOSED_UNANSWERED/3; closed_unanswered 0 to 1 | Screenshots, finalized reads after each answer; full third-answer receipt checked |
| Factual denial | INCONCLUSIVE, no answer stored, attempts 0, three left, OPEN; totals unchanged | Screenshot, finalized read before ownership; full denial receipt checked |
| Clear acceptance without an apology word | OWNS_IT, RESOLVED; exactly one answer, resolved_by_owning 0 to 1 | Screenshot, finalized read, full ownership receipt checked |
| ASSESSMENT objection on three-DEFLECTS closure | Original CLOSED_UNANSWERED and all three answers preserved, excluded=true; closed_unanswered 1 to 0, disputed_records 0 to 1; ownership total stays 1 | Screenshot and finalized reads; dispute receipt hash not supplied |

Grievance IDs:

- Three DEFLECTS / ASSESSMENT: `5f50d6518cf248429bb7c5eede47a6798f2bbf1e0f40b5b6e8fa12d33ae4827c`
- Denial then ownership: `35391022f104167d03caca3e2b7107e1121a2bf95296325be08ddb244952482e`

Independently inspected current transaction links:

- Third DEFLECTS: https://explorer-studio.genlayer.com/tx/0xec8840bfb05280789f3dd6821b0a73efaf5c4bb725c8e1a8d962aefd8b4feeed
- Denial: https://explorer-studio.genlayer.com/tx/0x017d72525c6c28d9e99168459cafa18c8268513e7fbe878af4e426ac981937a6
- Ownership: https://explorer-studio.genlayer.com/tx/0xa9059310af0f7a2544d1de4b1f316256fb40efb232186506d707059dc076ead6

All three are FINALIZED / MAJORITY_AGREE. The third DEFLECTS and ownership
transactions have leader execution SUCCESS. The denial has execution ERROR with
result tag 1 and `Assessment inconclusive; no attempt consumed; retry or dispute`.
Its canonical model outcome is INCONCLUSIVE; the rollback is intentional.
Decoded calldata matches the exact tested answer and grievance in each receipt.
The JSON evidence preserves the earlier OPEN/no-answer read before ownership,
the closure before dispute, and the final disputed read. Final activity totals:
resolved_by_owning=1, closed_unanswered=0, disputed_records=1.

The first two DEFLECTS, creation and dispute full transaction hashes were not
supplied. Their screenshots/readbacks do not constitute individually inspected
receipts. Snapshots are latest-finalized reads at different times, not one
block-pinned snapshot. One favorable run is not a guarantee of semantic quality.

## Historical deployment — 2.0.0

Contract: https://explorer-studio.genlayer.com/address/0x7079320d70566B02f208925C2aa366Eff870c567
Exact source SHA-256: `53647f007c58545d0cfc8dc23adb7b0d5b562e85ad9133a0d7c2eb395b6ff69e`.
The original semantic failure remains FAILED.

## Actual observations, 2026-10-17

A: `0x6276095FAEA15108740445ff277fdA8c304657F4`
B: `0x037f58E33c1Ec8fdA272361E0aAC1e31054a1CDE`
All allegations were fictional test inputs and remained UNVERIFIED.

| Case | Observed result | Evidence scope |
|---|---|---|
| English acceptance | OWNS_IT, RESOLVED, one stored answer; B ownership total 0 to 1 | User screenshots and independent finalized-state reads; answer transaction hash not supplied |
| ASSESSMENT dispute after closure | Original history/state preserved, excluded=true, ownership total 1 to 0, disputed count 0 to 1 | Screenshots and finalized-state reads; dispute transaction hash not supplied |
| Factual denial, twice with identical text | Both transactions FINALIZED / MAJORITY_AGREE; GenVM ERROR tag 1 with explicit assessment-inconclusive UserError. No answer/attempt stored; thread OPEN, three attempts left | Both full receipts independently checked, followed by state reads |
| FACTS dispute while OPEN | Excluded=true, state OPEN; disputed count 1 to 2 | Screenshot and finalized-state reads; full dispute hash not supplied |
| Vietnamese acceptance after the denials | OWNS_IT, RESOLVED, exactly one Vietnamese answer; FACTS retained; no aggregate increment | Screenshot and finalized-state read; full answer hash not supplied |
| Instruction-only injection | UI showed INCONCLUSIVE, OPEN, no answer and three attempts left before the next response | Screenshot and contemporaneous finalized-state read; full answer hash not supplied. Not claimed as independently verified consensus evidence |
| Admission plus explicit blame | **FAILED**: expected DEFLECTS, actual OWNS_IT and RESOLVED; one stored answer, attempts 0, undisputed ownership total increased to 1 | User screenshot and independently read finalized contract state; full answer hash not supplied |
| Three-DEFLECTS closure | NOT REACHED in this run because the first intended DEFLECTS was classified OWNS_IT | Do not count as a pass |

The counterexample answer was:

> Yes, I mocked your presentation, but you deserved it. I did nothing wrong.

The model treated admission as ownership despite explicit refusal of accountability.
The current rubric was too underspecified to rely on the expected distinction.
Version 2.0.1 clarifies it. The exact counterexample and its two paraphrases returned DEFLECTS in the new run recorded above. This does not change the historical assessment or guarantee future classifications.

## Exact records

- English / post-closure dispute: `93f33a8eab36d0f0548a4d5dfae2797451cd0e7fb8af7cccfa763436554ab303`
- Denial / FACTS / Vietnamese: `d54cc1407037f58df6f5e81887fa721985d1b9407524eb437deabeda60bf72a4`
- Injection / counterexample: `5f50d6518cf248429bb7c5eede47a6798f2bbf1e0f40b5b6e8fa12d33ae4827c`

Independently inspected transaction links:

- First denial: https://explorer-studio.genlayer.com/tx/0x311848c99cec1e844d2f9da4ccb1cf4fed342de1c6d86b21c644499e07679ed4
- Identical denial retry: https://explorer-studio.genlayer.com/tx/0x41f10e1ec367be4cfce9323e70301f0d95a74e5bf4c814cfa80b26055f825deb
- Creation of the third complaint: https://explorer-studio.genlayer.com/tx/0xcd97590d973fe4bb4b29cdb69206d5336f7c341757802f8f2a1be9b1dba5dba9

The historical root of `docs/evidence/v2/runtime-summary.json` contains sanitized 2.0.0 readbacks and
these three transaction summaries. The `live_2_0_1` section holds the new run. Later current state includes the subsequent
Vietnamese response; earlier OPEN/no-answer observations were collected before it.
Snapshots are sequential latest-finalized reads, not one block-pinned snapshot.

Malformed provider output, forced provider outage, live validator disagreement,
and multiple filing-wallet behavior remain NOT RUN on 2.0.1. Separate positive Vietnamese ownership, injection and repeated inconclusive responses are also not rerun on 2.0.1.
Disputes are objections, not independent arbitration; Sybil resistance is not claimed.

The read-only `tools/collect-evidence.mjs` whitelists public protocol fields and
records finalized-state read requests. It excludes node configuration and private
credentials. A stored error or snapshot is not automatically a passing test.

Historical v1 evidence remains under `docs/history/` and `docs/evidence/`.
For any required compare link, obtain the confirmed final-reviewed BASE and actual
uploaded HEAD. The old ZIP baseline `7b298cea2bd70dc86d23180888666e2e461a8b1c`
is not automatically the steward-reviewed BASE. Never use main or invented SHAs.
