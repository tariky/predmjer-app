import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";

let db: Database;
let baseUrl: string;
let server: any;

beforeAll(async () => {
  db = new Database(":memory:");
  createSchema(db);
  db.query("INSERT INTO companies (name) VALUES (?)").run("Test Co");
  const hash = await Bun.password.hash("test123", { algorithm: "bcrypt" });
  db.query("INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)").run("testuser", hash, "Test User", "user", 1);
  db.query("INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)").run("admin", hash, "Admin", "super_admin");
  const { createAuthRoutes } = await import("../server/routes/auth");
  const routes = createAuthRoutes(db);
  server = Bun.serve({ port: 0, routes });
  baseUrl = `http://localhost:${server.port}`;
});

afterAll(() => { server?.stop(); db.close(); });

describe("POST /api/auth/login", () => {
  test("returns session cookie on valid credentials", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "testuser", password: "test123" }) });
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("session=");
    expect(cookie).toContain("HttpOnly");
  });
  test("returns 401 on invalid credentials", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "testuser", password: "wrong" }) });
    expect(res.status).toBe(401);
  });
  test("returns 401 on non-existent user", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "nobody", password: "test123" }) });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  test("returns user info with valid session", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "testuser", password: "test123" }) });
    const cookie = loginRes.headers.get("set-cookie")!;
    const res = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie.split(";")[0] } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe("testuser");
    expect(data.company).toBeDefined();
    expect(data.company.name).toBe("Test Co");
    expect(data.password_hash).toBeUndefined();
  });
  test("returns 401 without session", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  test("destroys session", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "testuser", password: "test123" }) });
    const cookie = loginRes.headers.get("set-cookie")!;
    const sessionCookie = cookie.split(";")[0];
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", headers: { Cookie: sessionCookie } });
    expect(logoutRes.status).toBe(200);
    const meRes = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: sessionCookie } });
    expect(meRes.status).toBe(401);
  });
});
