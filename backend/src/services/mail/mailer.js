import net from "node:net";
import tls from "node:tls";
import { getMissingSmtpSettings } from "../../config.js";
import { buildMimeMessage } from "./mime-message.js";
import { createSmtpClient } from "./smtp-client.js";

export function createMailer(smtpConfig) {
  return {
    getMissingSettings() {
      return getMissingSmtpSettings(smtpConfig);
    },

    async send({ to, replyTo, subject, text, html, attachments = [] }) {
      const { host, port, secure, startTls, user, pass, from, domain, timeoutMs } = smtpConfig;

      const socket = secure
        ? tls.connect({ host, port, servername: host })
        : net.connect({ host, port });
      const client = createSmtpClient(socket, { timeoutMs });

      try {
        await client.expect(220);
        await client.command(`EHLO ${domain}`, 250);

        if (!secure && startTls) {
          await client.command("STARTTLS", 220);
          client.setSocket(tls.connect({ socket: client.socket, servername: host }));
          await client.command(`EHLO ${domain}`, 250);
        }

        await client.command("AUTH LOGIN", 334);
        await client.command(Buffer.from(user).toString("base64"), 334);
        await client.command(Buffer.from(pass).toString("base64"), 235);
        await client.command(`MAIL FROM:<${from}>`, 250);
        await client.command(`RCPT TO:<${to}>`, [250, 251]);
        await client.command("DATA", 354);
        client.writeData(buildMimeMessage({ from, to, replyTo, subject, text, html, attachments }));
        const result = await client.expect(250);
        await client.command("QUIT", 221).catch(() => {});
        return result.trim();
      } finally {
        client.socket.end();
      }
    },
  };
}
