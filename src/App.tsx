import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calldataBytes, CALLDATA_LIMIT } from "./lib/calldata";
import { CONTRACT_ADDRESS, EXPLORER_BASE, SOURCE_SHA256 } from "./lib/config";
import { errorMessage } from "./lib/errors";
import {
  connectedWallet, getGrievance, getLimits, getStanding, requestWallet, sendWrite, waitForVerdict,
} from "./lib/genlayer";
import { grievanceId, idsFromInput, short } from "./lib/ids";
import type { Limits } from "./lib/parse";
import { pyLen, pyStrip } from "./lib/pytext";
import {
  answerBlock, attemptLine, fileBlock, MAX_ANSWER_LENGTH, MAX_COMPLAINT_LENGTH, normalizeWallet, REVERTS, roleOf, stampOf, UI,
  withdrawBlock,
} from "./lib/rules";
import type { Grievance, Standing, TxStatus } from "./lib/types";
import { answerVerified, fileVerified, withdrawVerified } from "./lib/verify";

type Verify = () => Promise<string | null>;
type View = "overview" | "inbox" | "file" | "standing" | "verify";

const IDLE: TxStatus = { phase: "idle", message: "" };
const NAV: { id: View; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "inbox", label: "Inbox", icon: "✉" },
  { id: "file", label: "File a Grievance", icon: "✎" },
  { id: "standing", label: "Standing", icon: "◎" },
  { id: "verify", label: "Verification", icon: "</>" },
];
const STORE_KEY = "sorrynotsorry.grievances";

function idsFromUrl(): string[] {
  return idsFromInput(new URLSearchParams(window.location.search).get("g") ?? "");
}

function rememberedIds(): string[] {
  try {
    return idsFromInput(window.localStorage.getItem(STORE_KEY) ?? "");
  } catch {
    return [];
  }
}

function saveIds(ids: string[]) {
  try {
    window.localStorage.setItem(STORE_KEY, ids.join(","));
  } catch {
    /* storage unavailable: the URL still carries the inbox */
  }
  const url = new URL(window.location.href);
  if (ids.length) url.searchParams.set("g", ids.join(","));
  else url.searchParams.delete("g");
  window.history.replaceState(null, "", url.toString());
}

