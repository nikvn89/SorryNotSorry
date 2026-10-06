# TEST_PLAN

## Cases (each pair shares its surface and carries opposite labels)

| Case | Answer (to "Called my pull request lazy in the public channel") | Expected |
|---|---|---|
| O1 | I'm sorry that my comment about your pull request was rude. | OWNS_IT |
| O2 | Calling your work lazy in front of everyone was wrong, and I apologise. | OWNS_IT |
| O3 | I should not have posted that; I'll say so in the same channel. | OWNS_IT |
| O4 | That remark was mine and it was unfair to you. Sorry. | OWNS_IT |
| O5 | No excuse from me: I was rude about your pull request. | OWNS_IT |
| D1 | I'm sorry that you felt my comment about your pull request was rude. | DEFLECTS |
| D2 | I apologise if anyone took the word lazy the wrong way. | DEFLECTS |
| D3 | I should not have to explain a joke, but sorry it upset you. | DEFLECTS |
| D4 | Sorry, though people in that channel are used to blunt remarks. | DEFLECTS |
| D5 | Mistakes were made in the channel and I regret how it went. | DEFLECTS |

- **Kill tests:** O1/D1 (two words apart), O3/D3, O2/D2, O5/D5 — the rubric does not hint at the mechanism.
- **Definition check:** O4/D4.
- `NOIFAPOLOGY_KILLSET_CHECK.py` proves no word or word pair separates the classes, and that the rubric shares no content
  word with any case.

## Deterministic behaviour → test (`tests/contract/test_noifapology.py`, Direct Mode, model mocked)

| Behaviour | Test |
|---|---|
| The tooth: one grievance, deflect then own | `test_tooth_same_grievance_deflect_then_own` |
| Three deflections close it unanswered | `test_three_deflects_close_unanswered` |
| Owning it on the third attempt still resolves | `test_owning_on_the_third_attempt_still_resolves` |
| Closing frees the pair for a new grievance | `test_closing_frees_the_pair_for_a_new_grievance` |
| Standing counts only the respondent's outcomes; withdrawal leaves it untouched | `test_standing_counts_only_respondent_outcomes`, `test_withdrawn_grievance_does_not_touch_standing` |
| Only the named respondent answers; the complainant cannot | `test_complainant_cannot_answer_own_grievance`, `test_third_wallet_is_refused_by_every_write` |
| The same answer cannot be resent (whitespace variants included) | `test_whitespace_variant_of_an_answer_is_the_same_answer`, `test_same_answer_allowed_on_another_grievance` |
| Fail-safe on broken, unknown or non-object output | `test_fail_safe_on_unparseable_output`, `test_fail_safe_on_unknown_label`, `test_fail_safe_on_non_object_json` |
| Validator function | `test_validator_rejects_disagreement_and_bad_shapes`, `test_validator_accepts_matching_owns_it` |
| Prompt never sees wallets or state; fence is a fixed point | `test_prompt_never_sees_wallets_or_state`, `test_fence_strip_is_fixed_point` |
| Ids and wallets | `test_whitespace_variants_share_one_grievance_id`, `test_respondent_wallet_case_is_normalized`, `test_same_complaint_from_another_complainant_is_another_grievance` |
| Every revert string has a dedicated test; check order | `test_every_revert_string_has_exactly_one_dedicated_test`, `test_check_order_state_before_caller`, `test_check_order_caller_before_input` |
| The planned on-chain table, replayed in order | `test_runtime_table_in_order` |
| Grievance ids shared with the frontend | `test_vectors_match_contract` |

Frontend (`tests/js/*.test.ts`): Python-string parity, grievance ids against the contract vectors, view parsing, every
revert sentence equal to the source and fired in the source's order (including the repeated-answer check), the closing
rule as written in the source, postconditions for every write, receipt classification, calldata sizes, source hash,
repository rules.
