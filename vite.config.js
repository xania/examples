import { defineConfig } from "vite";
const path = require("path");

export default defineConfig({
  logLevel: "info",
  resolve: {
    alias: {
      "@xania/view": path.resolve(__dirname, "./packages/view/lib/index.ts"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  root: "src",
  build: {
    minify: true,
    outDir: "../dist",
  },
});
