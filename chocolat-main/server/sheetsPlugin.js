import { GoogleAuth } from "google-auth-library";

const CACHE_MS = 30_000;

/**
 * Plugin Vite qui expose GET /api/source?row=N côté serveur.
 * La clé du compte de service reste sur le serveur : elle n'est jamais envoyée au navigateur.
 *
 * Réponse : { row, first, last, values: { "<en-tête de colonne>": "<valeur>" } }
 * `row` est le numéro de ligne tel qu'affiché dans Google Sheets (la ligne 1 contient les en-têtes).
 */
export function sheetsPlugin({ keyFile, sheetId, range }) {
  const auth = new GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  let cache = null;

  async function loadSheet() {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
    const client = await auth.getClient();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
    const res = await client.request({ url, params: { valueRenderOption: "FORMATTED_VALUE" } });
    const rows = res.data.values ?? [];
    cache = { at: Date.now(), rows };
    return rows;
  }

  function send(res, status, body) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(body));
  }

  async function handle(req, res, next) {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname !== "/api/source") return next();

    if (!sheetId) return send(res, 500, { error: "SHEET_ID manquant dans le fichier .env" });

    try {
      const [headers = [], ...data] = await loadSheet();
      // Numérotation identique à Google Sheets : la ligne 1 contient les en-têtes, les données vont de 2 à last.
      const first = 2;
      const last = data.length + 1;
      const row = Number(url.searchParams.get("row") ?? first);
      if (!Number.isInteger(row) || row < first || row > last)
        return send(res, 404, { error: `Ligne ${row} introuvable (${first} à ${last})`, first, last });

      const cells = data[row - first];
      const values = Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
      send(res, 200, { row, first, last, values });
    } catch (e) {
      const message = e.response?.data?.error?.message ?? e.message;
      send(res, e.response?.status ?? 500, { error: `Google Sheets : ${message}` });
    }
  }

  return {
    name: "sheets-api",
    configureServer(server) {
      server.middlewares.use(handle);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
  };
}
