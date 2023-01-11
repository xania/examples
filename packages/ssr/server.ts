import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    server: { middlewareMode: true },
    ssr: {
      target: "node",
    },
    appType: "custom",
  });

  // use vite's connect instance as middleware
  // if you use your own express router (express.Router()), you should use router.use
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.baseUrl;

    try {
      res.status(200).set({ "Content-Type": "text/html" });

      const pageUrl = `/src/pages${req.baseUrl}.tsx`;

      const page = await vite.ssrLoadModule(pageUrl);
      let pageContent = "";
      await page.view().execute((str) => (pageContent += str));
      pageContent += `<script type="module" src="${pageUrl}" ></script>`;

      const html = await vite.transformIndexHtml(url, pageContent);
      res.end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(3000);
}

createServer();
