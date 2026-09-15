import { HttpError } from "../http/http-error.js";

export const CONTACT_SUBJECTS = new Set([
  "ESG e sustentabilidade",
  "Due diligence socioambiental",
  "ESAP, ESMS e padrões internacionais",
  "Reassentamento, terras e meios de vida",
  "Engajamento de stakeholders",
  "Biodiversidade, clima e serviços ecossistêmicos",
  "Direitos humanos, diversidade e gênero",
  "Auditoria e monitoramento socioambiental",
  "Outros",
]);

const ATTACHMENT_EXTENSIONS = new Set(["pdf", "doc", "docx", "ppt", "pptx"]);
const ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const FIELD_LIMITS = { nome: 120, email: 160, assunto: 180, mensagem: 4000 };

export function validateContactForm(formData, { maxAttachmentBytes }) {
  const name = cleanText(formData.get("nome"), FIELD_LIMITS.nome);
  const email = cleanText(formData.get("email"), FIELD_LIMITS.email);
  const subject = cleanText(formData.get("assunto"), FIELD_LIMITS.assunto);
  const message = cleanText(formData.get("mensagem"), FIELD_LIMITS.mensagem);

  if (!name || !email || !subject || !message) {
    throw new HttpError(400, "Preencha nome, email, assunto e mensagem.");
  }
  if (!isValidName(name)) throw new HttpError(400, "Informe um nome valido.");
  if (!isValidEmail(email)) throw new HttpError(400, "Informe um email valido.");
  if (!CONTACT_SUBJECTS.has(subject)) throw new HttpError(400, "Selecione um assunto valido.");
  if (looksLikeSpam(message)) {
    throw new HttpError(400, "A mensagem parece conter links em excesso. Revise o texto e tente novamente.");
  }

  const attachment = validateAttachment(formData.get("anexo"), maxAttachmentBytes);

  return { name, email, subject, message, attachment };
}

function validateAttachment(file, maxAttachmentBytes) {
  const hasFile = file && typeof file === "object" && "arrayBuffer" in file && file.size > 0;
  if (!hasFile) return null;

  const fileName = sanitizeFileName(file.name || "anexo");
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (file.size > maxAttachmentBytes) {
    throw new HttpError(413, "O anexo deve ter no maximo 5 MB.");
  }
  if (!ATTACHMENT_EXTENSIONS.has(extension) || (file.type && !ATTACHMENT_MIME_TYPES.has(file.type))) {
    throw new HttpError(400, "Envie apenas arquivos PDF, DOC, DOCX, PPT ou PPTX.");
  }

  return { file, fileName, contentType: file.type || "application/octet-stream" };
}

export function cleanText(value, maxLength) {
  return String(value || "").trim().replace(/\0/g, "").slice(0, maxLength);
}

export function isValidName(value) {
  const name = cleanText(value, FIELD_LIMITS.nome).replace(/\s+/g, " ");
  const letters = name.match(/\p{L}/gu) || [];

  if (name.length < 2 || letters.length < 2) return false;
  if (/[<>{}[\]\\]/.test(name)) return false;
  if (/(https?:\/\/|www\.|@)/i.test(name)) return false;
  if (/([^\s])\1{5,}/i.test(name)) return false;
  if (/[^\p{L}\p{M}\s'.-]/u.test(name)) return false;

  return true;
}

export function isValidEmail(value) {
  const email = cleanText(value, FIELD_LIMITS.email);
  if (/[\r\n]/.test(email)) return false;
  return /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/.test(email);
}

export function looksLikeSpam(value) {
  const text = cleanText(value, FIELD_LIMITS.mensagem);
  const linkMatches = text.match(/https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|info|xyz|top|click|shop|online)\b/gi) || [];
  const suspiciousTerms = text.match(/\b(viagra|casino|bet|crypto|forex|loan|winner|prize)\b/gi) || [];

  if (linkMatches.length > 2) return true;
  if (linkMatches.length > 0 && suspiciousTerms.length > 0) return true;
  if (suspiciousTerms.length > 3) return true;

  return false;
}

export function sanitizeFileName(name) {
  return String(name).replace(/[^\w.\-() ]+/g, "_").slice(0, 160);
}
