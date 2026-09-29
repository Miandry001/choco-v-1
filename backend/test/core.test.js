import test from "node:test";
import assert from "node:assert/strict";
import { ALL_FIELDS, EDITABLE_FIELDS, SOURCE_FIELDS } from "../src/config/fields.js";
import { canTransition, TREATMENT_STATUS as S } from "../src/constants/index.js";
import { diffValues } from "../src/diff/diffEngine.js";
import { runRules } from "../src/rules/index.js";
import { formatValue } from "../src/utils/normalize.js";

const valid = () => {
  const v = Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, "X"]));
  v["CODIFICATION AVEC PHOTO oui/non"] = "OUI";
  for (const f of ["Onces Totales", "Compte Total", "Compte Total De Paqt"]) v[f] = "3";
  return v;
};

test("73 champs = 55 saisie + 18 source, sans doublon", () => {
  assert.equal(EDITABLE_FIELDS.length, 55);
  assert.equal(SOURCE_FIELDS.length, 18);
  assert.equal(new Set(ALL_FIELDS).size, 73);
});

test("workflow : transitions", () => {
  assert.ok(canTransition(S.SUBMITTED, S.IN_QC));
  assert.ok(canTransition(S.IN_QC, S.CORRECTION_REQUIRED));
  assert.ok(canTransition(S.CORRECTION_REQUIRED, S.RESUBMITTED));
  assert.ok(!canTransition(S.APPROVED, S.IN_QC));
  assert.ok(!canTransition(S.DRAFT, S.APPROVED));
});

test("diff : uniquement les champs modifiés", () => {
  assert.deepEqual(diffValues({ a: "A", b: "B", c: "C" }, { a: "A", b: "X", c: "C" }), [
    { field: "b", oldValue: "B", newValue: "X" },
  ]);
  assert.deepEqual(diffValues({ a: "A" }, { a: "A", d: "" }), []);
  assert.equal(diffValues({}, { a: "1" }).length, 1);
});

test("règles : jeu valide → aucune erreur", () => assert.deepEqual(runRules(valid()), []));

test("règles : NOM vide = CRITICAL, trié en premier", () => {
  const v = valid();
  v["NOM"] = "";
  v["Compte Total"] = "1,5";
  v["Onces Totales"] = "abc";
  const errs = runRules(v);
  assert.equal(errs[0].field, "NOM");
  assert.equal(errs[0].priority, "CRITICAL");
  assert.equal(errs[0].errorType, "REQUIRED_FIELD");
  assert.ok(errs.some((e) => e.field === "Compte Total" && e.errorType === "INVALID_VALUE"));
  assert.ok(errs.some((e) => e.field === "Onces Totales" && e.errorType === "INVALID_FORMAT"));
  const ranks = errs.map((e) => ["CRITICAL", "HIGH", "MEDIUM", "LOW"].indexOf(e.priority));
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
});

test("règles : oneOf et longueur", () => {
  const v = valid();
  v["CODIFICATION AVEC PHOTO oui/non"] = "PEUT-ETRE";
  v["NOM"] = "X".repeat(256);
  const errs = runRules(v);
  assert.ok(errs.some((e) => e.field === "CODIFICATION AVEC PHOTO oui/non" && e.errorType === "INVALID_VALUE"));
  assert.ok(errs.some((e) => e.field === "NOM" && e.errorType === "INVALID_FORMAT"));
});

test("normalisation : majuscules sans accents", () => assert.equal(formatValue("Crème brûlée œuf"), "CREME BRULEE OEUF"));
