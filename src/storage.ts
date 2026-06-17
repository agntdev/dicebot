import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

const DB_PATH = resolve(process.cwd(), "data", "dicebot.db");

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

async function ensureSQL(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

function saveDb(): void {
  if (!db) return;
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(DB_PATH, db.export());
}

export async function initDb(): Promise<void> {
  const sql = await ensureSQL();

  let buffer: Uint8Array | null = null;
  if (existsSync(DB_PATH)) {
    buffer = new Uint8Array(readFileSync(DB_PATH));
  }
  db = new sql.Database(buffer);

  db.run(
    "CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY CHECK(id=1), count INTEGER NOT NULL);",
  );
  const existing = db.exec("SELECT count FROM counter WHERE id = 1;");
  if (existing.length === 0 || existing[0].values.length === 0) {
    db.run("INSERT INTO counter (id, count) VALUES (1, 0);");
  }

  saveDb();
}

function ensureDb(): Database {
  if (!db) {
    throw new Error("Database not initialised — call initDb() first");
  }
  return db;
}

export function incrementAndGetCounter(): number {
  const d = ensureDb();
  d.run("BEGIN TRANSACTION;");
  d.run("UPDATE counter SET count = count + 1;");
  const result = d.exec("SELECT count FROM counter;");
  d.run("COMMIT;");
  saveDb();
  return result[0].values[0][0] as number;
}

export function getCounter(): number {
  const d = ensureDb();
  const result = db!.exec("SELECT count FROM counter;");
  return result[0].values[0][0] as number;
}
