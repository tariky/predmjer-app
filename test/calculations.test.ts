import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";
import { createAuthRoutes } from "../server/routes/auth";
import { createEstimateRoutes } from "../server/routes/estimates";
import { createCalculationRoutes } from "../server/routes/calculations";

let db: Database;
let baseUrl: string;
let server: any;
let userCookie: string;

beforeAll(async () => {
  db = new Database(":memory:");
  createSchema(db);

  db.query("INSERT INTO companies (name, subscription_expires_at) VALUES (?, ?)").run("Test Co", "2030-01-01");
  const hash = await Bun.password.hash("test123", { algorithm: "bcrypt" });
  db.query("INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)").run("user1", hash, "User 1", "user", 1);

  // Create estimate with group and item
  db.query("INSERT INTO estimates (company_id, name, status, created_by) VALUES (?, ?, ?, ?)").run(1, "Test", "draft", 1);
  db.query("INSERT INTO estimate_groups (estimate_id, group_name, sort_order) VALUES (?, ?, ?)").run(1, "Zidarski", 0);
  db.query("INSERT INTO estimate_items (estimate_group_id, name, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?)").run(1, "Zidanje", "m²", 0, 45, 0);

  const authRoutes = createAuthRoutes(db);
  const estimateRoutes = createEstimateRoutes(db);
  const calcRoutes = createCalculationRoutes(db);

  server = Bun.serve({ port: 0, routes: { ...authRoutes, ...estimateRoutes, ...calcRoutes } });
  baseUrl = `http://localhost:${server.port}`;

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user1", password: "test123" }),
  });
  userCookie = res.headers.get("set-cookie")!.split(";")[0];
});

afterAll(() => { server?.stop(); db.close(); });

describe("Calculations CRUD", () => {
  test("can add calculation to item", async () => {
    const res = await fetch(`${baseUrl}/api/estimate-items/1/calculations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ description: "Zid sjever", field_a: 8.5, field_b: 2.8, multiplier: 1 }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.description).toBe("Zid sjever");
    expect(data.result).toBeCloseTo(23.8);
  });

  test("can add calculation with negative multiplier", async () => {
    const res = await fetch(`${baseUrl}/api/estimate-items/1/calculations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ description: "Oduzmi prozor", field_a: 1.2, field_b: 1.4, multiplier: -2 }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.result).toBeCloseTo(-3.36);
  });

  test("can list calculations for item", async () => {
    const res = await fetch(`${baseUrl}/api/estimate-items/1/calculations`, {
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(2);
  });

  test("can update calculation", async () => {
    const res = await fetch(`${baseUrl}/api/item-calculations/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ field_a: 9.0, field_b: 2.8 }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.result).toBeCloseTo(25.2);
  });

  test("can apply calculations to item quantity", async () => {
    const res = await fetch(`${baseUrl}/api/estimate-items/1/calculations/apply`, {
      method: "POST",
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    // 25.2 + (-3.36) = 21.84
    expect(data.quantity).toBeCloseTo(21.84);
  });

  test("can delete calculation", async () => {
    const res = await fetch(`${baseUrl}/api/item-calculations/2`, {
      method: "DELETE",
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(200);

    const listRes = await fetch(`${baseUrl}/api/estimate-items/1/calculations`, {
      headers: { Cookie: userCookie },
    });
    const data = await listRes.json();
    expect(data.length).toBe(1);
  });
});
