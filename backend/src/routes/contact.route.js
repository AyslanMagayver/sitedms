import { HttpError } from "../http/http-error.js";
import { getClientIp, readFormData } from "../http/request.js";
import { sendJson } from "../http/response.js";
import { sanitizeEmailHeader } from "../services/mail/mime-message.js";
import { buildContactEmailHtml, buildContactEmailText } from "../templates/contact-email.js";
import { validateContactForm } from "../validators/contact.validator.js";

export function createContactHandler({ config, mailer, rateLimiter, recaptcha }) {
  const { to, maxRequestBytes, maxAttachmentBytes } = config.contact;

  return async function handleContact(req, res) {
    const clientIp = getClientIp(req, config.trustProxy);
    if (!rateLimiter.consume(clientIp)) {
      throw new HttpError(429, "Muitas tentativas. Tente novamente em alguns minutos.");
    }

    if (Number(req.headers["content-length"] || 0) > maxRequestBytes) {
      throw new HttpError(413, "O envio excede o limite permitido.");
    }

    if (!String(req.headers["content-type"] || "").includes("multipart/form-data")) {
      throw new HttpError(400, "Formato de formulário inválido.");
    }

    const formData = await readFormData(req, maxRequestBytes);
    await recaptcha.verify(String(formData.get("g-recaptcha-response") || "").trim(), clientIp);

    const { name, email, subject, message, attachment } = validateContactForm(formData, { maxAttachmentBytes });

    const attachments = attachment
      ? [{
          filename: attachment.fileName,
          contentType: attachment.contentType,
          content: Buffer.from(await attachment.file.arrayBuffer()),
        }]
      : [];
    const emailContent = {
      name,
      email,
      subject,
      message,
      attachmentNames: attachments.map((item) => item.filename),
    };

    const smtpResult = await mailer.send({
      to,
      replyTo: sanitizeEmailHeader(email),
      subject: `[Site DMS] ${subject} - ${name}`,
      text: buildContactEmailText(emailContent),
      html: buildContactEmailHtml(emailContent),
      attachments,
    });

    console.info(`[contact] Email aceito pelo SMTP para ${to}. ${smtpResult}`);
    sendJson(res, 200, { ok: true, message: "Mensagem enviada com sucesso." });
  };
}
