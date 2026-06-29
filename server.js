import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import net from "node:net";
import tls from "node:tls";

const rootDir = dirname(fileURLToPath(import.meta.url));
const envPath = join(rootDir, ".env");
loadEnv(envPath);

const port = Number(process.env.PORT || 3000);
const contactTo = process.env.CONTACT_TO || "contato@dmsocioambiental.com";
const maxAttachmentSize = 5 * 1024 * 1024;
const maxRequestSize = 8 * 1024 * 1024;
const allowedExtensions = new Set(["pdf", "doc", "docx", "ppt", "pptx"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);
const allowedSubjects = new Set([
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
const rateLimitWindowMs = 15 * 60 * 1000;
const maxRequestsPerWindow = 5;
const rateLimit = new Map();
const sensitivePrefixes = [
  "tools/",
  "node_modules/",
  "chrome-",
  "edge-",
  "ux-audit/",
  "conversion-audit/",
  "multi-audit/",
  "ppt_extract_",
];
const sensitiveFilePatterns = [
  /^\.env/i,
  /^package(-lock)?\.json$/i,
  /^server\.js$/i,
  /^README/i,
  /\.log$/i,
  /\.backup$/i,
  /\.mjs$/i,
];
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/contact") {
      await handleContact(req, res);
      return;
    }

    if (req.method === "GET" && req.url === "/api/carousel") {
      handleCarouselList(req, res);
      return;
    }

    if (req.method === "GET" && req.url === "/api/logos") {
      handleLogosList(req, res);
      return;
    }

    if (req.method === "GET" && req.url === "/api/experiences") {
      handleExperiencesList(req, res);
      return;
    }

    if (req.method === "GET" || req.method === "HEAD") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { ok: false, message: "Método não permitido." });
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode || 500, {
      ok: false,
      message: error.statusCode && error.statusCode < 500
        ? error.message
        : error.statusCode === 503
        ? "Servidor de email ainda não configurado."
        : "Não foi possível processar a solicitação.",
    });
  }
});

server.listen(port, () => {
  console.log(`DMS landing rodando em http://127.0.0.1:${port}`);
});

function handleCarouselList(req, res) {
  const carouselDir = join(rootDir, "assets", "carousel");
  const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

  if (!existsSync(carouselDir)) {
    sendJson(res, 200, { ok: true, images: [] });
    return;
  }

  const images = readdirSync(carouselDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => allowedImageExtensions.has(extname(fileName).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }))
    .map((fileName) => ({
      src: `/assets/carousel/${encodeURIComponent(fileName)}`,
      alt: `Processo participativo em campo - ${fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ")}`,
    }));

  sendJson(res, 200, { ok: true, images });
}

const logoSectorSlugs = ["mineracao", "papel-celulose", "energia-oleo-gas", "infraestrutura-mobilidade"];
const logoTypes = ["clientes", "parceiros"];
const allowedLogoExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg"]);
const logoNameAcronyms = new Set([
  "afd", "bamin", "bmte", "byd", "cagece", "ccr", "csn", "ebcf", "fmo",
  "ifc", "idb", "ld", "onf", "sra", "sa",
]);

function loadLogoNamesMap() {
  const namesPath = join(rootDir, "assets", "logos", "_names.json");
  if (!existsSync(namesPath)) return {};
  try {
    const data = JSON.parse(readFileSync(namesPath, "utf8"));
    delete data._comment;
    return data;
  } catch {
    return {};
  }
}

function deriveLogoDisplayName(fileName) {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "");
  return base
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) =>
      logoNameAcronyms.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function listLogoFiles(dirPath) {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => allowedLogoExtensions.has(extname(fileName).toLowerCase()) && !fileName.startsWith("."))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }));
}

