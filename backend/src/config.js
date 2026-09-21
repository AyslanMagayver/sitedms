import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnvFile(filePath = join(backendRoot, ".env")) {
  if (existsSync(filePath)) process.loadEnvFile(filePath);
}

export function loadConfig(env = process.env) {
  const errors = [];

  const text = (name) => {
    const value = env[name]?.trim();
    if (!value) errors.push(`${name} não definida`);
    return value || undefined;
  };

  const port = (name) => {
    const value = text(name);
    if (value === undefined) return undefined;
    const number = Number(value);
    if (!/^\d+$/.test(value) || number < 1 || number > 65535) {
      errors.push(`${name} deve ser uma porta entre 1 e 65535`);
      return undefined;
    }
    return number;
  };

  const boolean = (name) => {
    const value = text(name)?.toLowerCase();
    if (value === undefined) return undefined;
    if (value !== "true" && value !== "false") {
      errors.push(`${name} deve ser true ou false`);
      return undefined;
    }
    return value === "true";
  };

  const list = (name) => {
    const value = text(name);
    if (value === undefined) return undefined;
    const items = value.split(",").map((item) => item.trim()).filter(Boolean);
    if (!items.length) errors.push(`${name} deve ter ao menos um valor`);
    return items;
  };

  const config = {
    port: port("PORT"),
    allowedOrigins: list("ALLOWED_ORIGINS"),
    trustProxy: boolean("TRUST_PROXY"),
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    },
    contact: {
      to: text("CONTACT_TO"),
      maxRequestBytes: 8 * 1024 * 1024,
      maxAttachmentBytes: 5 * 1024 * 1024,
    },
    smtp: {
      host: text("SMTP_HOST"),
      port: port("SMTP_PORT"),
      secure: boolean("SMTP_SECURE"),
      startTls: boolean("SMTP_STARTTLS"),
      user: text("SMTP_USER"),
      pass: text("SMTP_PASS"),
      from: text("CONTACT_FROM"),
      domain: text("SMTP_DOMAIN"),
      timeoutMs: 30 * 1000,
    },
  };

  if (errors.length) {
    throw new Error(`Configuração inválida no .env:\n- ${errors.join("\n- ")}`);
  }

  return deepFreeze(config);
}

function deepFreeze(object) {
  for (const value of Object.values(object)) {
    if (value && typeof value === "object") deepFreeze(value);
  }
  return Object.freeze(object);
}
