import { createBot, inlineKeyboard, inlineButton, type BotContext } from "@agntdev/bot-toolkit";

// The per-chat session shape (ephemeral conversation state only). Extend as the
// bot grows. Durable domain data must NOT live here — use the toolkit's
// persistent storage (see AGENTS.md).
export interface Session {
  // example: step?: "awaiting_amount";
}

const WELCOME_TEXT = [
  "Welcome to AGNTDEV Bot!",
  "",
  "I can help you manage your tasks, get information, and more.",
  "Use the menu below to get started, or type /help for a list of commands.",
].join("\n");

const MAIN_MENU = inlineKeyboard([
  [inlineButton("Help", "menu:help")],
  [inlineButton("About", "menu:about")],
]);

const HELP_TEXT = [
  "Available commands:",
  "",
  "/start — Start the bot and see the main menu",
  "/help — Show this help message",
].join("\n");

const KNOWN_COMMANDS = new Set(["start", "help"]);

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
    await ctx.reply(WELCOME_TEXT, { reply_markup: MAIN_MENU });
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_TEXT);
  });

  bot.callbackQuery("menu:help", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      "Use /start to see the main menu or /help to list all available commands.",
    );
  });

  bot.callbackQuery("menu:about", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      "AGNTDEV Bot — built with grammY and @agntdev/bot-toolkit.",
    );
  });

  bot.on("message:text").filter(
    (ctx: BotContext<Session>) => {
      const msg = ctx.message;
      if (!msg?.text) return false;
      const entity = msg.entities?.[0];
      if (entity?.type === "bot_command" && entity.offset === 0) {
        const cmd = msg.text.substring(entity.offset + 1, entity.offset + entity.length);
        const atIndex = cmd.indexOf("@");
        const cmdName = atIndex === -1 ? cmd : cmd.substring(0, atIndex);
        return !KNOWN_COMMANDS.has(cmdName);
      }
      return false;
    },
    async (ctx) => {
      await ctx.reply(
        "Sorry, I don't recognize that command. Try /help to see what I can do.",
      );
    },
  );

  bot.catch(async (err) => {
    console.error("Unhandled error:", err.error);
    try {
      await err.ctx.reply("Something went wrong. Please try again later.");
    } catch {
      // If we can't even reply, just log it
    }
  });

  return bot;
}
