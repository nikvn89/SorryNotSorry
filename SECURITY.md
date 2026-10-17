# Security and trust limits — v2

- Allegations are unverified, including after OWNS_IT or three DEFLECTS results.
  A semantic classification is about an answer, never proof of the underlying event.
- Only the named respondent may answer or dispute. Only the complainant can withdraw
  an OPEN thread. One OPEN thread per wallet pair and duplicate-text checks reduce
  accidental repetition; a person can bypass them with more wallets or paraphrases.
- There is no personhood, stake, filing fee, rate-limit clock or harassment adjudicator.
  Filing alone does not affect activity totals; it can still create public nuisance.
- Disputes remove records from aggregates and retain the original history. They are
  respondent assertions, not independent appeal results. A respondent can strategically
  exclude adverse records; even undisputed totals are unsuitable as reputation scores.
- A valid but incorrect semantic verdict can still close a thread. Deterministic
  dispute remains available after closure; there is no automatic reclassification.
- INCONCLUSIVE and catchable provider errors roll back before mutation. The same text
  can be retried. This protects against technical penalties but permits repeated
  sampling; three valid DEFLECTS outcomes still close the thread. No fixed retry cap
  can turn technical failure into a negative judgment.
- Independent validators must agree on the canonical label. Correlated model mistakes
  can reach consensus. Tag fencing and reserved-token checks reduce injection surface;
  they do not prove injection immunity. A factual denial should yield INCONCLUSIVE,
  but the actual model behavior requires live testing.
- The 120/160 byte budgets are UTF-8, not a promise of 120/160 Unicode characters.
  The frontend additionally measures the complete serialized calldata before signing.
- Missing consensus status, provisional leader output and receipt errors do not prove
  an applied semantic result. Accepted state is provisional until finalization.
  RPC failure can delay evidence; never invent a successful verdict from a timeout.
- No custody, native transfer, arbitrary external call, admin, web lookup or wall clock.
  React renders untrusted text as text rather than HTML.

For issues, provide the exact source commit, deployment address, transaction hash,
input, expected result and authoritative before/after readbacks. Never provide keys.
