const freeze = (o) => Object.freeze(o);
const enumOf = (...keys) => freeze(Object.fromEntries(keys.map((k) => [k, k])));

export const TREATMENT_STATUS = enumOf(
  "DRAFT", "SUBMITTED", "IN_QC", "CORRECTION_REQUIRED", "RESUBMITTED", "APPROVED", "REJECTED"
);

/** Transitions autorisées du workflow Agent → CQ (source unique de vérité). */
export const STATUS_TRANSITIONS = freeze({
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["IN_QC"],
  IN_QC: ["CORRECTION_REQUIRED", "APPROVED", "REJECTED"],
  CORRECTION_REQUIRED: ["RESUBMITTED"],
  RESUBMITTED: ["IN_QC"],
  APPROVED: [],
  REJECTED: [],
});

export const canTransition = (from, to) => (STATUS_TRANSITIONS[from] ?? []).includes(to);

export const PRIORITY = enumOf("CRITICAL", "HIGH", "MEDIUM", "LOW");
/** Ordre d'affichage : plus petit = plus urgent. */
export const PRIORITY_RANK = freeze({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 });

export const ERROR_TYPE = enumOf(
  "REQUIRED_FIELD", "INVALID_FORMAT", "INVALID_VALUE", "BUSINESS_RULE", "DUPLICATE", "INCONSISTENCY"
);

export const ACTOR_TYPE = enumOf("AGENT", "QC", "ADMIN", "SYSTEM");

export const AUDIT_ACTION = enumOf(
  "CREATED", "SUBMITTED", "FIELD_UPDATED", "QC_REVIEW_STARTED", "COMMENT_ADDED",
  "CORRECTION_REQUESTED", "RESUBMITTED", "APPROVED", "REJECTED",
  "SUGGESTION_CREATED", "SUGGESTION_ACCEPTED", "SUGGESTION_MODIFIED", "SUGGESTION_REJECTED"
);
