export function buildContactEmailText({ name, email, subject, message, attachmentNames }) {
  return [
    "Novo contato pelo site DMS",
    "",
    `Nome: ${name}`,
    `Email: ${email}`,
    `Assunto: ${subject}`,
    `Anexos: ${attachmentNames.length ? attachmentNames.join(", ") : "nenhum"}`,
    "",
    "Mensagem:",
    message,
  ].join("\n");
}

export function buildContactEmailHtml({ name, email, subject, message, attachmentNames }) {
  return `
    <h2>Novo contato pelo site DMS</h2>
    <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
    <p><strong>Anexos:</strong> ${attachmentNames.length ? attachmentNames.map(escapeHtml).join(", ") : "nenhum"}</p>
    <hr />
    <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
