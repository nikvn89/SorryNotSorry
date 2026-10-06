// Shapes of the contract's JSON views.

export type Answer = {
  index: number;
  text: string;
  outcome: "OWNS_IT" | "DEFLECTS" | string;
};

export type Grievance = {
  grievance_id: string;
  complainant: string;
  respondent: string;
  complaint: string;
  state: "OPEN" | "RESOLVED" | "CLOSED_UNANSWERED" | "WITHDRAWN" | string;
  attempts: number;
  attempts_left: number;
  max_attempts: number;
  answers: Answer[];
};

export type Standing = {
  wallet: string;
  resolved_by_owning: number;
  closed_unanswered: number;
};

export type TxPhase = "idle" | "checking" | "signing" | "submitted" | "delayed" | "success" | "error";

export type TxStatus = {
  phase: TxPhase;
  message: string;
  hash?: string;
  action?: string;
};
