# Runtime evidence — 2.0.0 counterexample and deployed 2.0.1 candidate

**Readiness: semantic retest pending. Version 2.0.1 is deployed and source verified; the 2.0.0 counterexample is not yet proven fixed.**

Live Project: https://explorer-studio.genlayer.com/address/0x7079320d70566B02f208925C2aa366Eff870c567

The live source matched the exact 2.0.0 file bytes, SHA-256
`53647f007c58545d0cfc8dc23adb7b0d5b562e85ad9133a0d7c2eb395b6ff69e`.
`get_limits` returned NoIfApology / 2.0.0, fail-safe INCONCLUSIVE, no attempt
consumption on uncertainty, and no custody. This does not attest to the candidate.
The source commit of the tested upload was not supplied. Do not invent it.

## New deployment, 2026-10-18

- Contract: https://explorer-studio.genlayer.com/address/0xBe58c1Cd9A9790F43F5084d8fd2d696139F8245B
- Deploy transaction: https://explorer-studio.genlayer.com/tx/0x9e63d346c84e30ddbe0a8af5799ecbff782b082e7c4a9e3d3df1d96927bd1400
- Independent transaction check: type 1 deploy, FINALIZED, MAJORITY_AGREE;
  leader execution SUCCESS, result tag 0.
- `get_limits`: NoIfApology 2.0.1, rubric hash `026676925bd6ec53a1acece549b9acc765dfb570e841bf9f0f966112c63781d5`.
- Exact source bytes matched candidate SHA-256 `4b02304dd91fdbd7dca2a13e9830937f3ec2d8ec2bfc37ef9c4f6fe494b7e51c`.
- B baseline: resolved_by_owning=0, closed_unanswered=0, disputed_records=0.
- New-deployment semantic tests: NOT RUN. Retest the exact counterexample first.
- Deployment source commit: upload HEAD not yet supplied; do not invent a SHA.

The following older records belong to 2.0.0 only.

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
Candidate 2.0.1 clarifies it. The new source and deployment were verified on 2026-10-18; live semantic evidence
is still required. A local mock passing does not repair the historical on-chain assessment.

## Exact records

- English / post-closure dispute: `93f33a8eab36d0f0548a4d5dfae2797451cd0e7fb8af7cccfa763436554ab303`
- Denial / FACTS / Vietnamese: `d54cc1407037f58df6f5e81887fa721985d1b9407524eb437deabeda60bf72a4`
- Injection / counterexample: `5f50d6518cf248429bb7c5eede47a6798f2bbf1e0f40b5b6e8fa12d33ae4827c`

Independently inspected transaction links:

- First denial: https://explorer-studio.genlayer.com/tx/0x311848c99cec1e844d2f9da4ccb1cf4fed342de1c6d86b21c644499e07679ed4
- Identical denial retry: https://explorer-studio.genlayer.com/tx/0x41f10e1ec367be4cfce9323e70301f0d95a74e5bf4c814cfa80b26055f825deb
- Creation of the third complaint: https://explorer-studio.genlayer.com/tx/0xcd97590d973fe4bb4b29cdb69206d5336f7c341757802f8f2a1be9b1dba5dba9

`docs/evidence/v2/runtime-summary.json` contains sanitized current readbacks and
these three transaction summaries. Later current state includes the subsequent
Vietnamese response; earlier OPEN/no-answer observations were collected before it.
Snapshots are sequential latest-finalized reads, not one block-pinned snapshot.

Malformed provider output, forced provider outage, live validator disagreement,
multiple filing-wallet behavior and candidate 2.0.1 semantics remain NOT RUN.
Disputes are objections, not independent arbitration; Sybil resistance is not claimed.

The read-only `tools/collect-evidence.mjs` whitelists public protocol fields and
records finalized-state read requests. It excludes node configuration and private
credentials. A stored error or snapshot is not automatically a passing test.

Historical v1 evidence remains under `docs/history/` and `docs/evidence/`.
For any required compare link, obtain the confirmed final-reviewed BASE and actual
uploaded HEAD. The old ZIP baseline `7b298cea2bd70dc86d23180888666e2e461a8b1c`
is not automatically the steward-reviewed BASE. Never use main or invented SHAs.
