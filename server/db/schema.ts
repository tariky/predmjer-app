import { Database } from "bun:sqlite";

export function createSchema(db: Database) {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      logo_url TEXT,
      subscription_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'user')),
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS item_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS library_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES item_groups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS hidden_library_items (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      library_item_id INTEGER NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, library_item_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'finished')),
      notes TEXT NOT NULL DEFAULT '',
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Migration: add notes column if missing
  try { db.exec("ALTER TABLE estimates ADD COLUMN notes TEXT NOT NULL DEFAULT ''"); } catch {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_id INTEGER NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
      group_name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_group_id INTEGER NOT NULL REFERENCES estimate_groups(id) ON DELETE CASCADE,
      library_item_id INTEGER REFERENCES library_items(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS item_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_item_id INTEGER NOT NULL REFERENCES estimate_items(id) ON DELETE CASCADE,
      description TEXT NOT NULL DEFAULT '',
      field_a REAL NOT NULL DEFAULT 0,
      field_b REAL,
      field_c REAL,
      multiplier REAL NOT NULL DEFAULT 1,
      result REAL NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);
}
