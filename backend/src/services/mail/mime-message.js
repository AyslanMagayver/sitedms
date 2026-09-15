export function buildMimeMessage({ from, to, replyTo, subject, text, html, attachments }) {
  const mixedBoundary = createBoundary("mixed");
  const altBoundary = createBoundary("alt");

  const parts = [
    `From: DMS Site <${from}>`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeMimeWord(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${altBoundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${altBoundary}--`,
  ];

  for (const attachment of attachments) {
    const fileName = escapeHeader(attachment.filename);
    parts.push(
      "",
      `--${mixedBoundary}`,
      `Content-Type: ${attachment.contentType}; name="${fileName}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${fileName}"`,
      "",
      attachment.content.toString("base64").replace(/.{1,76}/g, "$&\r\n").trim()
    );
  }

  parts.push("", `--${mixedBoundary}--`, "");
  return parts.join("\r\n");
}

export function sanitizeEmailHeader(value) {
  return String(value || "").trim().slice(0, 160).replace(/[\r\n<>"]/g, "");
}

function createBoundary(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function encodeMimeWord(value) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function escapeHeader(value) {
  return String(value).replace(/["\r\n]/g, "_");
}
