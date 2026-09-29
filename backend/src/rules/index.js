import { EDITABLE_FIELDS, getRules } from "../config/fields.js";
import { ERROR_TYPE, PRIORITY, PRIORITY_RANK } from "../constants/index.js";

const isEmpty = (v) => String(v ?? "").trim() === "";
const num = (s) => Number(String(s).trim().replace(",", "."));
const NUMBER_RE = /^-?\d+([.,]\d+)?$/;

/**
 * Interface d'une règle : { id, name, description, field, severity, errorType, validate(values) → message | null }.
 * Règles V1 générées depuis la configuration par champ (identique à celle du frontend) ;
 * les vraies règles métier s'ajouteront ici (un fichier par règle) via `extraRules`.
 */
function rulesForField(field) {
  const cfg = getRules(field);
  const rule = (suffix, errorType, severity, description, validate) => ({
    id: `${field}:${suffix}`, name: suffix, description, field, errorType, severity,
    validate: (values) =>
      isEmpty(values[field]) && suffix !== "required" ? null : validate(String(values[field] ?? "").trim()),
  });
  const asNumber = (v) => (NUMBER_RE.test(v) ? num(v) : null);
  const list = [];
  if (cfg.required)
    list.push(rule("required", ERROR_TYPE.REQUIRED_FIELD, field === "NOM" ? PRIORITY.CRITICAL : PRIORITY.HIGH,
      "Champ obligatoire", (v) => (v ? null : "Champ obligatoire")));
  if (cfg.maxLength)
    list.push(rule("maxLength", ERROR_TYPE.INVALID_FORMAT, PRIORITY.MEDIUM, "Longueur maximale",
      (v) => (v.length > cfg.maxLength ? `${cfg.maxLength} caractères maximum` : null)));
  if (cfg.number) {
    list.push(rule("number", ERROR_TYPE.INVALID_FORMAT, PRIORITY.HIGH, "Format numérique",
      (v) => (NUMBER_RE.test(v) ? null : "Nombre attendu (ex. 12,5)")));
    if (cfg.integer)
      list.push(rule("integer", ERROR_TYPE.INVALID_VALUE, PRIORITY.MEDIUM, "Entier attendu",
        (v) => { const n = asNumber(v); return n !== null && !Number.isInteger(n) ? "Nombre entier attendu" : null; }));
    if (cfg.min != null)
      list.push(rule("min", ERROR_TYPE.INVALID_VALUE, PRIORITY.MEDIUM, "Valeur minimale",
        (v) => { const n = asNumber(v); return n !== null && n < cfg.min ? `Minimum : ${cfg.min}` : null; }));
    if (cfg.max != null)
      list.push(rule("max", ERROR_TYPE.INVALID_VALUE, PRIORITY.MEDIUM, "Valeur maximale",
        (v) => { const n = asNumber(v); return n !== null && n > cfg.max ? `Maximum : ${cfg.max}` : null; }));
  }
  if (cfg.oneOf)
    list.push(rule("oneOf", ERROR_TYPE.INVALID_VALUE, PRIORITY.HIGH, "Valeurs autorisées",
      (v) => (cfg.oneOf.includes(v) ? null : `Valeurs possibles : ${cfg.oneOf.join(", ")}`)));
  return list;
}

const extraRules = []; // règles métier futures (DUPLICATE, INCONSISTENCY, BUSINESS_RULE…)

export const RULES = Object.freeze([...EDITABLE_FIELDS.flatMap(rulesForField), ...extraRules]);

/** Exécute toutes les règles ; tri CRITICAL → LOW, puis ordre des champs du formulaire. */
export function runRules(values, rules = RULES) {
  const order = new Map(EDITABLE_FIELDS.map((f, i) => [f, i]));
  const errors = [];
  for (const r of rules) {
    const message = r.validate(values);
    if (message)
      errors.push({ ruleId: r.id, code: r.errorType, errorType: r.errorType, field: r.field, priority: r.severity, message });
  }
  return errors.sort((a, b) =>
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || (order.get(a.field) ?? 999) - (order.get(b.field) ?? 999));
}
