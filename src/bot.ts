import { createBot, inlineKeyboard, inlineButton } from "@agntdev/bot-toolkit";
import { initDb, incrementAndGetCounter } from "./storage.js";

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

  bot.command("count", async (ctx) => {
    await initDb();
    const newCount = incrementAndGetCounter();
    await ctx.reply(`Count: ${newCount}`);
  });

  return bot;
}
