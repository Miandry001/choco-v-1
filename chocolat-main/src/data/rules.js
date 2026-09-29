import { fieldType } from "./fields.js";

/** Règles appliquées par défaut à chaque champ, selon son type. */
export const DEFAULT_RULES = {
  text: { required: true, maxLength: 255 },
  textarea: { required: true, maxLength: 2000 },
  number: { required: true, maxLength: 20, number: true, min: 0 },
  yesno: { required: true, oneOf: ["OUI", "NON"] },
};

/** Surcharges champ par champ (fusionnées avec les règles par défaut). */
export const FIELD_RULES = {
  "NOM": { required: true },
  "Compte Total": { integer: true },
};

export function getRules(name) {
  return { ...DEFAULT_RULES[fieldType(name)], ...FIELD_RULES[name] };
}

/** Mise en forme appliquée à toutes les réponses : majuscules, sans accents. */
export const formatValue = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .toUpperCase();

const parseNumber =(s) => Number(s.replace(",", "."));

/** Renvoie un message d'erreur, ou null si la valeur respecte les règles. */
export function validate(value, rules) {
  const v = value.trim();

  if (!v) return rules.required ? "Champ obligatoire" : null;

  if (rules.maxLength && v.length > rules.maxLength)
    return `${rules.maxLength} caractères maximum`;

  if (rules.number) {
    if (!/^-?\d+([.,]\d+)?$/.test(v)) return "Nombre attendu (ex. 12,5)";
    const n = parseNumber(v);
    if (rules.integer && !Number.isInteger(n)) return "Nombre entier attendu";
    if (rules.min != null && n < rules.min) return `Minimum : ${rules.min}`;
    if (rules.max != null && n > rules.max) return `Maximum : ${rules.max}`;
  }

  if (rules.oneOf && !rules.oneOf.includes(v))
    return `Valeurs possibles : ${rules.oneOf.join(", ")}`;

  return null;
}

/** Valide toutes les valeurs ; renvoie { nomDuChamp: message } pour les champs en erreur. */
export function validateAll(values) {
  const errors = {};
  for (const [name, value] of Object.entries(values)) {
    const error = validate(value, getRules(name));
    if (error) errors[name] = error;
  }
  return errors;
}