export default function App() {
  const fromUrl = idsFromUrl();
  const [view, setView] = useState<View>(fromUrl.length ? "inbox" : "overview");
  const [me, setMe] = useState("");
  const [ids, setIds] = useState<string[]>(fromUrl.length ? fromUrl : rememberedIds());
  const [items, setItems] = useState<Record<string, Grievance | null>>({});
  const [limits, setLimits] = useState<Limits | null>(null);
  const [addInput, setAddInput] = useState("");
  const [addError, setAddError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [respondent, setRespondent] = useState("");
  const [complaint, setComplaint] = useState("");
  const [taken, setTaken] = useState(false);

  const [lookup, setLookup] = useState("");
  const [standing, setStanding] = useState<Standing | null>(null);
  const [standingError, setStandingError] = useState("");

  const [status, setStatus] = useState<TxStatus>(IDLE);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const recheck = useRef<Verify | null>(null);

  // ---------- reads ----------
  const loadItems = useCallback(async (list: string[]) => {
    const entries = await Promise.all(list.map(async (id) => {
      try {
        return [id, await getGrievance(id)] as const;
      } catch {
        return [id, null] as const;
      }
    }));
    setItems((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }, []);

  useEffect(() => {
    connectedWallet().then(setMe).catch(() => setMe(""));
    window.ethereum?.on?.("accountsChanged", (accounts: string[]) => {
      setMe((accounts?.[0] ?? "").toLowerCase());
      recheck.current = null;
      setStatus(IDLE);
      setFresh(null);
    });
    getLimits().then(setLimits).catch(() => setLimits(null));
  }, []);

  useEffect(() => {
    saveIds(ids);
    void loadItems(ids);
  }, [ids, loadItems]);

  // ---------- derived ----------
  const respondentNorm = normalizeWallet(respondent);
  const newId = me && respondentNorm && pyLen(pyStrip(complaint)) > 0 ? grievanceId(me, respondentNorm, complaint) : "";
  useEffect(() => {
    let live = true;
    setTaken(false);
    if (!newId) return;
    const t = setTimeout(() => {
      getGrievance(newId).then((g) => live && setTaken(!!g)).catch(() => undefined);
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [newId]);
  // One open grievance per pair: known from any grievance already in this inbox.
  const openWithRespondent = !!me && !!respondentNorm && Object.values(items).some(
    (g) => !!g && g.state === "OPEN" && g.complainant === me.toLowerCase() && g.respondent === respondentNorm,
  );
  const fileBytes = useMemo(() => calldataBytes("file_grievance", [respondent, complaint]), [respondent, complaint]);
  const fileReason = fileBlock({ me, respondent, complaint, openWithRespondent, exists: taken, bytes: fileBytes });
  const inbox = ids.map((id) => [id, items[id]] as const);

  // ---------- writes ----------
  async function connect() {
    try {
      setMe(await requestWallet());
    } catch (e) {
      setStatus({ phase: "error", message: errorMessage(e) });
    }
  }

  async function runWrite(action: string, method: string, args: unknown[], verify: Verify) {
    setBusy(true);
    recheck.current = null;
    try {
      setStatus({ phase: "signing", message: "Confirm the transaction in your wallet…", action });
      const hash = await sendWrite(me, method, args, 0n);
      setStatus({ phase: "submitted", message: "Submitted. Waiting for validators to accept it…", hash, action });
      const verdict = await waitForVerdict(hash);
      if (verdict.kind === "error") {
        setStatus({ phase: "error", message: verdict.reason, hash, action });
        return;
      }
      if (verdict.kind === "pending") {
        recheck.current = verify;
        setStatus({ phase: "delayed", message: "Submitted — confirmation delayed. Check again re-reads the accepted state; do not send it twice.", hash, action });
        return;
      }
      setStatus({ phase: "checking", message: "Executed. Reading the accepted state…", hash, action });
      const done = await verify();
      if (done) {
        setStatus({ phase: "success", message: done, hash, action });
      } else {
        recheck.current = verify;
        setStatus({ phase: "delayed", message: "Executed, but the accepted state does not show the change yet. Check again in a moment.", hash, action });
      }
    } catch (e) {
      setStatus({ phase: "error", message: errorMessage(e), action });
    } finally {
      setBusy(false);
    }
  }

  async function checkAgain() {
    const verify = recheck.current;
    if (!verify) return;
    setBusy(true);
    try {
      const done = await verify();
      if (done) {
        recheck.current = null;
        setStatus((s) => ({ ...s, phase: "success", message: done }));
      } else {
        setStatus((s) => ({ ...s, message: "The accepted state does not show the change yet. Try again shortly." }));
      }
    } catch (e) {
      setStatus((s) => ({ ...s, message: errorMessage(e) }));
    } finally {
      setBusy(false);
    }
  }

  function addToInbox(list: string[]) {
    setIds((prev) => [...list.filter((id) => !prev.includes(id)), ...prev]);
  }

  async function onFile() {
    if (fileReason) return;
    const s = { id: grievanceId(me, respondentNorm, complaint), me, respondent: respondentNorm, complaint };
    if (await getGrievance(s.id)) {
      setTaken(true);
      return;
    }
    await runWrite("File", "file_grievance", [respondentNorm, pyStrip(complaint)], async () => {
      const g = await getGrievance(s.id);
      if (!fileVerified(g, s)) return null;
      setItems((prev) => ({ ...prev, [s.id]: g }));
      addToInbox([s.id]);
      setComplaint("");
      setFresh(s.id);
      setView("inbox");
      return "Grievance filed, and the accepted state shows it: open, 3 answers allowed. Copy the inbox link for the respondent.";
    });
  }

  async function onAnswer(g0: Grievance) {
    const text = drafts[g0.grievance_id] ?? "";
    // Probe the accepted state right before sending: the grievance may have closed meanwhile.
    const [g, st] = await Promise.all([getGrievance(g0.grievance_id), getStanding(g0.respondent)]);
    if (!g) return;
    setItems((prev) => ({ ...prev, [g.grievance_id]: g }));
    if (answerBlock(g, me, text, calldataBytes("answer", [g.grievance_id, text]))) return;
    const before = { g, standing: st };
    await runWrite("Answer", "answer", [g.grievance_id, pyStrip(text)], async () => {
      const [after, st2] = await Promise.all([getGrievance(g.grievance_id), getStanding(g.respondent)]);
      const check = answerVerified(before, { g: after, standing: st2 }, text);
      if (!check.ok) return null;
      setItems((prev) => ({ ...prev, [g.grievance_id]: after }));
      setDrafts((d) => ({ ...d, [g.grievance_id]: "" }));
      setFresh(g.grievance_id);
      if (check.answer.outcome === "OWNS_IT") return "Validators read it as OWNS_IT: the answer owns the conduct. The grievance is RESOLVED.";
      if (after!.state === "CLOSED_UNANSWERED") return "Validators read it as DEFLECTS. That was the third deflecting answer: the grievance is CLOSED_UNANSWERED and counts on the respondent's standing.";
      return `Validators read it as DEFLECTS: the grievance stays open. ${after!.attempts_left} answer${after!.attempts_left === 1 ? "" : "s"} left.`;
    });
  }

  async function onWithdraw(g0: Grievance) {
    const g = await getGrievance(g0.grievance_id);
    if (!g || withdrawBlock(g, me)) return;
    await runWrite("Withdraw", "withdraw_grievance", [g.grievance_id], async () => {
      const after = await getGrievance(g.grievance_id);
      if (!withdrawVerified(after)) return null;
      setItems((prev) => ({ ...prev, [g.grievance_id]: after }));
      return "Grievance withdrawn. It no longer counts for or against anyone.";
    });
  }

  async function onLookup(wallet?: string) {
    const w = normalizeWallet(wallet ?? lookup);
    if (!w) {
      setStandingError(REVERTS.invalidWallet);
      setStanding(null);
      return;
    }
    setStandingError("");
    try {
      setStanding(await getStanding(w));
    } catch (e) {
      setStandingError(errorMessage(e));
    }
  }

  function onAdd() {
    const found = idsFromInput(addInput);
    if (!found.length) {
      setAddError("Paste a 64-character grievance id, several ids, or a SorryNotSorry inbox link");
      return;
    }
    setAddError("");
    setAddInput("");
    addToInbox(found);
  }

  async function copyInbox() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus({ phase: "success", message: "Inbox link copied. It carries every grievance in this inbox.", action: "Share" });
    } catch {
      setStatus({ phase: "error", message: "Could not copy; copy the address bar instead.", action: "Share" });
    }
  }

  // ---------- one grievance thread ----------
  function Thread({ id, g }: { id: string; g: Grievance | null | undefined }) {
    if (g === undefined) return <article className="piece loading"><p className="muted mono">Reading {short(id, 8, 6)}…</p></article>;
    if (g === null) {
      return (
        <article className="piece missing">
          <p className="mono muted">{short(id, 10, 6)}</p>
          <p className="reason">{REVERTS.unknown}</p>
          <button className="btn btn-ghost" onClick={() => setIds((prev) => prev.filter((x) => x !== id))}>Remove</button>
        </article>
      );
    }
    const stamp = stampOf(g);
    const role = roleOf(g, me);
    const draft = drafts[id] ?? "";
    const bytes = calldataBytes("answer", [id, draft]);
    const aReason = answerBlock(g, me, draft, bytes);
    const wReason = withdrawBlock(g, me);
    return (
      <article className={`piece thread tone-${stamp.tone} ${fresh === id ? "fresh" : ""}`}>
        <div className="piece-top">
          <span className="kicker">
            FROM {short(g.complainant)}{role === "complainant" ? " · YOU" : ""} → TO {short(g.respondent)}{role === "respondent" ? " · YOU" : ""}
          </span>
          <span className={`stamp stamp-${stamp.tone}`}>{stamp.label}</span>
        </div>
        <h3 className="headline">{g.complaint}</h3>
        <div className="gauge">
          {Array.from({ length: g.max_attempts }, (_, i) => (
            <span key={i} className={`pip ${i < g.attempts ? "used" : ""}`} aria-hidden="true" />
          ))}
          <span className="gauge-line mono">{attemptLine(g)}</span>
        </div>
        <ol className="letters">
          {g.answers.length === 0 && <li className="letter empty muted">No answer yet.</li>}
          {g.answers.map((a) => (
            <li key={a.index} className={`letter ${a.outcome === "OWNS_IT" ? "owns" : "deflects"}`}>
              <div className="letter-head">
                <span className="mono muted">Answer {a.index}</span>
                <span className={`chip ${a.outcome === "OWNS_IT" ? "chip-owns" : "chip-deflects"}`}>{a.outcome}</span>
              </div>
              <p className="letter-text">{a.text}</p>
            </li>
          ))}
        </ol>
        {g.state === "OPEN" && (
          <div className="reply">
            <label className="fine" htmlFor={`ans-${id}`}>Answer as the named respondent</label>
            <textarea
              id={`ans-${id}`}
              rows={2}
              placeholder="Write the apology in your own words."
              value={draft}
              onChange={(e) => setDrafts((d) => ({ ...d, [id]: e.target.value }))}
              disabled={busy}
            />
            <div className="form-foot">
              <span className={`meter mono ${bytes > CALLDATA_LIMIT ? "over" : ""}`}>
                {pyLen(pyStrip(draft))} / {MAX_ANSWER_LENGTH} · {bytes} / {CALLDATA_LIMIT} bytes
              </span>
              <span className="action">
                {aReason && (draft || aReason !== REVERTS.answerEmpty) && <span className="reason">{aReason}</span>}
                <button className="btn btn-primary" onClick={() => onAnswer(g)} disabled={busy || !!aReason}>Answer</button>
              </span>
            </div>
          </div>
        )}
        <div className="piece-actions">
          {role === "complainant" && g.state === "OPEN" && (
            <span className="action">
              <button className="btn btn-ghost" onClick={() => onWithdraw(g)} disabled={busy || !!wReason}>Withdraw grievance</button>
            </span>
          )}
          <button className="btn btn-ghost small" onClick={() => { setLookup(g.respondent); setView("standing"); void onLookup(g.respondent); }}>
            Respondent's standing
          </button>
          <a className="link mono" href={`${window.location.origin}/?g=${g.grievance_id}`}>{short(g.grievance_id, 8, 6)}</a>
        </div>
      </article>
    );
  }

  // ---------- view ----------
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <img src="/logo-192.png" alt="" width={40} height={40} />
          <div>
            <div className="brand-name">Sorry<span>NotSorry</span></div>
            <div className="brand-sub">APOLOGIES THAT OWN IT</div>
          </div>
        </div>
        <div className="top-right">
          <div className="contract-chip">
            <span className="chip-tag">STUDIONET</span>
            <span className="dot" aria-hidden="true" />
            <div>
              <div className="chip-label">Contract</div>
              <div className="mono chip-value">{short(CONTRACT_ADDRESS, 6, 4)}</div>
            </div>
            <a className="chip-link" href={`${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" aria-label="Open contract in explorer">↗</a>
          </div>
          {me ? (
            <div className="wallet-chip mono" title={me}><span className="dot" aria-hidden="true" />{short(me)}</div>
          ) : (
            <button className="btn btn-connect" onClick={connect}>▣ Connect wallet</button>
          )}
        </div>
      </header>

      <div className="body">
        <nav className="sidebar" aria-label="Sections">
          {NAV.map((n) => (
            <button key={n.id} className={`nav ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
              <span className="nav-icon" aria-hidden="true">{n.icon}</span>
              {n.label}
              {view === n.id && <span className="nav-dot" aria-hidden="true" />}
            </button>
          ))}
          <div className="help">
            <p className="help-title">Need help?</p>
            <p>A grievance closes only when the named respondent owns what they did. Three answers that push it elsewhere close it unanswered.</p>
            <button className="btn btn-ghost wide" onClick={() => setView("overview")}>How it works</button>
          </div>
        </nav>

        <main className="main">
          <div className={`runtime runtime-${status.phase}`} aria-live="polite">
            <span className="dot" aria-hidden="true" />
            <span className="runtime-tag">{status.phase === "idle" ? "RUNTIME" : (status.action ?? "STATUS").toUpperCase()}</span>
            <span className="runtime-msg">
              {status.phase === "idle" ? "GenLayer StudioNet deployment loaded. Connect a wallet or open an inbox link." : status.message}
            </span>
            {status.hash && (
              <a className="mono runtime-link" href={`${EXPLORER_BASE}/tx/${status.hash}`} target="_blank" rel="noreferrer">tx {short(status.hash, 10, 8)}</a>
            )}
            {status.phase === "delayed" && recheck.current && (
              <button className="btn btn-ghost small" onClick={checkAgain} disabled={busy}>Check again</button>
            )}
          </div>

          {view === "overview" && (
            <>
              <section className="panel hero">
                <img className="hero-logo" src="/logo.png" alt="" width={120} height={120} />
                <div className="hero-text">
                  <p className="eyebrow">GENLAYER · STUDIONET</p>
                  <h1>Apologies that own it</h1>
                  <p className="hero-sub">"Sorry that you felt…" <em>does not close the complaint.</em></p>
                  <p className="hero-body">
                    SorryNotSorry does not decide who was right, and it does not judge whether an apology is warm enough. It asks
                    one thing: does the answer hold the speaker to account for what they did — and only such an answer closes
                    the complaint.
                  </p>
                  <div className="pills">
                    <span className="pill">✓ No verdict on who was right</span>
                    <span className="pill">✓ Three answers, then it closes</span>
                    <span className="pill">✓ Public standing</span>
                  </div>
                </div>
                <div className="contract-card">
                  <div className="cc-head"><span>Connected contract</span><span className="ready">Ready</span></div>
                  <p className="mono cc-addr">{CONTRACT_ADDRESS}</p>
                  <div className="cc-foot">
                    <span><span className="dot" aria-hidden="true" /> StudioNet · 61999</span>
                    <a href={`${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">View on Explorer ↗</a>
                  </div>
                </div>
              </section>

              <section className="panel steps">
                {[
                  ["1", "File a grievance", "Name the wallet and say what they did, in one line."],
                  ["2", "The respondent answers", "Validators read each answer once against the complaint."],
                  ["3", "Owned or closed", "Owning it resolves the grievance; three deflections close it unanswered."],
                ].map(([n, t, d], i) => (
                  <div className="step" key={n}>
                    <span className="step-n">{n}</span>
                    <div><p className="step-t">{t}</p><p className="step-d">{d}</p></div>
                    {i < 2 && <span className="step-arrow" aria-hidden="true">›</span>}
                  </div>
                ))}
              </section>

              <section className="cards">
                <div className="panel card">
                  <p className="eyebrow muted">OWNS_IT</p>
                  <h2>"I'm sorry that my comment was rude."</h2>
                  <p>The speaker takes the conduct as their own. The grievance is resolved for good and counts on their standing as owned.</p>
                  <div className="tags"><span className="tag tag-within">RESOLVED</span></div>
                </div>
                <div className="panel card">
                  <p className="eyebrow muted">DEFLECTS</p>
                  <h2>"I'm sorry that you felt my comment was rude."</h2>
                  <p>Two words turn the fault into the listener's feelings. The grievance stays open and one of three answers is used.</p>
                  <div className="tags"><span className="tag tag-over">OPEN · attempt used</span></div>
                </div>
                <div className="panel card">
                  <p className="eyebrow muted">STANDING</p>
                  <h2>A public record per wallet.</h2>
                  <p>Grievances resolved by owning and grievances closed unanswered are counted for every respondent. Unclear readings count as deflecting.</p>
                  <div className="tags"><span className="tag">CLOSED_UNANSWERED</span><span className="tag tag-void">WITHDRAWN</span></div>
                </div>
              </section>
            </>
          )}

          {view === "inbox" && (
            <>
              <section className="panel section-head">
                <div>
                  <p className="eyebrow">INBOX</p>
                  <h1>Grievances in this inbox</h1>
                  <p className="muted">Each grievance is a thread: the complaint on top, every answer below with how validators read it.</p>
                </div>
                <button className="btn btn-ghost" onClick={copyInbox} disabled={!ids.length}>Copy inbox link</button>
              </section>
              <form className="adder" onSubmit={(e) => { e.preventDefault(); onAdd(); }}>
                <input aria-label="Grievance ids or link" placeholder="Paste grievance ids or a SorryNotSorry link" value={addInput} onChange={(e) => setAddInput(e.target.value)} spellCheck={false} />
                <button className="btn btn-primary" type="submit">Add</button>
              </form>
              {addError && <p className="reason">{addError}</p>}
              {inbox.length === 0 && <section className="panel empty"><p className="muted">No grievances yet. File one, or paste a link someone shared.</p></section>}
              <div className="board">
                {inbox.map(([id, g]) => <Thread key={id} id={id} g={g} />)}
              </div>
            </>
          )}

          {view === "file" && (
            <section className="panel form">
              <p className="eyebrow">FILE A GRIEVANCE</p>
              <h1>Name a wallet and what they did</h1>
              <p className="muted">One line about the conduct. The named wallet gets up to three answers; you may withdraw while it is open.</p>
              <label htmlFor="resp">Respondent wallet</label>
              <input id="resp" className="mono" placeholder="0x…" value={respondent} onChange={(e) => setRespondent(e.target.value)} spellCheck={false} />
              <label htmlFor="complaint">Complaint</label>
              <textarea id="complaint" rows={2} placeholder="What they did, in one line." value={complaint} onChange={(e) => setComplaint(e.target.value)} />
              <span className="fine">{pyLen(pyStrip(complaint))} / {MAX_COMPLAINT_LENGTH} characters</span>
              <div className="form-foot">
                <span className={`meter mono ${fileBytes > CALLDATA_LIMIT ? "over" : ""}`}>{fileBytes} / {CALLDATA_LIMIT} bytes</span>
                <span className="action">
                  {(respondent || complaint) && fileReason && <span className="reason">{fileReason}</span>}
                  <button className="btn btn-primary" onClick={onFile} disabled={busy || !!fileReason}>File grievance</button>
                </span>
              </div>
              {newId && <p className="fine mono">Grievance id: {newId}</p>}
            </section>
          )}

          {view === "standing" && (
            <section className="panel form">
              <p className="eyebrow">STANDING</p>
              <h1>A wallet's record</h1>
              <p className="muted">How often a wallet closed a grievance by owning it, and how often one closed with three answers that did not.</p>
              <div className="row">
                <input className="mono" aria-label="Wallet" placeholder="0x…" value={lookup} onChange={(e) => setLookup(e.target.value)} spellCheck={false} />
                <button className="btn btn-primary" onClick={() => onLookup()}>Look up</button>
                {me && <button className="btn btn-ghost" onClick={() => { setLookup(me); void onLookup(me); }}>Mine</button>}
              </div>
              {standingError && <p className="reason">{standingError}</p>}
              {standing && (
                <div className="standing">
                  <p className="mono muted">{standing.wallet}</p>
                  <div className="standing-grid">
                    <div className="stat stat-owns"><span className="stat-n">{standing.resolved_by_owning}</span><span>resolved by owning</span></div>
                    <div className="stat stat-closed"><span className="stat-n">{standing.closed_unanswered}</span><span>closed unanswered</span></div>
                  </div>
                </div>
              )}
              {!me && <p className="fine">{UI.noWallet} to see your own standing quickly.</p>}
            </section>
          )}

          {view === "verify" && (
            <section className="panel form">
              <p className="eyebrow">VERIFICATION</p>
              <h1>What you are talking to</h1>
              <dl className="facts">
                <div><dt>Contract</dt><dd className="mono"><a href={`${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">{CONTRACT_ADDRESS}</a></dd></div>
                <div><dt>Source SHA-256</dt><dd className="mono">{SOURCE_SHA256}</dd></div>
                <div><dt>Contract name · version</dt><dd className="mono">{limits ? `${limits.contract_name ?? "?"} · ${limits.version ?? "?"}` : "reading…"}</dd></div>
                <div><dt>Rubric hash (from get_limits)</dt><dd className="mono">{limits?.rubric_hash ?? "reading…"}</dd></div>
                <div><dt>Answers per grievance</dt><dd className="mono">{limits?.max_attempts ?? "reading…"}</dd></div>
              </dl>
              <p className="muted">
                Every revert the app can predict disables the button and shows the contract's own sentence. Whether an answer
                owns the conduct is decided only by validators inside answer(); the app reads each outcome back from the contract.
                No money is held.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
