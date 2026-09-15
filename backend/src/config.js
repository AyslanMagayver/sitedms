import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_ALLOWED_ORIGINS = [
  "https://dmsocioambiental.com",
  "https://www.dmsocioambiental.com",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

const REQUIRED_SMTP_SETTINGS = {
  SMTP_HOST: "host",
  SMTP_PORT: "port",
  SMTP_USER: "user",
  SMTP_PASS: "pass",
};

export function loadEnvFile(filePath = join(backendRoot, ".env")) {
  if (existsSync(filePath)) process.loadEnvFile(filePath);
}

export function loadConfig(env = process.env) {
  const smtpUser = env.SMTP_USER || undefined;

  return Object.freeze({
    port: toInteger(env.PORT) ?? 3000,
    allowedOrigins: parseList(env.ALLOWED_ORIGINS) ?? DEFAULT_ALLOWED_ORIGINS,
    trustProxy: toBoolean(env.TRUST_PROXY, false),
    rateLimit: Object.freeze({
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    }),
    contact: Object.freeze({
      to: env.CONTACT_TO || "contato@dmsocioambiental.com",
      maxRequestBytes: 8 * 1024 * 1024,
      maxAttachmentBytes: 5 * 1024 * 1024,
    }),
    smtp: Object.freeze({
      host: env.SMTP_HOST || undefined,
      port: toInteger(env.SMTP_PORT),
      secure: toBoolean(env.SMTP_SECURE, false),
      startTls: String(env.SMTP_STARTTLS ?? "").toLowerCase() !== "false",
      user: smtpUser,
      pass: env.SMTP_PASS || undefined,
      from: env.CONTACT_FROM || smtpUser,
      domain: env.SMTP_DOMAIN || "dmsocioambiental.com",
      timeoutMs: 30 * 1000,
    }),
  });
}

export function getMissingSmtpSettings(smtpConfig) {
  return Object.entries(REQUIRED_SMTP_SETTINGS)
    .filter(([, key]) => !smtpConfig[key])
    .map(([envName]) => envName);
}

function toInteger(value) {
  const number = Number.parseInt(value, 10);
  return Number.isNaN(number) ? undefined : number;
}

function toBoolean(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function parseList(value) {
  if (!value) return undefined;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
