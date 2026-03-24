import { Database } from "bun:sqlite";
import { requireAuth, checkSubscription } from "../auth/middleware";

export function createLibraryRoutes(db: Database) {
  return {
    "/api/item-groups": {
      GET(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const groups = db
          .query("SELECT ig.*, u.display_name as created_by_name FROM item_groups ig LEFT JOIN users u ON ig.created_by = u.id ORDER BY ig.name")
          .all();
        return Response.json(groups);
      },
      async POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const { name } = await req.json();
        if (!name) return Response.json({ error: "Name required" }, { status: 400 });

        const group = db
          .query("INSERT INTO item_groups (name, created_by) VALUES (?, ?) RETURNING *")
          .get(name, user.id);
        return Response.json(group, { status: 201 });
      },
    },
    "/api/item-groups/:id": {
      async PUT(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const group = db.query("SELECT * FROM item_groups WHERE id = ?").get(id) as any;
        if (!group) return Response.json({ error: "Not found" }, { status: 404 });
        if (group.created_by !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

        const { name } = await req.json();
        const updated = db.query("UPDATE item_groups SET name = ? WHERE id = ? RETURNING *").get(name, id);
        return Response.json(updated);
      },
      DELETE(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const group = db.query("SELECT * FROM item_groups WHERE id = ?").get(id) as any;
        if (!group) return Response.json({ error: "Not found" }, { status: 404 });
        if (group.created_by !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

        db.query("DELETE FROM item_groups WHERE id = ?").run(id);
        return Response.json({ ok: true });
      },
    },
    "/api/library-items": {
      GET(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const url = new URL(req.url);
        const groupId = url.searchParams.get("group_id");

        let items;
        if (groupId) {
          items = db
            .query("SELECT li.*, u.display_name as created_by_name FROM library_items li LEFT JOIN users u ON li.created_by = u.id WHERE li.group_id = ? ORDER BY li.name")
            .all(parseInt(groupId));
        } else {
          items = db
            .query("SELECT li.*, u.display_name as created_by_name FROM library_items li LEFT JOIN users u ON li.created_by = u.id ORDER BY li.name")
            .all();
        }
        return Response.json(items);
      },
      async POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const { group_id, name, description = "", unit, unit_price = 0 } = await req.json();
        if (!group_id || !name || !unit) {
          return Response.json({ error: "group_id, name, and unit required" }, { status: 400 });
        }

        const item = db
          .query(
            "INSERT INTO library_items (group_id, name, description, unit, unit_price, created_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
          )
          .get(group_id, name, description, unit, unit_price, user.id);
        return Response.json(item, { status: 201 });
      },
    },
    "/api/library-items/:id": {
      async PUT(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const item = db.query("SELECT * FROM library_items WHERE id = ?").get(id) as any;
        if (!item) return Response.json({ error: "Not found" }, { status: 404 });
        if (item.created_by !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const updates: string[] = [];
        const values: any[] = [];

        for (const key of ["name", "description", "unit", "unit_price", "group_id"]) {
          if (body[key] !== undefined) {
            updates.push(`${key} = ?`);
            values.push(body[key]);
          }
        }
        updates.push("updated_at = datetime('now')");

        values.push(id);
        const updated = db.query(`UPDATE library_items SET ${updates.join(", ")} WHERE id = ? RETURNING *`).get(...values);
        return Response.json(updated);
      },
      DELETE(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const item = db.query("SELECT * FROM library_items WHERE id = ?").get(id) as any;
        if (!item) return Response.json({ error: "Not found" }, { status: 404 });
        if (item.created_by !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });

        db.query("DELETE FROM library_items WHERE id = ?").run(id);
        return Response.json({ ok: true });
      },
    },
    "/api/library-items/:id/toggle-hidden": {
      POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const existing = db.query(
          "SELECT 1 FROM hidden_library_items WHERE user_id = ? AND library_item_id = ?"
        ).get(user.id, id);

        if (existing) {
          db.query("DELETE FROM hidden_library_items WHERE user_id = ? AND library_item_id = ?").run(user.id, id);
          return Response.json({ hidden: false });
        } else {
          db.query("INSERT INTO hidden_library_items (user_id, library_item_id) VALUES (?, ?)").run(user.id, id);
          return Response.json({ hidden: true });
        }
      },
    },
    "/api/library-items/hidden": {
      GET(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;

        const ids = db.query(
          "SELECT library_item_id FROM hidden_library_items WHERE user_id = ?"
        ).all(user.id) as { library_item_id: number }[];

        return Response.json(ids.map((r) => r.library_item_id));
      },
    },
  };
}
