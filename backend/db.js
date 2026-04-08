const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "coeff_manager.db");
const db = new DatabaseSync(dbPath);

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
    processed_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const wrapper = {
  prepare(sql) {
    const stmt = db.prepare(sql);
    return {
      run(...args) { return stmt.run(...args); },
      get(...args) { return stmt.get(...args); },
      all(...args) { return stmt.all(...args); },
    };
  },
  exec(sql) { return db.exec(sql); },
};

module.exports = wrapper;
