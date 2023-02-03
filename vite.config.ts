import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "url";
import { resumabl } from "./packages/vite-plugin-resumabl/lib/plugin";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  logLevel: "error",
  resolve: {
    alias: {
      "~": path.resolve(__dirname),
      "@xania/view": path.resolve(__dirname, "packages/view/lib/index.ts"),
      "@xania/state": path.resolve(__dirname, "packages/state/lib/index.ts"),
      "@xania/ssr": path.resolve(__dirname, "packages/ssr/index.ts")
    }
  },
  server: {
    port: 3000,
    host: "0.0.0.0"
  },
  plugins: [resumabl()]
});
