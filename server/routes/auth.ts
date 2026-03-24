import { Database } from "bun:sqlite";
import { createSession, destroySession, getSessionFromCookie, sessionCookie } from "../auth/session";
import { authenticate } from "../auth/middleware";

export function createAuthRoutes(db: Database) {
  return {
    "/api/auth/login": {
      async POST(req: Request) {
        const body = await req.json();
        const { username, password } = body;
        if (!username || !password) return Response.json({ error: "Username and password required" }, { status: 400 });
        const user = db.query("SELECT id, password_hash FROM users WHERE username = ?").get(username) as { id: number; password_hash: string } | null;
        if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 });
        const valid = await Bun.password.verify(password, user.password_hash);
        if (!valid) return Response.json({ error: "Invalid credentials" }, { status: 401 });
        const token = createSession(db, user.id);
        return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(token) } });
      },
    },
    "/api/auth/logout": {
      POST(req: Request) {
        const token = getSessionFromCookie(req);
        if (token) destroySession(db, token);
        return Response.json({ ok: true }, { headers: { "Set-Cookie": "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" } });
      },
    },
    "/api/auth/me": {
      GET(req: Request) {
        const user = authenticate(db, req);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
        let company = null;
        if (user.company_id) {
          company = db.query("SELECT id, name, address, phone, email, logo_url, subscription_expires_at FROM companies WHERE id = ?").get(user.company_id);
        }
        return Response.json({ id: user.id, username: user.username, display_name: user.display_name, role: user.role, company_id: user.company_id, company });
      },
    },
    "/api/auth/change-password": {
      async POST(req: Request) {
        const user = authenticate(db, req);
        if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const { current_password, new_password } = await req.json();
        if (!current_password || !new_password) {
          return Response.json({ error: "Trenutna i nova lozinka su obavezne" }, { status: 400 });
        }
        if (new_password.length < 4) {
          return Response.json({ error: "Nova lozinka mora imati najmanje 4 znaka" }, { status: 400 });
        }

        const dbUser = db.query("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
        const valid = await Bun.password.verify(current_password, dbUser.password_hash);
        if (!valid) {
          return Response.json({ error: "Trenutna lozinka nije ispravna" }, { status: 403 });
        }

        const newHash = await Bun.password.hash(new_password, { algorithm: "bcrypt" });
        db.query("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, user.id);

        return Response.json({ ok: true });
      },
    },
  };
}
