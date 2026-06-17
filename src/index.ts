import { buildBot } from "./bot.js";
import { initDb } from "./storage.js";

// Runtime entry (dist/index.js). BOT_TOKEN is injected at runtime as a secret.
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is required");
  process.exit(1);
}

const bot = buildBot(token);
await initDb();
bot.start();
