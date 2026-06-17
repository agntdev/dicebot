import { createBot } from "@agntdev/bot-toolkit";

// The per-chat session shape (ephemeral conversation state only). Extend as the
// bot grows. Durable domain data must NOT live here — use the toolkit's
// persistent storage (see AGENTS.md).
export interface Session {
  // example: step?: "awaiting_amount";
}

const commands: { command: string; description: string }[] = [
  { command: "start", description: "Start the bot" },
  { command: "help", description: "Show available commands" },
];

function buildHelpText(): string {
  const lines = commands.map(
    (c) => `/${c.command} — ${c.description}`,
  );
  return ["Available commands:", ...lines].join("\n");
}

/**
 * buildBot — assembles the bot and registers every handler, but does NOT start
 * it. Shared by the runtime entry (src/index.ts) and the Tests-gate harness
 * (src/harness-entry.ts) so both exercise the exact same bot. Add new commands
 * and flows here.
 */
export function buildBot(token: string) {
  const bot = createBot<Session>(token, {
    initial: () => ({}),
  });

  bot.command("start", async (ctx) => {
    await ctx.reply("Welcome! I am ready to help.");
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(buildHelpText());
  });

  bot.on("message::bot_command", async (ctx) => {
    await ctx.reply(
      "I don't know that command. Try /help to see what I can do.",
    );
  });

  bot.catch(async (err) => {
    console.error("[agntdev-bot] unhandled error:", err.error);
    try {
      await err.ctx.reply("Something went wrong. Please try again later.");
    } catch {
      // best-effort reply; if the chat is unreachable we cannot do more
    }
  });

  return bot;
}
