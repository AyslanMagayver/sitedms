import { Readable } from "node:stream";

export async function readFormData(req) {
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: Readable.toWeb(req),
    duplex: "half",
  });
  return request.formData();
}

export function getClientIp(req, trustProxy) {
  if (trustProxy) {
    const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
    if (forwardedFor) return forwardedFor;
  }
  return req.socket.remoteAddress || "unknown";
}
