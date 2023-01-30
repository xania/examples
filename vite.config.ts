import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "url";
import { XaniaSsrPlugin } from "@xania/ssr";
import fs from "fs/promises";

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
  plugins: [
    XaniaSsrPlugin({
      routes: {
        // "/pages/todomvc.tsx": () => import("./pages/todomvc")
      },
      async exists(file) {
        try {
          const stats = await fs.stat(file, {});
          return stats.isFile();
        } catch (err) {
          return false;
        }
      }
    })
  ]
});
