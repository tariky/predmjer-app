import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";
import { createAuthRoutes } from "../server/routes/auth";
import { createLibraryRoutes } from "../server/routes/library";

let db: Database;
let baseUrl: string;
let server: any;
let userCookie: string;
let user2Cookie: string;

beforeAll(async () => {
  db = new Database(":memory:");
  createSchema(db);

  db.query("INSERT INTO companies (name, subscription_expires_at) VALUES (?, ?)").run("Test Co", "2030-01-01T00:00:00.000Z");
  const hash = await Bun.password.hash("test123", { algorithm: "bcrypt" });
  db.query("INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)").run("user1", hash, "User 1", "user", 1);
  db.query("INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)").run("user2", hash, "User 2", "user", 1);

  // Seed a system group
  db.query("INSERT INTO item_groups (name, created_by) VALUES (?, NULL)").run("Zidarski radovi");
  db.query("INSERT INTO library_items (group_id, name, description, unit, unit_price, created_by) VALUES (?, ?, ?, ?, ?, NULL)").run(1, "System Item", "Desc", "m²", 10.0);

  const authRoutes = createAuthRoutes(db);
  const libraryRoutes = createLibraryRoutes(db);

  server = Bun.serve({ port: 0, routes: { ...authRoutes, ...libraryRoutes } });
  baseUrl = `http://localhost:${server.port}`;

  let res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user1", password: "test123" }),
  });
  userCookie = res.headers.get("set-cookie")!.split(";")[0];

  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user2", password: "test123" }),
  });
  user2Cookie = res.headers.get("set-cookie")!.split(";")[0];
});

afterAll(() => {
  server?.stop();
  db.close();
});

describe("Item Groups", () => {
  test("can list all groups", async () => {
    const res = await fetch(`${baseUrl}/api/item-groups`, { headers: { Cookie: userCookie } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  test("can create a group", async () => {
    const res = await fetch(`${baseUrl}/api/item-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "My Group" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("My Group");
    expect(data.created_by).toBe(1);
  });

  test("cannot delete system group", async () => {
    const res = await fetch(`${baseUrl}/api/item-groups/1`, {
      method: "DELETE",
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(403);
  });

  test("cannot delete another user's group", async () => {
    const res = await fetch(`${baseUrl}/api/item-groups/2`, {
      method: "DELETE",
      headers: { Cookie: user2Cookie },
    });
    expect(res.status).toBe(403);
  });
});

describe("Library Items", () => {
  test("can list items by group", async () => {
    const res = await fetch(`${baseUrl}/api/library-items?group_id=1`, {
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  test("can create item", async () => {
    const res = await fetch(`${baseUrl}/api/library-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ group_id: 1, name: "My Item", description: "Desc", unit: "kom", unit_price: 5.0 }),
    });
    expect(res.status).toBe(201);
  });

  test("cannot edit system item", async () => {
    const res = await fetch(`${baseUrl}/api/library-items/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "Renamed" }),
    });
    expect(res.status).toBe(403);
  });
});
