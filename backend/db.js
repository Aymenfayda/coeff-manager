const bcrypt = require("bcryptjs");

const IS_PG = !!process.env.DATABASE_URL;

// ── PostgreSQL ────────────────────────────────────────────────────────────────
let pool;
if (IS_PG) {
  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

// ── SQLite (local dev) ────────────────────────────────────────────────────────
let sqliteDb;
if (!IS_PG) {
  const { DatabaseSync } = require("node:sqlite");
  const path = require("path");
  const fs = require("fs");
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  sqliteDb = new DatabaseSync(path.join(dataDir, "coeff_manager.db"));
}

// ── Unified async query ───────────────────────────────────────────────────────
// Always returns an array of row objects.
// Use $1, $2... placeholders in SQL regardless of driver.
async function query(sql, params = []) {
  if (IS_PG) {
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
    // Convert $1, $2... → ? for SQLite
    const sqliteSql = sql.replace(/\$\d+/g, "?");
    const verb = sqliteSql.trimStart().split(/\s+/)[0].toUpperCase();
    const hasReturning = /\bRETURNING\b/i.test(sqliteSql);
    const stmt = sqliteDb.prepare(sqliteSql);
    if (verb === "SELECT" || hasReturning) {
      return stmt.all(...params);
    } else {
      stmt.run(...params);
      return [];
    }
  }
}

// ── Schema init ───────────────────────────────────────────────────────────────
async function init() {
  if (IS_PG) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coefficients (
        id SERIAL PRIMARY KEY,
        supplier TEXT NOT NULL,
        brand TEXT NOT NULL DEFAULT '',
        brand_coeff REAL,
        family TEXT NOT NULL,
        family_coeff REAL NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
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
        result_data TEXT,
        processed_at TIMESTAMPTZ DEFAULT NOW(),
        processed_by TEXT DEFAULT 'admin'
      );
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  } else {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS coefficients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier TEXT NOT NULL,
        brand TEXT NOT NULL DEFAULT '',
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
        result_data TEXT,
        processed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        processed_by TEXT DEFAULT 'admin'
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Migrations for existing local databases
    try { sqliteDb.exec("ALTER TABLE processing_history ADD COLUMN result_data TEXT"); } catch (_) {}
    try { sqliteDb.exec("ALTER TABLE processing_history ADD COLUMN processed_by TEXT DEFAULT 'admin'"); } catch (_) {}
  }

  // Seed default admin on first launch
  const rows = await query("SELECT COUNT(*) AS c FROM users");
  if (parseInt(rows[0].c, 10) === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    await query(
      "INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3)",
      ["admin", hash, 1]
    );
    console.log("[DB] Default admin created — username: admin / password: admin123");
  }

  console.log(`[DB] Connected (${IS_PG ? "PostgreSQL" : "SQLite"})`);
}

module.exports = { query, init };
