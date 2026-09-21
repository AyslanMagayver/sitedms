import { HttpError } from "../http/http-error.js";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export function createRecaptchaVerifier({ secretKey, timeoutMs }) {
  return {
    async verify(token, remoteIp) {
      if (!token) throw new HttpError(400, "Confirme o reCAPTCHA antes de enviar.");

      const body = new URLSearchParams({ secret: secretKey, response: token });
      if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

      let result;
      try {
        const response = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(timeoutMs) });
        result = await response.json();
      } catch (error) {
        console.error(`[recaptcha] Falha ao consultar o Google: ${error.message}`);
        throw new HttpError(503, "Não foi possível validar o reCAPTCHA. Tente novamente.");
      }

      if (!result.success) {
        console.warn(`[recaptcha] Token recusado: ${(result["error-codes"] || []).join(", ")}`);
        throw new HttpError(400, "A verificação do reCAPTCHA expirou ou é inválida. Confirme novamente.");
      }
    },
  };
}
