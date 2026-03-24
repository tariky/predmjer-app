import { Database } from "bun:sqlite";
import { createSchema } from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DB_PATH || "./data/app.db";
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
createSchema(db);

export default db;
