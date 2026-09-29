import { ACTOR_TYPE, AUDIT_ACTION as A, TREATMENT_STATUS as S, canTransition } from "../constants/index.js";
import { EDITABLE_FIELDS } from "../config/fields.js";
import { diffValues } from "../diff/diffEngine.js";
import { runRules } from "../rules/index.js";
import { normalizeValues } from "../utils/normalize.js";
import { toKV, fromKV } from "../utils/kv.js";

export class DomainError extends Error {
  constructor(status, code, message, details) { super(message); this.status = status; this.code = code; this.details = details; }
}

/** Statuts dans lesquels l'agent peut encore modifier les données. */
const AGENT_EDITABLE = [S.DRAFT, S.CORRECTION_REQUIRED];

const summarize = (errors) => ({
  count: errors.length,
  byPriority: errors.reduce((acc, e) => ({ ...acc, [e.priority]: (acc[e.priority] ?? 0) + 1 }), {}),
});

/**
 * POST /data/sync : crée ou met à jour un traitement (identifié par sourceRow), versionne, audite, valide.
 * Tout se passe dans une transaction : traitement + version + audit + résultat de validation.
 * Idempotence : même Idempotency-Key => même réponse, sans nouvelle écriture.
 * Une soumission (submit=true) est refusée (422) si des règles échouent, comme le fait déjà le formulaire ;
 * un brouillon (submit=false) est toujours accepté et ses erreurs sont enregistrées.
 */
export async function syncTreatment(repos, { sourceRow, values, submit = false, actor, idempotencyKey, now = () => new Date() }) {
  if (idempotencyKey) {
    const previous = await repos.idempotency.get(idempotencyKey);
    if (previous) return { ...previous, replayed: true };
  }
  const unknown = Object.keys(values).filter((k) => !EDITABLE_FIELDS.includes(k));
  if (unknown.length) throw new DomainError(400, "UNKNOWN_FIELD", `Champs inconnus : ${unknown.join(", ")}`, unknown);

  const incoming = normalizeValues(values);
  const at = now();
  const who = { actorId: actor?.actorId ?? "anonymous", actorType: actor?.actorType ?? ACTOR_TYPE.AGENT };

  return repos.withTransaction(async () => {
    const existing = await repos.treatments.findByRow(sourceRow);
    if (existing && !AGENT_EDITABLE.includes(existing.status))
      throw new DomainError(409, "NOT_EDITABLE", `Traitement non modifiable au statut ${existing.status}`);

    const before = existing ? fromKV(existing.currentData) : {};
    const merged = { ...before, ...incoming };
    const changes = diffValues(before, merged);
    const errors = runRules(Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, merged[f] ?? ""])));

    if (submit && errors.length)
      throw new DomainError(422, "VALIDATION_ERROR", "Des règles ne sont pas respectées", errors);

    const target = !submit ? (existing?.status ?? S.DRAFT)
      : existing?.status === S.CORRECTION_REQUIRED ? S.RESUBMITTED : S.SUBMITTED;
    const statusChanged = existing ? existing.status !== target : true;
    if (existing && statusChanged && !canTransition(existing.status, target) && target !== existing.status)
      throw new DomainError(409, "INVALID_TRANSITION", `${existing.status} → ${target} interdit`);

    if (existing && !changes.length && !statusChanged) {
      const result = { treatmentId: existing._id, version: existing.currentVersion, status: existing.status, changed: false,
        errors, errorSummary: summarize(errors) };
      if (idempotencyKey) await repos.idempotency.set(idempotencyKey, result);
      return result;
    }

    const version = (existing?.currentVersion ?? 0) + 1;
    const base = { entityType: "TREATMENT", actor: who, timestamp: at };
    const events = [];
    let treatment;
    if (!existing) {
      treatment = await repos.treatments.insert({
        sourceRow, status: target, currentVersion: 1, currentData: toKV(merged),
        firstSubmittedAt: submit ? at : null, firstSubmittedBy: submit ? who : null, firstSubmittedData: submit ? toKV(merged) : [],
        lastUpdatedAt: at, lastUpdatedBy: who, errorSummary: summarize(errors), referenceEligible: false, createdAt: at,
      });
      events.push({ ...base, action: A.CREATED });
    } else {
      const patch = { status: target, currentVersion: version, currentData: toKV(merged), lastUpdatedAt: at, lastUpdatedBy: who,
        errorSummary: summarize(errors) };
      if (submit && !existing.firstSubmittedAt) Object.assign(patch, { firstSubmittedAt: at, firstSubmittedBy: who, firstSubmittedData: toKV(merged) });
      await repos.treatments.update(existing._id, patch);
      treatment = { ...existing, ...patch };
    }
    for (const c of changes.filter((c) => existing || c.newValue !== ""))
      events.push({ ...base, action: A.FIELD_UPDATED, field: c.field, oldValue: c.oldValue, newValue: c.newValue });
    if (submit) events.push({ ...base, action: existing?.status === S.CORRECTION_REQUIRED ? A.RESUBMITTED : A.SUBMITTED });
    events.forEach((e) => (e.entityId = treatment._id));

    await repos.versions.insert({ treatmentId: treatment._id, version, data: toKV(merged), changes, status: target, author: who, createdAt: at });
    await repos.audits.insertMany(events);
    await repos.validations.insert({ treatmentId: treatment._id, version, errors, createdAt: at });

    const result = { treatmentId: treatment._id, version, status: target, changed: true, errors, errorSummary: summarize(errors) };
    if (idempotencyKey) await repos.idempotency.set(idempotencyKey, result);
    return result;
  });
}
