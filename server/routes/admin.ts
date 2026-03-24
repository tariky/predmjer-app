import { Database } from "bun:sqlite";
import { requireAdmin } from "../auth/middleware";

export function createAdminRoutes(db: Database) {
  return {
    "/api/admin/companies": {
      GET(req: Request) {
        const auth = requireAdmin(db, req);
        if (auth instanceof Response) return auth;

        const companies = db.query("SELECT * FROM companies ORDER BY name").all();
        return Response.json(companies);
      },
      async POST(req: Request) {
        const auth = requireAdmin(db, req);
        if (auth instanceof Response) return auth;

        const body = await req.json();
        const { name, address = "", phone = "", email = "", subscription_expires_at = null } = body;

        if (!name) return Response.json({ error: "Name required" }, { status: 400 });

        const company = db
          .query(
            "INSERT INTO companies (name, address, phone, email, subscription_expires_at) VALUES (?, ?, ?, ?, ?) RETURNING *"
          )
          .get(name, address, phone, email, subscription_expires_at);

        return Response.json(company, { status: 201 });
      },
    },
    "/api/admin/companies/:id": {
      async PUT(req: Request) {
        const auth = requireAdmin(db, req);
        if (auth instanceof Response) return auth;

        const id = parseInt(req.params.id);
        const body = await req.json();
        const { name, address, phone, email, subscription_expires_at } = body;

        const existing = db.query("SELECT * FROM companies WHERE id = ?").get(id);
        if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) { updates.push("name = ?"); values.push(name); }
        if (address !== undefined) { updates.push("address = ?"); values.push(address); }
        if (phone !== undefined) { updates.push("phone = ?"); values.push(phone); }
        if (email !== undefined) { updates.push("email = ?"); values.push(email); }
        if (subscription_expires_at !== undefined) {
          updates.push("subscription_expires_at = ?");
          values.push(subscription_expires_at);
        }

        if (updates.length === 0) {
          return Response.json(existing);
        }

        values.push(id);
        const result = db
          .query(`UPDATE companies SET ${updates.join(", ")} WHERE id = ? RETURNING *`)
          .get(...values);

        return Response.json(result);
      },
      DELETE(req: Request) {
        const auth = requireAdmin(db, req);
        if (auth instanceof Response) return auth;

        const id = parseInt(req.params.id);
        const result = db.query("DELETE FROM companies WHERE id = ? RETURNING id").get(id);
        if (!result) return Response.json({ error: "Not found" }, { status: 404 });

        return Response.json({ ok: true });
      },
    },
    "/api/admin/companies/:id/logo": {
      async POST(req: Request) {
        const auth = requireAdmin(db, req);
        if (auth instanceof Response) return auth;

        const id = parseInt(req.params.id);
        const formData = await req.formData();
        const file = formData.get("logo") as File | null;

        if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

        const ext = file.name.split(".").pop() || "png";
        const filename = `logo-${id}-${Date.now()}.${ext}`;
        const path = `./data/uploads/${filename}`;

        const { mkdirSync, existsSync } = await import("fs");
        if (!existsSync("./data/uploads")) {
          mkdirSync("./data/uploads", { recursive: true });
        }

        await Bun.write(path, file);

        const company = db
          .query("UPDATE companies SET logo_url = ? WHERE id = ? RETURNING *")
          .get(`/uploads/${filename}`, id);

        return Response.json(company);
      },
    },
    "/api/admin/users": {
      GET(req: Request) {
        const auth = requireAdmin(db, req);
        if (auth instanceof Response) return auth;

        const users = db
          .query(
            `SELECT u.id, u.username, u.display_name, u.role, u.company_id, u.created_at, c.name as company_name
             FROM users u LEFT JOIN companies c ON u.company_id = c.id ORDER BY u.username`
          )
          .all();

        return Response.json(users);
      },
      async POST(req: Request) {
        const auth = requireAdmin(db, req);
        if (auth instanceof Response) return auth;

        const body = await req.json();
        const { username, password, display_name, role = "user", company_id } = body;

        if (!username || !password || !display_name) {
          return Response.json({ error: "Username, password, and display_name required" }, { status: 400 });
        }

        const hash = await Bun.password.hash(password, { algorithm: "bcrypt" });
        try {
          const user = db
            .query(
              "INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?) RETURNING id, username, display_name, role, company_id, created_at"
            )
            .get(username, hash, display_name, role, company_id || null);

          return Response.json(user, { status: 201 });
        } catch (e: any) {
          if (e.message?.includes("UNIQUE")) {
            return Response.json({ error: "Username already exists" }, { status: 409 });
          }
          throw e;
        }
      },
    },
    "/api/admin/users/:id": {
      async PUT(req: Request) {
        const auth = requireAdmin(db, req);
        if (auth instanceof Response) return auth;

        const id = parseInt(req.params.id);
        const body = await req.json();
        const { display_name, role, company_id, password } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (display_name !== undefined) { updates.push("display_name = ?"); values.push(display_name); }
        if (role !== undefined) { updates.push("role = ?"); values.push(role); }
        if (company_id !== undefined) { updates.push("company_id = ?"); values.push(company_id); }
        if (password) {
          const hash = await Bun.password.hash(password, { algorithm: "bcrypt" });
          updates.push("password_hash = ?");
          values.push(hash);
        }

        if (updates.length === 0) {
          const user = db.query("SELECT id, username, display_name, role, company_id, created_at FROM users WHERE id = ?").get(id);
          return Response.json(user);
        }

        values.push(id);
        const user = db
          .query(`UPDATE users SET ${updates.join(", ")} WHERE id = ? RETURNING id, username, display_name, role, company_id, created_at`)
          .get(...values);

        if (!user) return Response.json({ error: "Not found" }, { status: 404 });
        return Response.json(user);
      },
      DELETE(req: Request) {
        const auth = requireAdmin(db, req);
        if (auth instanceof Response) return auth;

        const id = parseInt(req.params.id);
        const result = db.query("DELETE FROM users WHERE id = ? RETURNING id").get(id);
        if (!result) return Response.json({ error: "Not found" }, { status: 404 });

        return Response.json({ ok: true });
      },
    },
  };
}