function handleLogosList(req, res) {
  const logosRoot = join(rootDir, "assets", "logos");
  const namesMap = loadLogoNamesMap();

  function buildEntries(relativeParts) {
    const dirPath = join(logosRoot, ...relativeParts);
    return listLogoFiles(dirPath).map((fileName) => ({
      src: `/assets/logos/${relativeParts.map(encodeURIComponent).join("/")}/${encodeURIComponent(fileName)}`,
      alt: namesMap[fileName] || deriveLogoDisplayName(fileName),
      _fileName: fileName,
    }));
  }

  const sectors = {};
  const cloudSeen = new Set();
  const cloud = [];

  for (const sectorSlug of logoSectorSlugs) {
    sectors[sectorSlug] = {};
    for (const type of logoTypes) {
      const entries = buildEntries([sectorSlug, type]);
      sectors[sectorSlug][type] = entries.map(({ src, alt }) => ({ src, alt }));
      for (const entry of entries) {
        if (cloudSeen.has(entry._fileName)) continue;
        cloudSeen.add(entry._fileName);
        cloud.push({ src: entry.src, alt: entry.alt });
      }
    }
  }

  for (const entry of buildEntries(["geral"])) {
    if (cloudSeen.has(entry._fileName)) continue;
    cloudSeen.add(entry._fileName);
    cloud.push({ src: entry.src, alt: entry.alt });
  }

  sendJson(res, 200, { ok: true, sectors, cloud });
}

const allowedQrExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

function handleExperiencesList(req, res) {
  const experiencesPath = join(rootDir, "assets", "experiences", "experiences.json");
  const qrDir = join(rootDir, "assets", "experiences", "qrcodes");

  if (!existsSync(experiencesPath)) {
    sendJson(res, 200, { ok: true, items: [] });
    return;
  }

  try {
    const data = JSON.parse(readFileSync(experiencesPath, "utf8"));
    const rawItems = Array.isArray(data.items) ? data.items : [];

    const items = rawItems
      .filter((item) => item && typeof item.videoId === "string" && item.videoId.trim())
      .map((item) => {
        const qrFile = typeof item.qr === "string" ? item.qr.trim() : "";
        const hasQr =
          qrFile &&
          allowedQrExtensions.has(extname(qrFile).toLowerCase()) &&
          existsSync(join(qrDir, qrFile));

        return {
          videoId: item.videoId.trim(),
          title: typeof item.title === "string" ? item.title.trim() : "",
          subtitle: typeof item.subtitle === "string" ? item.subtitle.trim() : "",
          text: typeof item.text === "string" ? item.text.trim() : "",
          qr: hasQr ? `/assets/experiences/qrcodes/${encodeURIComponent(qrFile)}` : null,
        };
      });

    sendJson(res, 200, { ok: true, items });
  } catch (error) {
    console.error(error);
    sendJson(res, 200, { ok: true, items: [] });
  }
}

