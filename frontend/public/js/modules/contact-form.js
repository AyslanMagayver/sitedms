import { CONTACT_EMAIL, CONTACT_ENDPOINT } from "../config.js";
import { createRecaptcha } from "./recaptcha.js";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ATTACHMENT_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx"];
const ATTACHMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const SUBMIT_LABEL = "Enviar mensagem";
const REQUEST_TIMEOUT_MS = 60 * 1000;
const RECAPTCHA_REQUIRED_MESSAGE = "Confirme o reCAPTCHA antes de enviar.";

export function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector(".form-status");
  const recaptchaContainer = form.querySelector("[data-recaptcha]");
  let isSubmitting = false;

  function setStatus(message, type = "") {
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
  }

  const recaptcha = createRecaptcha(recaptchaContainer, {
    onChange: (verified) => {
      if (verified && status?.textContent === RECAPTCHA_REQUIRED_MESSAGE) setStatus("");
      updateSubmitButton();
    },
    onLoadError: () => setStatus(`Não foi possível carregar a verificação de segurança. Recarregue a página ou fale conosco pelo WhatsApp ou pelo e-mail ${CONTACT_EMAIL}.`, "error"),
  });

  function updateSubmitButton() {
    if (!submitButton) return;
    submitButton.disabled = isSubmitting || !recaptcha.isVerified();
    submitButton.setAttribute("aria-busy", String(isSubmitting));
    submitButton.textContent = isSubmitting ? "Enviando..." : SUBMIT_LABEL;
  }

  function setSubmitting(value) {
    isSubmitting = value;
    updateSubmitButton();
  }

  updateSubmitButton();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const validationError = validate(formData, form.querySelector('input[name="anexo"]')?.files?.[0]);
    if (validationError) {
      setStatus(validationError, "error");
      return;
    }

    if (!recaptcha.isVerified()) {
      setStatus(RECAPTCHA_REQUIRED_MESSAGE, "error");
      return;
    }

    setStatus("Enviando mensagem...", "loading");
    setSubmitting(true);

    try {
      await submitContact(formData);
      form.reset();
      setStatus("Mensagem enviada com sucesso. Em breve a equipe DMS retornará o contato.", "success");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      recaptcha.reset();
      setSubmitting(false);
    }
  });
}

function validate(formData, attachment) {
  const name = String(formData.get("nome") || "").trim().replace(/\s+/g, " ");
  const message = String(formData.get("mensagem") || "").trim();

  if (attachment) {
    const extension = attachment.name.split(".").pop()?.toLowerCase();
    if (attachment.size > MAX_ATTACHMENT_BYTES) return "O anexo deve ter no máximo 5 MB.";
    if (!ATTACHMENT_EXTENSIONS.includes(extension) || (attachment.type && !ATTACHMENT_MIME_TYPES.includes(attachment.type))) {
      return "Envie apenas arquivos PDF, DOC, DOCX, PPT ou PPTX.";
    }
  }

  const nameLetters = name.match(/\p{L}/gu) || [];
  if (
    name.length < 2 ||
    nameLetters.length < 2 ||
    /[<>{}[\]\\]/.test(name) ||
    /(https?:\/\/|www\.|@)/i.test(name) ||
    /[^\p{L}\p{M}\s'.-]/u.test(name)
  ) {
    return "Informe um nome válido.";
  }

  const linkMatches = message.match(/https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|info|xyz|top|click|shop|online)\b/gi) || [];
  if (linkMatches.length > 2) {
    return "A mensagem parece conter links em excesso. Revise o texto e tente novamente.";
  }

  return null;
}

async function submitContact(formData) {
  const unavailableMessage =
    `O envio pelo site está temporariamente indisponível. Fale conosco pelo WhatsApp ou envie um e-mail para ${CONTACT_EMAIL}.`;

  let response;
  try {
    response = await fetch(CONTACT_ENDPOINT, { method: "POST", body: formData, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    // Em hospedagem estática (sem backend Node) o POST falha: oferece os
    // canais diretos em vez de uma mensagem técnica.
    throw new Error(unavailableMessage);
  }

  // 404/405 = hospedagem estática sem a API de envio
  if (response.status === 404 || response.status === 405) throw new Error(unavailableMessage);

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Não foi possível enviar a mensagem.");
  }
}
