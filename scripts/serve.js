import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
};
const port = Number(process.env.PORT) || 5173;
http
  .createServer(async (req, res) => {
    try {
      let name = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (name === "/") name = "/index.html";
      const file = path.resolve(root, "." + name);
      if (!file.startsWith(root + path.sep) || name.includes("/.")) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (!(await stat(file)).isFile()) throw Error();
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404);
      res.end("Não encontrado");
    }
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`Infinite Forge ativo na porta ${port}`),
  );
