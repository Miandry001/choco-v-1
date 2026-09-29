// Les 73 champs = 55 champs de saisie (FIELDS) + 18 champs source en lecture seule (READONLY).
// Importés depuis le frontend pour n'avoir qu'une seule liste à maintenir.
// Si le backend est déployé seul, copier ces données ici.
import { FIELDS, READONLY, fieldType } from "../../../src/data/fields.js";
import { getRules } from "../../../src/data/rules.js";

export const EDITABLE_FIELDS = Object.freeze([...FIELDS]);
export const SOURCE_FIELDS = Object.freeze(READONLY.map(([name]) => name));
export const ALL_FIELDS = Object.freeze([...SOURCE_FIELDS, ...EDITABLE_FIELDS]);
export const isEditableField = (name) => EDITABLE_FIELDS.includes(name);
export { fieldType, getRules };
