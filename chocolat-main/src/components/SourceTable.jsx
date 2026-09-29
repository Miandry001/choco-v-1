import { useState } from "react";
import { DataTable, Pagination } from "./ui";
import { READONLY } from "../data/fields.js";
import { useSourceRow } from "../data/useSourceRow.js";

/** Compare les en-têtes sans tenir compte de la casse, des accents ni des espaces. */
const key = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Valeur de la colonne du Sheet dont l'en-tête correspond à l'attribut, ou undefined si absente. */
function lookup(values, attribute) {
  const k = key(attribute);
  const header = Object.keys(values).find((h) => key(h) === k);
  return header === undefined ? undefined : values[header];
}

export function SourceTable() {
  // Le numéro de page est le numéro de ligne du Google Sheet (la ligne 1 contient les en-têtes).
  const [row, setRow] = useState(2);
  const { loading, error, first, last, values } = useSourceRow(row);

  const rows = READONLY.map(([attribute, description]) => {
    const value = values ? lookup(values, attribute) : undefined;
    return [
      <span title={description || undefined}>{attribute}</span>,
      value === undefined ? <span className="cell-empty">{values ? "colonne absente" : "…"}</span> : value,
    ];
  });

  return (
    <>
      {error && <p className="source-error" role="alert">{error}</p>}
      <div className={loading ? "is-loading" : undefined} aria-busy={loading}>
        <DataTable columns={["Attribut", "Valeur"]} rows={rows} />
      </div>
      <Pagination page={row} first={first} last={last} onChange={setRow} disabled={loading} label="Lignes du Google Sheet" />
    </>
  );
}
