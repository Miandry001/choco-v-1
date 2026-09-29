import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { sheetsPlugin } from "./server/sheetsPlugin.js";

export default defineConfig(({ mode }) => {
  // Variables sans préfixe VITE_ : lues uniquement côté serveur, jamais exposées au navigateur.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      sheetsPlugin({
        keyFile: env.GOOGLE_CREDENTIALS ?? "secrets/creds.json",
        sheetId: env.SHEET_ID,
        // Seul l'onglet « référent » est lu ; les autres onglets du fichier sont ignorés.
        range: env.SHEET_RANGE ?? "'référent'!A:ZZ",
      }),
    ],
  };
});
