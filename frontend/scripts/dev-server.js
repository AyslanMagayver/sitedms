import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const port = Number(process.env.FRONTEND_PORT || 5500);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url || "/", "http://localhost");
    const relativePath = normalize(decodeURIComponent(pathname)).replace(/^[/\\]+/, "") || "index.html";
    const filePath = join(frontendDir, relativePath);

    if (filePath !== frontendDir && !filePath.startsWith(frontendDir + sep)) {
      return sendText(res, 403, "Forbidden");
    }

    const fileStats = await stat(filePath).catch(() => null);
    const resolvedPath = fileStats?.isDirectory() ? join(filePath, "index.html") : filePath;
    if (!fileStats || !(await stat(resolvedPath).catch(() => null))?.isFile()) {
      return sendText(res, 404, "Not found");
    }

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(resolvedPath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    createReadStream(resolvedPath).pipe(res);
  } catch {
    sendText(res, 400, "Bad request");
  }
});

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(message);
}

server.listen(port, () => {
  console.log(`Frontend DMS em http://localhost:${port}`);
});
