# SECURITY

## No money

The contract holds no GEN and moves none. Every write sends value 0.

## Where the central rule lives

Whether an answer owns the conduct is decided only by validators inside `answer`. What follows is deterministic in the
contract: OWNS_IT resolves the grievance; DEFLECTS uses one of three attempts, and the third closes it as
CLOSED_UNANSWERED; the respondent's standing counts both endings. The app never decides the outcome and never screens
answer text: it reads `state`, `attempts` and each answer's `outcome` back from `get_grievance` (checked by
`tests/js/rules.test.ts`).

## Fail-safe

Unusable or unclear output reads DEFLECTS: the grievance stays open and the respondent can answer more plainly.

## Prompt fence

The complaint and the answer sit inside `<UNTRUSTED_COMPLAINT>` and `<UNTRUSTED_ANSWER>` tags. The four tags and both
labels are refused in any letter case on input and stripped to a fixed point inside the prompt. The model sees no
wallet, attempt count or state.

## Grinding

At most three answers per grievance, and the same answer (whitespace-normalized) cannot be given twice, so a respondent
cannot resend one sentence until a reading suits them. One open grievance per complainant–respondent pair.

## Frontend

- No MetaMask Snap: the app switches the network with `wallet_switchEthereumChain` / `wallet_addEthereumChain`.
- One same-origin RPC proxy (`/genlayer-rpc`, in `vite.config.ts` and `vercel.json`) for reads, receipts and writes.
- A write is reported only after the leader receipt says SUCCESS **and** consensus has reached ACCEPTED, and only after
  the reloaded state shows the change; otherwise "confirmation delayed" with a Check again button that re-reads state.
- Every revert predictable from state disables the button with the contract's own sentence.
- Contract text is rendered as React text; no raw HTML. The inbox of grievance ids is kept in the URL and, when the
  browser allows it, in local storage — nothing else is stored.

## Remaining limits

See "Honest limitation" in the README.
