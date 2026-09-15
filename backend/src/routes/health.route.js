import { sendJson } from "../http/response.js";

export function handleHealth(req, res) {
  sendJson(res, 200, { ok: true });
}
