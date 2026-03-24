import { Database } from "bun:sqlite";

export function createSession(db: Database, userId: number): string {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
  return token;
}

export function validateSession(db: Database, token: string): { userId: number } | null {
  const session = db.query("SELECT user_id, expires_at FROM sessions WHERE id = ?").get(token) as { user_id: number; expires_at: string } | null;
  if (!session) return null;
  if (new Date(session.expires_at) < new Date()) {
    db.query("DELETE FROM sessions WHERE id = ?").run(token);
    return null;
  }
  return { userId: session.user_id };
}

export function destroySession(db: Database, token: string) {
  db.query("DELETE FROM sessions WHERE id = ?").run(token);
}

export function getSessionFromCookie(req: Request): string | null {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(/session=([^;]+)/);
  return match ? match[1] : null;
}

export function sessionCookie(token: string, maxAge = 7 * 24 * 60 * 60): string {
  return `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
