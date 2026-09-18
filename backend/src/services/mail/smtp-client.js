export function createSmtpClient(initialSocket, { timeoutMs }) {
  let socket;
  let buffer = "";
  const pending = [];

  function flush() {
    while (pending.length) {
      const end = findSmtpReplyEnd(buffer);
      if (end === -1) return;
      const reply = buffer.slice(0, end);
      buffer = buffer.slice(end);
      pending.shift().resolve(reply);
    }
  }

  function onData(chunk) {
    buffer += chunk;
    flush();
  }

  function onError(error) {
    pending.splice(0).forEach(({ reject }) => reject(error));
  }

  function onTimeout() {
    socket.destroy(new Error("Tempo esgotado aguardando o servidor SMTP."));
  }

  function attach(nextSocket) {
    if (socket) {
      socket.removeListener("data", onData);
      socket.removeListener("timeout", onTimeout);
      socket.setTimeout(0);
    }
    socket = nextSocket;
    socket.setEncoding("utf8");
    socket.setTimeout(timeoutMs);
    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("timeout", onTimeout);
  }

  attach(initialSocket);

  return {
    get socket() {
      return socket;
    },
    setSocket: attach,
    async expect(expectedCodes) {
      const reply = await new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
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
    writeData(message) {
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

function dotStuff(message) {
  return message.replace(/\r?\n\./g, "\r\n..");
}
