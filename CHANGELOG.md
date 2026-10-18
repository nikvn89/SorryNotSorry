# Changelog

## 2.0.1 — deployed and core regressions observed 2026-10-18

- Frontend hotfix: share the compatibility check between the ready indicator and the fresh pre-signing read; remove the stale 2.0.0 signing requirement. Add real sendWrite regression tests using stubbed dependencies. Contract source and deployment are unchanged.

- Clarify that admitting an act is not accepting accountability. Explicit blame or refusal of responsibility remains DEFLECTS even with an admission; factual denials remain INCONCLUSIVE.
- No keyword classifier, forced verdict or new privileged method was added.
- Frontend writes require version 2.0.1; the configured address is the independently verified new Project instance.
- Verify the new deployment finality, version and exact source.
- Preserve the failed live counterexample and successful safeguards in runtime evidence. Record the new exact-counterexample/paraphrase DEFLECTS run, denial rollback, positive OWNS_IT and post-closure dispute. Extended hosted fault scenarios remain untested.
- Evidence collector stores whitelisted public protocol fields rather than node configuration.

## 2.0.0 — deployed; live semantic counterexample found

- Inconclusive and technical model failures no longer become DEFLECTS or consume
  attempts. Strict output structure; identical input remains retryable.
- Rubric separates factual denials and ambiguity from valid deflection judgments.
- Respondent can dispute facts/assessment in all states; visible objections exclude
  records from aggregates without rewriting original answers or judgments.
- Allegations and activity views explicitly disclose unverified facts, selective
  dispute exclusions and the lack of Sybil resistance. No reputation-score claim.
- Complaint/answer limits enforce 120/160 UTF-8 bytes; UI measures full calldata.
- UI gates writes on version 2.0.0, binds signing to the selected wallet, persists
  pending transactions, and rechecks consensus before state confirmation.
- Historical v1 evidence is separated from current v2 readiness. Obsolete duplicate
  specs, mutation scripts and rubric gates were removed; current regressions remain.

Requires a new instance; do not upgrade v1 storage. Prior v1 submissions and live
transactions remain historical evidence only.
