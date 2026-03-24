import { Database } from "bun:sqlite";
import { getSessionFromCookie, validateSession } from "./session";

export type AuthUser = {
  id: number;
  username: string;
  display_name: string;
  role: "super_admin" | "user";
  company_id: number | null;
};

export function authenticate(db: Database, req: Request): AuthUser | null {
  const token = getSessionFromCookie(req);
  if (!token) return null;
  const session = validateSession(db, token);
  if (!session) return null;
  const user = db.query("SELECT id, username, display_name, role, company_id FROM users WHERE id = ?").get(session.userId) as AuthUser | null;
  return user;
}

export function requireAuth(db: Database, req: Request): AuthUser | Response {
  const user = authenticate(db, req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return user;
}

export function requireAdmin(db: Database, req: Request): AuthUser | Response {
  const result = requireAuth(db, req);
  if (result instanceof Response) return result;
  if (result.role !== "super_admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  return result;
}

export function checkSubscription(db: Database, user: AuthUser): Response | null {
  if (user.role === "super_admin") return null;
  if (!user.company_id) return null;
  const company = db.query("SELECT subscription_expires_at FROM companies WHERE id = ?").get(user.company_id) as { subscription_expires_at: string | null } | null;
  if (!company) return null;
  if (!company.subscription_expires_at) {
    return null; // No subscription date set = unlimited access
  }
  if (new Date(company.subscription_expires_at) < new Date()) {
    return Response.json({ error: "subscription_expired", message: "Vaša pretplata je istekla." }, { status: 403 });
  }
  return null;
}
