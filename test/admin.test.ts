import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";
import { createAuthRoutes } from "../server/routes/auth";
import { createAdminRoutes } from "../server/routes/admin";

let db: Database;
let baseUrl: string;
let server: any;
let adminCookie: string;
let userCookie: string;

beforeAll(async () => {
  db = new Database(":memory:");
  createSchema(db);

  const hash = await Bun.password.hash("test123", { algorithm: "bcrypt" });
  db.query("INSERT INTO companies (name) VALUES (?)").run("Existing Co");
  db.query(
    "INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)"
  ).run("admin", hash, "Admin", "super_admin");
  db.query(
    "INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)"
  ).run("user1", hash, "User 1", "user", 1);

  const authRoutes = createAuthRoutes(db);
  const adminRoutes = createAdminRoutes(db);

  server = Bun.serve({
    port: 0,
    routes: { ...authRoutes, ...adminRoutes },
  });
  baseUrl = `http://localhost:${server.port}`;

  // Login as admin
  let res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "test123" }),
  });
  adminCookie = res.headers.get("set-cookie")!.split(";")[0];

  // Login as user
  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user1", password: "test123" }),
  });
  userCookie = res.headers.get("set-cookie")!.split(";")[0];
});

afterAll(() => {
  server?.stop();
  db.close();
});

describe("Companies CRUD", () => {
  test("admin can create company", async () => {
    const res = await fetch(`${baseUrl}/api/admin/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ name: "New Co", address: "Addr", phone: "123", email: "new@co.com" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("New Co");
  });

  test("admin can list companies", async () => {
    const res = await fetch(`${baseUrl}/api/admin/companies`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  test("admin can update company with subscription date", async () => {
    const res = await fetch(`${baseUrl}/api/admin/companies/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ name: "Updated Co", subscription_expires_at: "2027-01-01T00:00:00.000Z" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated Co");
    expect(data.subscription_expires_at).toBe("2027-01-01T00:00:00.000Z");
  });

  test("regular user cannot access admin routes", async () => {
    const res = await fetch(`${baseUrl}/api/admin/companies`, {
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(403);
  });
});

describe("Users CRUD", () => {
  test("admin can create user", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        username: "newuser",
        password: "pass123",
        display_name: "New User",
        role: "user",
        company_id: 1,
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.username).toBe("newuser");
    expect(data.password_hash).toBeUndefined();
  });

  test("admin can list users", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(3);
  });
});
