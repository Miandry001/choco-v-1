import { useEffect, useState } from "react";

const SEARCH_DELAY_MS = 400;

/** Début du groupe qui contient `page` (groupes alignés : 1-10, 11-20, 21-30…). */
const groupOf = (page, size) => Math.floor((page - 1) / size) * size + 1;

/**
 * Pagination par groupes de `groupSize` pages, numérotées de `first` à `last` inclus.
 * « Précédent » / « Suivant » font défiler les groupes ; un clic sur un numéro charge la page.
 * Le champ de recherche va à la page saisie dès que la frappe s'arrête (ou sur Entrée).
 */
export function Pagination({ page, first = 1, last, onChange, disabled = false, groupSize = 10, label = "Pagination" }) {
  const [start, setStart] = useState(() => groupOf(page, groupSize));
  const [query, setQuery] = useState("");
  const [queryError, setQueryError] = useState(null);

  // Le groupe affiché suit la page courante quand elle change (recherche, chargement initial…).
  useEffect(() => setStart(groupOf(page, groupSize)), [page, groupSize]);

  const firstGroup = groupOf(first, groupSize);
  const lastGroup = groupOf(last, groupSize);

  const go = (p) => p !== page && p >= first && p <= last && onChange(p);

  function search(text) {
    if (!text.trim()) return setQueryError(null);
    const p = Number(text);
    if (!Number.isInteger(p) || p < first || p > last) return setQueryError(`Entre ${first} et ${last}`);
    setQueryError(null);
    go(p);
  }

  // Recherche dynamique : déclenchée quand l'utilisateur arrête de taper.
  useEffect(() => {
    const t = setTimeout(() => search(query), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  if (last < first) return null;

  const pages = [];
  for (let p = Math.max(start, first); p <= Math.min(start + groupSize - 1, last); p++) pages.push(p);

  return (
    <nav className="pagination" aria-label={label}>
      <div className="pagination__row">
        <button type="button" className="pagination__btn" onClick={() => setStart(firstGroup)} disabled={start <= firstGroup} aria-label="Premier groupe">
          «
        </button>
        <button type="button" className="pagination__btn" onClick={() => setStart(start - groupSize)} disabled={start <= firstGroup}>
          ‹ Précédent
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className="pagination__btn"
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
            disabled={disabled}
          >
            {p}
          </button>
        ))}
        <button type="button" className="pagination__btn" onClick={() => setStart(start + groupSize)} disabled={start >= lastGroup}>
          Suivant ›
        </button>
        <button type="button" className="pagination__btn" onClick={() => setStart(lastGroup)} disabled={start >= lastGroup} aria-label="Dernier groupe">
          »
        </button>
      </div>

      <div className="pagination__row">
        <label className="pagination__search">
          <span>Aller à la page</span>
          <input
            className="control"
            inputMode="numeric"
            placeholder={`${first}–${last}`}
            value={query}
            aria-invalid={queryError ? true : undefined}
            onChange={(e) => setQuery(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && search(query)}
          />
        </label>
        <span className="pagination__info">
          {queryError ? <span className="pagination__error">{queryError}</span> : <>Page {page} · {first} à {last}</>}
        </span>
      </div>
    </nav>
  );
}
