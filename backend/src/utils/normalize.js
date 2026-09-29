/** Même mise en forme que le frontend : majuscules, sans accents (le serveur ne fait pas confiance au client). */
export const formatValue = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .toUpperCase();

export const normalizeValues = (values) =>
  Object.fromEntries(Object.entries(values).map(([k, v]) => [k, formatValue(String(v ?? "").trim())]));