async function handleContact(req, res) {
  const ip = req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    sendJson(res, 429, { ok: false, message: "Muitas tentativas. Tente novamente em alguns minutos." });
    return;
  }

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > maxRequestSize) {
    sendJson(res, 413, { ok: false, message: "O envio excede o limite permitido." });
    return;
  }

  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("multipart/form-data")) {
    sendJson(res, 400, { ok: false, message: "Formato de formulário inválido." });
    return;
  }

  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: Readable.toWeb(req),
    duplex: "half",
  });
  const formData = await request.formData();

  const name = cleanText(formData.get("nome"), 120);
  const email = cleanText(formData.get("email"), 160);
  const subject = cleanText(formData.get("assunto"), 180);
  const message = cleanText(formData.get("mensagem"), 4000);
  const attachment = formData.get("anexo");

  if (!name || !email || !subject || !message) {
    sendJson(res, 400, { ok: false, message: "Preencha nome, email, assunto e mensagem." });
    return;
  }

  if (!isValidName(name)) {
    sendJson(res, 400, { ok: false, message: "Informe um nome valido." });
    return;
  }

  if (!isValidEmail(email)) {
    sendJson(res, 400, { ok: false, message: "Informe um email valido." });
    return;
  }

  if (!allowedSubjects.has(subject)) {
    sendJson(res, 400, { ok: false, message: "Selecione um assunto valido." });
    return;
  }

  if (looksLikeSpam(message)) {
    sendJson(res, 400, { ok: false, message: "A mensagem parece conter links em excesso. Revise o texto e tente novamente." });
    return;
  }

  const attachments = [];
  if (attachment && typeof attachment === "object" && "arrayBuffer" in attachment && attachment.size > 0) {
    const fileName = sanitizeFileName(attachment.name || "anexo");
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    if (attachment.size > maxAttachmentSize) {
      sendJson(res, 413, { ok: false, message: "O anexo deve ter no maximo 5 MB." });
      return;
    }

    if (!allowedExtensions.has(extension) || (attachment.type && !allowedMimeTypes.has(attachment.type))) {
      sendJson(res, 400, { ok: false, message: "Envie apenas arquivos PDF, DOC, DOCX, PPT ou PPTX." });
      return;
    }

    attachments.push({
      filename: fileName,
      contentType: attachment.type || "application/octet-stream",
      content: Buffer.from(await attachment.arrayBuffer()),
    });
  }

  assertMailConfig();

  const smtpResult = await sendMail({
    to: contactTo,
    replyTo: sanitizeEmailHeader(email),
    subject: `[Site DMS] ${subject} - ${name}`,
    text: buildTextEmail({ name, email, subject, message, attachments }),
    html: buildHtmlEmail({ name, email, subject, message, attachments }),
    attachments,
  });

  console.info(`[contact] Email aceito pelo SMTP para ${contactTo}. ${smtpResult}`);

  sendJson(res, 200, { ok: true, message: "Mensagem enviada com sucesso." });
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  const pathname = decodeURIComponent(url.pathname);
  const normalizedPath = normalize(pathname === "/" ? "/index.html" : pathname).replace(/^[/\\]+/, "");
  const publicPath = normalizedPath.replace(/\\/g, "/");
  const filePath = resolve(rootDir, normalizedPath);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, securityHeaders);
    res.end("Forbidden");
    return;
  }

  if (isSensitivePublicPath(publicPath)) {
    res.writeHead(403, { ...securityHeaders, "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { ...securityHeaders, "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const cacheControl = [".html", ".css", ".js", ".json"].includes(ext)
    ? "no-store"
    : "public, max-age=3600";
  const headers = {
    ...securityHeaders,
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": cacheControl,
  };

  res.writeHead(200, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }

  createReadStream(filePath).pipe(res);
}

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  const content = statSync(filePath).isFile() ? readFileSync(filePath, "utf8") : "";

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function assertMailConfig() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Config SMTP incompleta: ${missing.join(", ")}`);
    error.statusCode = 503;
    throw error;
  }
}

async function sendMail({ to, replyTo, subject, text, html, attachments }) {
  const host = process.env.SMTP_HOST;
  const portNumber = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const startTls = String(process.env.SMTP_STARTTLS || "true").toLowerCase() !== "false";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.CONTACT_FROM || user;
  const domain = process.env.SMTP_DOMAIN || "dmsocioambiental.com";

  let socket = secure
    ? tls.connect({ host, port: portNumber, servername: host })
    : net.connect({ host, port: portNumber });

  const client = createSmtpClient(socket);
  await client.expect(220);
  await client.command(`EHLO ${domain}`, 250);

  if (!secure && startTls) {
    await client.command("STARTTLS", 220);
    socket = tls.connect({ socket, servername: host });
    client.setSocket(socket);
    await client.command(`EHLO ${domain}`, 250);
  }

  await client.command("AUTH LOGIN", 334);
  await client.command(Buffer.from(user).toString("base64"), 334);
  await client.command(Buffer.from(pass).toString("base64"), 235);
  await client.command(`MAIL FROM:<${from}>`, 250);
  await client.command(`RCPT TO:<${to}>`, [250, 251]);
  await client.command("DATA", 354);
  await client.writeData(buildMimeMessage({ from, to, replyTo, subject, text, html, attachments }));
  const result = await client.expect(250);
  await client.command("QUIT", 221).catch(() => {});
  socket.end();
  return result.trim();
}

function createSmtpClient(socket) {
  let buffer = "";
  let pending = [];

  socket.setEncoding("utf8");
  socket.on("data", (chunk) => {
    buffer += chunk;
    flush();
  });
  socket.on("error", (error) => {
    pending.splice(0).forEach(({ reject }) => reject(error));
  });

  function flush() {
    while (true) {
      const end = findSmtpReplyEnd(buffer);
      if (end === -1 || !pending.length) return;
      const reply = buffer.slice(0, end);
      buffer = buffer.slice(end);
      pending.shift().resolve(reply);
    }
  }

  return {
    setSocket(nextSocket) {
      socket.removeAllListeners("data");
      socket = nextSocket;
      socket.setEncoding("utf8");
      socket.on("data", (chunk) => {
        buffer += chunk;
        flush();
      });
      socket.on("error", (error) => {
        pending.splice(0).forEach(({ reject }) => reject(error));
      });
    },
    async expect(expectedCodes) {
      const reply = await new Promise((resolveReply, rejectReply) => {
        pending.push({ resolve: resolveReply, reject: rejectReply });
        flush();
      });
      const code = Number(reply.slice(0, 3));
      const codes = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes];
      if (!codes.includes(code)) throw new Error(`SMTP inesperado: ${reply.trim()}`);
      return reply;
    },
    async command(command, expectedCodes) {
      socket.write(`${command}\r\n`);
      return this.expect(expectedCodes);
    },
    async writeData(message) {
      socket.write(`${dotStuff(message)}\r\n.\r\n`);
    },
  };
}

function findSmtpReplyEnd(text) {
  const lines = text.split(/\r\n/);
  let offset = 0;
  for (const line of lines) {
    if (!line) return -1;
    offset += line.length + 2;
    if (/^\d{3} /.test(line)) return offset;
  }
  return -1;
}

function buildMimeMessage({ from, to, replyTo, subject, text, html, attachments }) {
  const mixedBoundary = `mixed_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const altBoundary = `alt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const headers = [
    `From: DMS Site <${from}>`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeMimeWord(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
  ];

  const parts = [
    ...headers,
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
    parts.push(
      "",
      `--${mixedBoundary}`,
      `Content-Type: ${attachment.contentType}; name="${escapeHeader(attachment.filename)}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${escapeHeader(attachment.filename)}"`,
      "",
      attachment.content.toString("base64").replace(/.{1,76}/g, "$&\r\n").trim()
    );
  }

  parts.push("", `--${mixedBoundary}--`, "");
  return parts.join("\r\n");
}

function buildTextEmail({ name, email, subject, message, attachments }) {
  return [
    "Novo contato pelo site DMS",
    "",
    `Nome: ${name}`,
    `Email: ${email}`,
    `Assunto: ${subject}`,
    `Anexos: ${attachments.length ? attachments.map((item) => item.filename).join(", ") : "nenhum"}`,
    "",
    "Mensagem:",
    message,
  ].join("\n");
}

function buildHtmlEmail({ name, email, subject, message, attachments }) {
  return `
    <h2>Novo contato pelo site DMS</h2>
    <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
    <p><strong>Anexos:</strong> ${attachments.length ? attachments.map((item) => escapeHtml(item.filename)).join(", ") : "nenhum"}</p>
    <hr />
    <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
  `;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const current = rateLimit.get(ip) || [];
  const fresh = current.filter((timestamp) => now - timestamp < rateLimitWindowMs);
  if (fresh.length >= maxRequestsPerWindow) {
    rateLimit.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  rateLimit.set(ip, fresh);
  return true;
}

function cleanText(value, maxLength) {
  return String(value || "").trim().replace(/\0/g, "").slice(0, maxLength);
}

function isValidName(value) {
  const name = cleanText(value, 120).replace(/\s+/g, " ");
  const letters = name.match(/\p{L}/gu) || [];

  if (name.length < 2 || letters.length < 2) return false;
  if (/[<>{}[\]\\]/.test(name)) return false;
  if (/(https?:\/\/|www\.|@)/i.test(name)) return false;
  if (/([^\s])\1{5,}/i.test(name)) return false;
  if (/[^\p{L}\p{M}\s'.-]/u.test(name)) return false;

  return true;
}

function isValidEmail(value) {
  const email = cleanText(value, 160);
  if (/[\r\n]/.test(email)) return false;
  return /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/.test(email);
}

function sanitizeEmailHeader(value) {
  return cleanText(value, 160).replace(/[\r\n<>"]/g, "");
}

function looksLikeSpam(value) {
  const text = cleanText(value, 4000);
  const linkMatches = text.match(/https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|info|xyz|top|click|shop|online)\b/gi) || [];
  const suspiciousTerms = text.match(/\b(viagra|casino|bet|crypto|forex|loan|winner|prize)\b/gi) || [];

  if (linkMatches.length > 2) return true;
  if (linkMatches.length > 0 && suspiciousTerms.length > 0) return true;
  if (suspiciousTerms.length > 3) return true;

  return false;
}

function sanitizeFileName(name) {
  return String(name).replace(/[^\w.\-() ]+/g, "_").slice(0, 160);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { ...securityHeaders, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function isSensitivePublicPath(publicPath) {
  const path = String(publicPath || "").replace(/\\/g, "/");
  const fileName = path.split("/").pop() || "";
  return sensitivePrefixes.some((prefix) => path.startsWith(prefix))
    || sensitiveFilePatterns.some((pattern) => pattern.test(fileName));
}

function dotStuff(message) {
  return message.replace(/\r?\n\./g, "\r\n..");
}

function encodeMimeWord(value) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function escapeHeader(value) {
  return String(value).replace(/["\r\n]/g, "_");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
