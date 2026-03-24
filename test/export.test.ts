import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";
import { createAuthRoutes } from "../server/routes/auth";
import { createEstimateRoutes } from "../server/routes/estimates";
import { createExportRoutes } from "../server/routes/export";

let db: Database;
let baseUrl: string;
let server: any;
let userCookie: string;

beforeAll(async () => {
  db = new Database(":memory:");
  createSchema(db);

  db.query("INSERT INTO companies (name, address, phone, email, subscription_expires_at) VALUES (?, ?, ?, ?, ?)").run("Gradevinska firma d.o.o.", "Ulica 1, Sarajevo", "+387 33 123 456", "info@firma.ba", "2030-01-01");
  const hash = await Bun.password.hash("test123", { algorithm: "bcrypt" });
  db.query("INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)").run("user1", hash, "Tarik", "user", 1);

  // Create estimate with groups and items
  db.query("INSERT INTO estimates (company_id, name, client_name, location, status, created_by) VALUES (?, ?, ?, ?, ?, ?)").run(1, "Stambeni objekat", "Investitor d.o.o.", "Sarajevo", "draft", 1);
  db.query("INSERT INTO estimate_groups (estimate_id, group_name, sort_order) VALUES (?, ?, ?)").run(1, "Zemljani radovi", 0);
  db.query("INSERT INTO estimate_items (estimate_group_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)").run(1, "Siroki iskop", "Iskop zemlje III kat.", "m³", 250, 8.0, 0);
  db.query("INSERT INTO estimate_items (estimate_group_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)").run(1, "Rucni iskop", "Rucni iskop za temelje", "m³", 30, 25.0, 1);
  db.query("INSERT INTO estimate_groups (estimate_id, group_name, sort_order) VALUES (?, ?, ?)").run(1, "Betonski radovi", 1);
  db.query("INSERT INTO estimate_items (estimate_group_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)").run(2, "Podlozni beton", "MB 10 d=10cm", "m³", 15, 120.0, 0);

  const authRoutes = createAuthRoutes(db);
  const estimateRoutes = createEstimateRoutes(db);
  const exportRoutes = createExportRoutes(db);

  server = Bun.serve({ port: 0, routes: { ...authRoutes, ...estimateRoutes, ...exportRoutes } });
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

describe("PDF Export", () => {
  test("generates PDF for estimate", async () => {
    const res = await fetch(`${baseUrl}/api/estimates/1/export/pdf`, {
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(100);
  });
});

describe("Excel Export", () => {
  test("generates Excel for estimate", async () => {
    const res = await fetch(`${baseUrl}/api/estimates/1/export/excel`, {
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(100);
  });
});
