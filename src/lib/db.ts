import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve("./database.sqlite");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    initializeDb(db);
  }
  return db;
}

function initializeDb(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      x_wins INTEGER NOT NULL DEFAULT 0,
      o_wins INTEGER NOT NULL DEFAULT 0,
      draws INTEGER NOT NULL DEFAULT 0
    );
  `);

  const row = database.prepare("SELECT id FROM scores WHERE id = 1").get();
  if (!row) {
    database
      .prepare(
        "INSERT INTO scores (id, x_wins, o_wins, draws) VALUES (1, 0, 0, 0)"
      )
      .run();
  }
}
