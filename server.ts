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
    // serve index.html - we will tackle this next
    const url = req.baseUrl;

    try {
      // 1. Read index.html
      // let template = fs.readFileSync(
      //   path.resolve(__dirname, "index.html"),
      //   "utf-8"
      // );

      res.status(200).set({ "Content-Type": "text/html" });

      const layoutUrl = `/src/layout/Layout.tsx`;
      const pageUrl = `/src/pages${req.baseUrl}.tsx`;

      const { layout } = await vite.ssrLoadModule(layoutUrl);
      const page = await vite.ssrLoadModule(pageUrl);
      let pageContent = "";

      const { serverRender } = await vite.ssrLoadModule("/src/backend");
      await serverRender(page.view(), (str) => (pageContent += str));

      let template = "";
      var app = await serverRender(
        layout({}, [
          pageContent,
          `<script type="module" src="${layoutUrl}" ></script>`,
          `<script type="module" src="${pageUrl}" ></script>`,
        ]),
        (str) => (template += str)
      );

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
      //    also applies HTML transforms from Vite plugins, e.g. global preambles
      //    from @vitejs/plugin-react
      const html = await vite.transformIndexHtml(url, template);

      // 6. Send the rendered HTML back.

      res.end(html);
    } catch (e) {
      // If an error is caught, let Vite fix the stack trace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  app.listen(3000);
}

createServer();
