import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadConfig, loadEnvFile } from "./config.js";

loadEnvFile();
const config = loadConfig();
const app = createApp(config);
const server = createServer(app);

server.listen(config.port, () => {
  console.log(`API DMS rodando em http://localhost:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} recebido, encerrando a API...`);
  app.close();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
