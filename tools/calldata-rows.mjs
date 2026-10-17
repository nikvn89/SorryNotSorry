// Shared rows for tools/calldata-bytes.mjs, tools/probe-calldata.mjs and tests.
export const ID = "f".repeat(64);
export const WALLET = "0x" + "1".repeat(40);

export const CASES = {
  O1: "I'm sorry that my comment about your pull request was rude.",
  O2: "Calling your work lazy in front of everyone was wrong, and I apologise.",
  O3: "I should not have posted that; I'll say so in the same channel.",
  O4: "That remark was mine and it was unfair to you. Sorry.",
  O5: "No excuse from me: I was rude about your pull request.",
  D1: "I'm sorry that you felt my comment about your pull request was rude.",
  D2: "I apologise if anyone took the word lazy the wrong way.",
  D3: "I should not have to explain a joke, but sorry it upset you.",
  D4: "Sorry, though people in that channel are used to blunt remarks.",
  D5: "Mistakes were made in the channel and I regret how it went.",
};

/** HARD BLOCK: any of these over 255 bytes stops the release. */
export function hardBlockRows() {
  const rows = Object.entries(CASES).map(([name, text]) => ({ name: `answer ${name}`, method: "answer", args: [ID, text] }));
  rows.push({ name: "file_grievance (wallet + 120-char complaint)", method: "file_grievance", args: [WALLET, "c".repeat(120)] });
  rows.push({ name: "withdraw_grievance (id)", method: "withdraw_grievance", args: [ID] });
  rows.push({ name: "answer at 160 UTF-8 bytes", method: "answer", args: [ID, "x".repeat(160)] });
  rows.push({ name: "answer multilingual at 160 bytes", method: "answer", args: [ID, "é".repeat(80)] });
  rows.push({ name: "dispute assessment", method: "dispute_grievance", args: [ID, "ASSESSMENT"] });
  return rows;
}

/** Transport counterexample: rejected by the v2 contract and frontend. */
export function measureOnlyRows() {
  return [{ name: "rejected 200-byte answer", method: "answer", args: [ID, "x".repeat(200)] }];
}
