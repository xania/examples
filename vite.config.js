import { defineConfig } from "vite";
import path, { resolve } from "node:path";
import { fileURLToPath } from "url";
import xanify from "./xanify/plugin";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  logLevel: "debug",
  plugins: [xanify()],
  resolve: {
    alias: {
      "@xania/view": path.resolve(__dirname, "packages/view/lib/index.ts"),
      "@xania/state": path.resolve(__dirname, "packages/state/lib/index.ts"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  build: {
    manifest: true,
    minify: true,
    outDir: "dist",
  },
});
