import { test, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";

let db: Database;

beforeAll(() => {
  db = new Database(":memory:");
});

afterAll(() => {
  db.close();
});

test("schema creates all tables", async () => {
  const { createSchema } = await import("../server/db/schema");
  createSchema(db);

  const tables = db
    .query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as { name: string }[];

  const tableNames = tables.map((t) => t.name);
  expect(tableNames).toContain("users");
  expect(tableNames).toContain("companies");
  expect(tableNames).toContain("item_groups");
  expect(tableNames).toContain("library_items");
  expect(tableNames).toContain("estimates");
  expect(tableNames).toContain("estimate_groups");
  expect(tableNames).toContain("estimate_items");
  expect(tableNames).toContain("sessions");
});

test("can insert and query a company", async () => {
  const result = db
    .query(
      "INSERT INTO companies (name, address, phone, email) VALUES (?, ?, ?, ?) RETURNING *"
    )
    .get("Test Co", "Test Addr", "123", "test@co.com") as any;

  expect(result.name).toBe("Test Co");
  expect(result.id).toBe(1);
  expect(result.subscription_expires_at).toBeNull();
});

test("can insert user with company", async () => {
  const result = db
    .query(
      "INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?) RETURNING *"
    )
    .get("admin", "hash", "Admin", "super_admin", null) as any;

  expect(result.username).toBe("admin");
  expect(result.role).toBe("super_admin");
});

test("username must be unique", () => {
  expect(() => {
    db.query(
      "INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)"
    ).run("admin", "hash2", "Admin2", "user");
  }).toThrow();
});

test("foreign key on estimates.company_id enforced", () => {
  expect(() => {
    db.query(
      "INSERT INTO estimates (company_id, name, client_name, location, status, created_by) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(999, "Test", "Client", "Loc", "draft", 1);
  }).toThrow();
});
