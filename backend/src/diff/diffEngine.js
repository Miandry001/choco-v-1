const norm = (v) => (v === undefined || v === null ? "" : String(v));

/** Compare deux jeux de valeurs (n'importe quel nombre de champs). Renvoie [{ field, oldValue, newValue }]. */
export function diffValues(before = {}, after = {}) {
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  return fields
    .filter((f) => norm(before[f]) !== norm(after[f]))
    .map((field) => ({ field, oldValue: norm(before[field]), newValue: norm(after[field]) }));
}
