import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";
import { createAuthRoutes } from "../server/routes/auth";
import { createEstimateRoutes } from "../server/routes/estimates";

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

  const authRoutes = createAuthRoutes(db);
  const estimateRoutes = createEstimateRoutes(db);

  server = Bun.serve({ port: 0, routes: { ...authRoutes, ...estimateRoutes } });
  baseUrl = `http://localhost:${server.port}`;

  const res = await fetch(`${baseUrl}/api/auth/login`, {
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

describe("Estimates CRUD", () => {
  test("can create estimate", async () => {
    const res = await fetch(`${baseUrl}/api/estimates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "Test Estimate", client_name: "Client", location: "Sarajevo" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("Test Estimate");
    expect(data.status).toBe("draft");
  });

  test("can list company estimates", async () => {
    const res = await fetch(`${baseUrl}/api/estimates`, { headers: { Cookie: userCookie } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(1);
  });

  test("can get estimate with groups and items", async () => {
    // Add a group first
    await fetch(`${baseUrl}/api/estimates/1/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ group_name: "Zidarski radovi", sort_order: 0 }),
    });

    // Add an item
    await fetch(`${baseUrl}/api/estimate-groups/1/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "Zidanje", description: "Zidanje blok opekom", unit: "m²", quantity: 100, unit_price: 45 }),
    });

    const res = await fetch(`${baseUrl}/api/estimates/1`, { headers: { Cookie: userCookie } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.groups.length).toBe(1);
    expect(data.groups[0].items.length).toBe(1);
    expect(data.groups[0].items[0].quantity).toBe(100);
  });

  test("can change status", async () => {
    const res = await fetch(`${baseUrl}/api/estimates/1/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ status: "finished" }),
    });
    expect(res.status).toBe(200);
  });

  test("cannot edit finished estimate", async () => {
    const res = await fetch(`${baseUrl}/api/estimates/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "Changed" }),
    });
    expect(res.status).toBe(403);
  });

  test("can duplicate estimate", async () => {
    // Set back to draft first
    await fetch(`${baseUrl}/api/estimates/1/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ status: "draft" }),
    });

    const res = await fetch(`${baseUrl}/api/estimates/1/duplicate`, {
      method: "POST",
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toContain("Kopija");

    // Verify duplicated data
    const detailRes = await fetch(`${baseUrl}/api/estimates/${data.id}`, { headers: { Cookie: userCookie } });
    const detail = await detailRes.json();
    expect(detail.groups.length).toBe(1);
    expect(detail.groups[0].items.length).toBe(1);
  });
});
