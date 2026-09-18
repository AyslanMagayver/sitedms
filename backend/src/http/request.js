import { Readable } from "node:stream";
import { HttpError } from "./http-error.js";

export async function readFormData(req, maxBytes) {
  let receivedBytes = 0;
  let exceeded = false;

  const body = Readable.toWeb(req).pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        receivedBytes += chunk.byteLength;
        if (receivedBytes > maxBytes) {
          exceeded = true;
          controller.error(new Error("Limite de envio excedido."));
          return;
        }
        controller.enqueue(chunk);
      },
    })
  );

  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body,
    duplex: "half",
  });

  try {
    return await request.formData();
  } catch {
    if (exceeded) throw new HttpError(413, "O envio excede o limite permitido.");
    throw new HttpError(400, "Formato de formulário inválido.");
  }
}

export function getClientIp(req, trustProxy) {
  if (trustProxy) {
    const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",").map((ip) => ip.trim()).filter(Boolean);
    if (forwardedFor.length) return forwardedFor[forwardedFor.length - 1];
  }
  return req.socket.remoteAddress || "unknown";
}
