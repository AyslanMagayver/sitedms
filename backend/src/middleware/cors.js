const ALLOWED_METHODS = "GET, POST, OPTIONS";
const ALLOWED_HEADERS = "Content-Type";
const PREFLIGHT_MAX_AGE_SECONDS = 86400;

export function handleCors(req, res, allowedOrigins) {
  const origin = req.headers.origin;

  res.setHeader("Vary", "Origin");
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  if (req.method !== "OPTIONS") return false;

  res.writeHead(204, {
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": String(PREFLIGHT_MAX_AGE_SECONDS),
  });
  res.end();
  return true;
}
