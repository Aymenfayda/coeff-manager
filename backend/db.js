const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "coeff_manager.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS coefficients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT "",
    brand_coeff REAL,
    family TEXT NOT NULL,
    family_coeff REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(supplier, family)
  );
  CREATE TABLE IF NOT EXISTS processing_history (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    supplier TEXT NOT NULL,
    family_column TEXT,
    total_rows INTEGER DEFAULT 0,
    rows_ok INTEGER DEFAULT 0,
    rows_calculated INTEGER DEFAULT 0,
    rows_fallback INTEGER DEFAULT 0,
    rows_unresolvable INTEGER DEFAULT 0,
    result_file TEXT,
    processed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    processed_by TEXT DEFAULT "admin"
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrations for existing DBs
try { db.exec("ALTER TABLE processing_history ADD COLUMN processed_by TEXT DEFAULT \"admin\""); } catch(_) {}
try { db.exec("ALTER TABLE processing_history ADD COLUMN result_data TEXT"); } catch(_) {}

const wrapper = {
  prepare(sql) {
    const stmt = db.prepare(sql);
    return { run(...a) { return stmt.run(...a); }, get(...a) { return stmt.get(...a); }, all(...a) { return stmt.all(...a); } };
  },
  exec(sql) { return db.exec(sql); },
};

// Seed default admin on first run
const userCount = wrapper.prepare("SELECT COUNT(*) as c FROM users").get();
if (userCount.c === 0) {
  const hash = bcrypt.hashSync("admin123", 10);
  wrapper.prepare("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)").run("admin", hash);
  console.log("[DB] Default admin created — username: admin / password: admin123");
}

module.exports = wrapper;
