import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "..", "data", "dicebot.db");

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

async function getDb(): Promise<Database> {
  if (db) return db;

  SQL = await initSqlJs();

  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  let buffer: Uint8Array | undefined;
  if (existsSync(DB_PATH)) {
    buffer = new Uint8Array(readFileSync(DB_PATH));
  }

  db = new SQL.Database(buffer);

  db.run(
    "CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY CHECK(id=1), count INTEGER NOT NULL)",
  );

  const existing = db.exec("SELECT id FROM counter WHERE id = 1");
  if (existing.length === 0 || existing[0].values.length === 0) {
    db.run("INSERT INTO counter (id, count) VALUES (1, 0)");
    saveDb();
  }

  return db;
}

function saveDb(): void {
  if (!db) return;
  const data = Buffer.from(db.export());
  writeFileSync(DB_PATH, data);
}

export async function incrementAndGet(): Promise<number> {
  const database = await getDb();
  database.run("BEGIN TRANSACTION");
  database.run("UPDATE counter SET count = count + 1 WHERE id = 1");
  const result = database.exec("SELECT count FROM counter WHERE id = 1");
  database.run("COMMIT");
  saveDb();

  return result[0].values[0][0] as number;
}

export async function getCount(): Promise<number> {
  const database = await getDb();
  const result = database.exec("SELECT count FROM counter WHERE id = 1");
  if (result.length === 0 || result[0].values.length === 0) {
    return 0;
  }
  return result[0].values[0][0] as number;
}