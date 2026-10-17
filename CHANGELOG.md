# Changelog

## 2.0.0 — review revision, not deployed

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
