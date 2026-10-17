# Runtime evidence — v2

**Status: deployment reported by owner; v2 application tests NOT RUN.**

Project address: [0x7079320d70566B02f208925C2aa366Eff870c567](https://explorer-studio.genlayer.com/address/0x7079320d70566B02f208925C2aa366Eff870c567).
An owner-supplied explorer screenshot dated 2026-10-17 shows deployment SUCCESS,
Return/null and Finalized. The full deployment transaction URL was not supplied.
This records screenshot evidence only: deployed-source correspondence, get_limits
version readback and live application behavior have not been independently verified.

Original user-supplied v1 evidence is preserved at `docs/history/v1-RUNTIME_EVIDENCE.md`
and the original screenshots remain in `docs/evidence/`. Those results exercise the
previous contract, including the former unsafe uncertainty fallback. They do not
validate this v2 revision.

Follow the important live cases in `TESTING.md`. Append actual observed outcomes,
including failures, to the table only after execution. Do not replace expected
results with a blanket PASS.

| Case | Source commit | Contract | Transaction | Finalized GenVM result | Consensus result | Before/after views | Observed outcome |
|---|---|---|---|---|---|---|---|
| Deployment | Not supplied | 0x7079320d70566B02f208925C2aa366Eff870c567 | Hash not supplied | SUCCESS in owner screenshot | Finalized in owner screenshot; validator details not inspected | Not collected | Reported deployment; independent verification pending |
| Semantic/safeguard tests | Not supplied | 0x7079320d70566B02f208925C2aa366Eff870c567 | Not run | Not observed | Not observed | Not collected | NOT RUN |

The read-only collector accepts CONTRACT RESPONDENT GRIEVANCE_ID [TX_HASH]:

```sh
node tools/collect-evidence.mjs "$CONTRACT" "$RESPONDENT" "$GRIEVANCE_ID"
node tools/collect-evidence.mjs "$CONTRACT" "$RESPONDENT" "$GRIEVANCE_ID" "$TX_HASH"
```

Run once before and once after each important transaction. It saves raw JSON under
docs/evidence/v2, including errors, finalized and accepted read requests, transaction
and receipt. It never sends a write or certifies a result. If finalized reads are
unsupported or lag, preserve that fact and obtain supported authoritative evidence.
The operator must confirm transaction target/input, finality, source and the exact
state changes. Sequential snapshots are not guaranteed to refer to a single block.

For resubmission, link the final reviewed Project commit and this revision's actual
submitted commit using an immutable compare URL: compare/BASE_SHA...HEAD_SHA.
The uploaded archive identifies 7b298cea2bd70dc86d23180888666e2e461a8b1c, but the
reviewed BASE has not been confirmed and the v2 HEAD does not exist until upload.
Do not use main or invent either SHA.
