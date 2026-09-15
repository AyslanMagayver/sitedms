import { HttpError } from "./http/http-error.js";
import { sendJson } from "./http/response.js";
import { handleCors } from "./middleware/cors.js";
import { createRateLimiter } from "./middleware/rate-limit.js";
import { applySecurityHeaders } from "./middleware/security-headers.js";
import { createContactHandler } from "./routes/contact.route.js";
import { handleHealth } from "./routes/health.route.js";
import { createMailer } from "./services/mail/mailer.js";

export function createApp(config) {
  const mailer = createMailer(config.smtp);
  const rateLimiter = createRateLimiter(config.rateLimit);
  const routes = new Map([
    ["GET /health", handleHealth],
    ["POST /api/contact", createContactHandler({ config, mailer, rateLimiter })],
  ]);
  const knownPaths = new Set([...routes.keys()].map((route) => route.split(" ")[1]));

  async function handleRequest(req, res) {
    applySecurityHeaders(res);

    try {
      if (handleCors(req, res, config.allowedOrigins)) return;

      const { pathname } = new URL(req.url || "/", "http://localhost");
      const handler = routes.get(`${req.method} ${pathname}`);

      if (handler) {
        await handler(req, res);
        return;
      }

      if (knownPaths.has(pathname)) throw new HttpError(405, "Método não permitido.");
      throw new HttpError(404, "Rota não encontrada.");
    } catch (error) {
      handleError(error, res);
    }
  }

  handleRequest.close = () => rateLimiter.stop();
  return handleRequest;
}

function handleError(error, res) {
  const isKnownError = error instanceof HttpError;
  if (!isKnownError) console.error(error);

  if (res.headersSent) {
    res.end();
    return;
  }

  sendJson(res, isKnownError ? error.statusCode : 500, {
    ok: false,
    message: isKnownError ? error.message : "Não foi possível processar a solicitação.",
  });
}
