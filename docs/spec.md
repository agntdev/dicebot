## Summary
A minimal Telegram bot that greets users, returns a random dice roll (1–6) and maintains a GLOBAL persisted count of rolls served. No per-user state, no external APIs, no extra features.

## Audience
Telegram users who want a tiny bot to roll a die and see how many rolls the bot has served in total.

## Core entities
- Global counter: single integer tracking total /roll invocations served.
- User (Telegram user): only used for greeting and responding; no persistent user state.

## Integrations & notification targets
- Telegram Bot API only (official HTTP API) via long polling.
- No external APIs or notification targets.

## Interaction flows
- /start
  - Reply: friendly greeting ("Hello! I can roll a dice. Use /roll to roll and /count to see total rolls.").
- /roll
  - Server action: atomically increment the global counter, generate a random integer 1–6, and reply with the number (e.g., "You rolled: 4").
  - Persist: increment saved to the global counter immediately.
- /count
  - Reply: current value of the global counter (e.g., "Total rolls served: 123").
- Unknown commands
  - Reply with short help (mention /start, /roll, /count).

User experience details:
- Use concise plain-text replies.
- Bot runs in polling mode (no webhook) for simplest deployment and to avoid external HTTPS requirements.

## Persistence
- SQLite database stored on disk (default path ./data/dicebot.db).
- Schema: single-table `counter(id INTEGER PRIMARY KEY CHECK(id=1), count INTEGER NOT NULL)` with one row id=1.
- On startup the app ensures the DB and row exist (initial count = 0).
- Atomic increment: perform the increment inside a transaction on the single process/connection so updates are serialized (UPDATE counter SET count = count + 1; SELECT count FROM counter; executed within a transaction).
- Backups: file can be copied from the data directory or mounted to persistent volume in production.

## Concurrency & reliability
- Bot runs as a single process (long-polling). That plus SQLite transactions provides reliable atomic increments for expected load.
- If you expect very-high concurrency, migrate the counter to a server DB (out of scope).

## Implementation choices
- Language: Python 3.11.
- Telegram library: python-telegram-bot v20 (async API).
- Randomness: Python's random.randint(1,6).
- Deployment artifact: Docker container (python:3.11-slim base image) that runs the bot in polling mode.
- Configuration via environment variables: BOT_TOKEN (required), DATA_PATH (optional, default ./data/dicebot.db), LOG_LEVEL (optional, default INFO).

## Logging & monitoring
- Structured logs to stdout (INFO by default). Errors logged at ERROR.
- Exit with non-zero on unrecoverable startup errors (invalid token, DB write failure).

## Tests
- Unit tests for database counter operations (init, increment, read) and handler behavior (mock requests to handlers verifying replies and counter change).
- Smoke test instructions: run locally with BOT_TOKEN and verify /start, /roll, /count behave as expected.

## Deployment notes
- Provide Dockerfile and simple docker-compose.yml example that mounts a host directory to /data for persistence and sets BOT_TOKEN.
- Run the container as a single service; it uses long polling and requires outbound network to api.telegram.org.

## Payments
- None.

## Non-goals
- No per-user state or per-user counters.
- No webhooks, no external integrations, no analytics, no authentication beyond Telegram bot token.

## Assumptions & defaults
- Language & libs: Use Python 3.11 and python-telegram-bot v20 — common, well-supported, and concise for this scope.
  Rationale: fastest reliable implementation with async polling.
- Persistence: SQLite at ./data/dicebot.db with one counter row initialized to 0.
  Rationale: zero-dependency, file-based persistence suitable for a single-process bot.
- Polling mode (not webhook).
  Rationale: avoids HTTPS hosting and simplifies deployment for minimal bot.
- Single-process deployment (one container instance) by default.
  Rationale: simplifies atomic increments and keeps architecture minimal; documented migration path if scaled.
- Docker container deployment with a mounted volume at /data.
  Rationale: reproducible build and simple persistence mapping.
- No rate-limiting beyond Telegram limits; rely on Telegram's API limits and standard library behavior.
  Rationale: out of scope for minimal bot and unnecessary for low traffic.

