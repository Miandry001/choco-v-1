import { useEffect, useState } from "react";

/** Charge la ligne `row` du Google Sheet (numéro de ligne tel qu'affiché dans Sheets) via /api/source. */
export function useSourceRow(row) {
  const [state, setState] = useState({ loading: true, error: null, first: 2, last: 0, values: null });

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetch(`/api/source?row=${row}`, { signal: ctrl.signal })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw Object.assign(new Error(body.error ?? `Erreur ${res.status}`), body);
        setState({ loading: false, error: null, first: body.first, last: body.last, values: body.values });
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setState((s) => ({ loading: false, error: e.message, first: e.first ?? s.first, last: e.last ?? s.last, values: null }));
      });

    return () => ctrl.abort();
  }, [row]);

  return state;
}
