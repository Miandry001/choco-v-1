import mongoose from "mongoose";
import { ACTOR_TYPE, AUDIT_ACTION, PRIORITY, TREATMENT_STATUS } from "../constants/index.js";

const { Schema } = mongoose;
const actor = new Schema({ actorId: { type: String, required: true }, actorType: { type: String, enum: Object.values(ACTOR_TYPE), required: true } }, { _id: false });
const kv = new Schema({ k: { type: String, required: true }, v: { type: String, default: "" } }, { _id: false });

/** État courant (dénormalisé : première/dernière version sans relire les versions ni les logs). */
const treatmentSchema = new Schema({
  sourceRow: { type: Number, required: true, unique: true, min: 2 }, // clé métier stable (ligne du fichier source)
  status: { type: String, enum: Object.values(TREATMENT_STATUS), required: true, index: true },
  currentVersion: { type: Number, required: true },
  currentData: [kv],
  firstSubmittedAt: Date, firstSubmittedBy: actor, firstSubmittedData: [kv],
  lastUpdatedAt: { type: Date, required: true }, lastUpdatedBy: actor,
  errorSummary: { count: Number, byPriority: { type: Map, of: Number } },
  referenceEligible: { type: Boolean, default: false },
}, { timestamps: { createdAt: "createdAt", updatedAt: false } });
// QC : liste filtrée par statut/date ; par agent ; par valeur d'un champ quelconque.
treatmentSchema.index({ status: 1, lastUpdatedAt: -1 });
treatmentSchema.index({ "lastUpdatedBy.actorId": 1, lastUpdatedAt: -1 });
treatmentSchema.index({ "currentData.k": 1, "currentData.v": 1 });

const versionSchema = new Schema({
  treatmentId: { type: Schema.Types.ObjectId, ref: "Treatment", required: true },
  version: { type: Number, required: true }, data: [kv],
  changes: [{ _id: false, field: String, oldValue: String, newValue: String }],
  status: String, author: actor, createdAt: { type: Date, default: Date.now },
});
versionSchema.index({ treatmentId: 1, version: -1 }, { unique: true });

const auditSchema = new Schema({
  entityType: { type: String, required: true }, entityId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, enum: Object.values(AUDIT_ACTION), required: true },
  field: String, oldValue: String, newValue: String, actor, timestamp: { type: Date, default: Date.now },
});
auditSchema.index({ entityId: 1, timestamp: -1 }); // historique d'un traitement
auditSchema.index({ "actor.actorId": 1, timestamp: -1 }); // « qui a fait quoi »
auditSchema.index({ field: 1, timestamp: -1 }, { sparse: true });

const validationSchema = new Schema({
  treatmentId: { type: Schema.Types.ObjectId, required: true }, version: Number,
  errors: [{ _id: false, ruleId: String, code: String, errorType: String, field: String, priority: { type: String, enum: Object.values(PRIORITY) }, message: String }],
  createdAt: { type: Date, default: Date.now },
});
validationSchema.index({ treatmentId: 1, version: -1 });
validationSchema.index({ "errors.errorType": 1, "errors.priority": 1 }); // filtre QC par type/priorité

const idempotencySchema = new Schema({ key: { type: String, unique: true }, result: Schema.Types.Mixed, createdAt: { type: Date, default: Date.now, expires: 86400 } });

export const Treatment = mongoose.model("Treatment", treatmentSchema);
export const TreatmentVersion = mongoose.model("TreatmentVersion", versionSchema);
export const AuditLog = mongoose.model("AuditLog", auditSchema);
export const ValidationResult = mongoose.model("ValidationResult", validationSchema);
export const IdempotencyKey = mongoose.model("IdempotencyKey", idempotencySchema);
