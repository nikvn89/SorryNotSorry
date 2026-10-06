# Changelog

## 1.0.1 — 2026-10-06

- Fix: the answer box kept focus for one keystroke only. Each thread is now rendered by a function instead of a
  component declared inside `App`, so typing an answer works character by character (pasting already worked). A test in
  `tests/js/static.test.ts` keeps it that way. No contract or deployment change.

## 1.0.0 — 2026-10-06

- Contract `NoIfApology` (frozen, SHA-256 `4184c9e8…de321503f`) deployed for this Project at
  `0xF4Ca99437E1c3D8c7e72c722067d91D2760c0898` (StudioNet). The Intelligent Contract submission is a separate deployment
  of the same source.
- App: overview, an inbox of grievance threads (complaint, each answer with its OWNS_IT / DEFLECTS chip, an attempt gauge,
  the RESOLVED or CLOSED_UNANSWERED stamp), a file form showing the grievance id before signing, a standing lookup, and a
  verification page reading `get_limits`.
- Run through the app on StudioNet (8 transactions, `RUNTIME_EVIDENCE.md`): DEFLECTS then OWNS_IT on one grievance; three deflections closed a second one unanswered.
- Tests: 47 Direct Mode contract tests, 19/19 mutants, frontend tests, calldata table and RPC probe, source hash; CI.
