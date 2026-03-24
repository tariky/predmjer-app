import { existsSync, unlinkSync } from "fs";

const dbPath = process.env.DB_PATH || "./data/app.db";

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
  // Remove WAL and SHM files if they exist
  if (existsSync(dbPath + "-wal")) unlinkSync(dbPath + "-wal");
  if (existsSync(dbPath + "-shm")) unlinkSync(dbPath + "-shm");
  console.log("Database wiped.");
} else {
  console.log("No database found.");
}
