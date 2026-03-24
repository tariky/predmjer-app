import { Database } from "bun:sqlite";
import { requireAuth, checkSubscription } from "../auth/middleware";

export function createEstimateRoutes(db: Database) {
  function getEstimateIfAuthorized(db: Database, req: Request, id: number) {
    const user = requireAuth(db, req);
    if (user instanceof Response) return { error: user };
    const sub = checkSubscription(db, user);
    if (sub) return { error: sub };

    const estimate = db.query("SELECT * FROM estimates WHERE id = ?").get(id) as any;
    if (!estimate) return { error: Response.json({ error: "Not found" }, { status: 404 }) };
    if (user.role !== "super_admin" && estimate.company_id !== user.company_id) {
      return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { user, estimate };
  }

  return {
    "/api/estimates": {
      GET(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const estimates = db
          .query(
            `SELECT e.*, u.display_name as created_by_name
             FROM estimates e JOIN users u ON e.created_by = u.id
             WHERE e.company_id = ? ORDER BY e.updated_at DESC`
          )
          .all(user.company_id);
        return Response.json(estimates);
      },
      async POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const { name, client_name = "", location = "" } = await req.json();
        if (!name) return Response.json({ error: "Name required" }, { status: 400 });
        if (!user.company_id) return Response.json({ error: "Nemate kompaniju. Kontaktirajte administratora." }, { status: 400 });

        const estimate = db
          .query(
            "INSERT INTO estimates (company_id, name, client_name, location, status, created_by) VALUES (?, ?, ?, ?, 'draft', ?) RETURNING *"
          )
          .get(user.company_id, name, client_name, location, user.id);
        return Response.json(estimate, { status: 201 });
      },
    },
    "/api/estimates/:id": {
      GET(req: Request) {
        const id = parseInt(req.params.id);
        const result = getEstimateIfAuthorized(db, req, id);
        if ("error" in result && result.error) return result.error;
        const { estimate } = result as any;

        const groups = db
          .query("SELECT * FROM estimate_groups WHERE estimate_id = ? ORDER BY sort_order")
          .all(id) as any[];

        for (const group of groups) {
          group.items = db
            .query("SELECT * FROM estimate_items WHERE estimate_group_id = ? ORDER BY sort_order")
            .all(group.id);
        }

        return Response.json({ ...estimate, groups });
      },
      async PUT(req: Request) {
        const id = parseInt(req.params.id);
        const result = getEstimateIfAuthorized(db, req, id);
        if ("error" in result && result.error) return result.error;
        const { estimate } = result as any;

        if (estimate.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        const body = await req.json();
        const updates: string[] = [];
        const values: any[] = [];

        for (const key of ["name", "client_name", "location", "notes"]) {
          if (body[key] !== undefined) {
            updates.push(`${key} = ?`);
            values.push(body[key]);
          }
        }
        updates.push("updated_at = datetime('now')");

        if (updates.length <= 1) return Response.json(estimate);

        values.push(id);
        const updated = db.query(`UPDATE estimates SET ${updates.join(", ")} WHERE id = ? RETURNING *`).get(...values);
        return Response.json(updated);
      },
      DELETE(req: Request) {
        const id = parseInt(req.params.id);
        const result = getEstimateIfAuthorized(db, req, id);
        if ("error" in result && result.error) return result.error;

        db.query("DELETE FROM estimates WHERE id = ?").run(id);
        return Response.json({ ok: true });
      },
    },
    "/api/estimates/:id/status": {
      async PUT(req: Request) {
        const id = parseInt(req.params.id);
        const result = getEstimateIfAuthorized(db, req, id);
        if ("error" in result && result.error) return result.error;

        const { status } = await req.json();
        if (!["draft", "finished"].includes(status)) {
          return Response.json({ error: "Invalid status" }, { status: 400 });
        }

        const updated = db
          .query("UPDATE estimates SET status = ?, updated_at = datetime('now') WHERE id = ? RETURNING *")
          .get(status, id);
        return Response.json(updated);
      },
    },
    "/api/estimates/:id/duplicate": {
      POST(req: Request) {
        const id = parseInt(req.params.id);
        const result = getEstimateIfAuthorized(db, req, id);
        if ("error" in result && result.error) return result.error;
        const { user, estimate } = result as any;

        const newEstimate = db
          .query(
            "INSERT INTO estimates (company_id, name, client_name, location, notes, status, created_by) VALUES (?, ?, ?, ?, ?, 'draft', ?) RETURNING *"
          )
          .get(estimate.company_id, `Kopija - ${estimate.name}`, estimate.client_name, estimate.location, estimate.notes || "", user.id) as any;

        const groups = db.query("SELECT * FROM estimate_groups WHERE estimate_id = ? ORDER BY sort_order").all(id) as any[];

        for (const group of groups) {
          const newGroup = db
            .query("INSERT INTO estimate_groups (estimate_id, group_name, sort_order) VALUES (?, ?, ?) RETURNING *")
            .get(newEstimate.id, group.group_name, group.sort_order) as any;

          const items = db.query("SELECT * FROM estimate_items WHERE estimate_group_id = ? ORDER BY sort_order").all(group.id) as any[];

          for (const item of items) {
            const newItem = db.query(
              "INSERT INTO estimate_items (estimate_group_id, library_item_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
            ).get(newGroup.id, item.library_item_id, item.name, item.description, item.unit, item.quantity, item.unit_price, item.sort_order) as any;

            const calcs = db.query("SELECT * FROM item_calculations WHERE estimate_item_id = ? ORDER BY sort_order").all(item.id) as any[];
            for (const calc of calcs) {
              db.query(
                "INSERT INTO item_calculations (estimate_item_id, description, field_a, field_b, field_c, multiplier, result, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
              ).run(newItem.id, calc.description, calc.field_a, calc.field_b, calc.field_c, calc.multiplier, calc.result, calc.sort_order);
            }
          }
        }

        return Response.json(newEstimate, { status: 201 });
      },
    },
    "/api/estimates/:id/groups": {
      async POST(req: Request) {
        const id = parseInt(req.params.id);
        const result = getEstimateIfAuthorized(db, req, id);
        if ("error" in result && result.error) return result.error;
        const { estimate } = result as any;

        if (estimate.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        const { group_name, sort_order = 0 } = await req.json();
        if (!group_name) return Response.json({ error: "group_name required" }, { status: 400 });

        const group = db
          .query("INSERT INTO estimate_groups (estimate_id, group_name, sort_order) VALUES (?, ?, ?) RETURNING *")
          .get(id, group_name, sort_order);

        db.query("UPDATE estimates SET updated_at = datetime('now') WHERE id = ?").run(id);
        return Response.json(group, { status: 201 });
      },
    },
    "/api/estimate-groups/:id": {
      async PUT(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const group = db.query(
          "SELECT eg.*, e.company_id, e.status FROM estimate_groups eg JOIN estimates e ON eg.estimate_id = e.id WHERE eg.id = ?"
        ).get(id) as any;

        if (!group) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && group.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        if (group.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        const body = await req.json();
        const updates: string[] = [];
        const values: any[] = [];

        if (body.group_name !== undefined) { updates.push("group_name = ?"); values.push(body.group_name); }
        if (body.sort_order !== undefined) { updates.push("sort_order = ?"); values.push(body.sort_order); }

        if (updates.length === 0) return Response.json(group);

        values.push(id);
        const updated = db.query(`UPDATE estimate_groups SET ${updates.join(", ")} WHERE id = ? RETURNING *`).get(...values);

        db.query("UPDATE estimates SET updated_at = datetime('now') WHERE id = ?").run(group.estimate_id);
        return Response.json(updated);
      },
      DELETE(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const group = db.query(
          "SELECT eg.*, e.company_id, e.status FROM estimate_groups eg JOIN estimates e ON eg.estimate_id = e.id WHERE eg.id = ?"
        ).get(id) as any;

        if (!group) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && group.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        if (group.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        db.query("DELETE FROM estimate_groups WHERE id = ?").run(id);
        db.query("UPDATE estimates SET updated_at = datetime('now') WHERE id = ?").run(group.estimate_id);
        return Response.json({ ok: true });
      },
    },
    "/api/estimate-groups/:id/items": {
      async POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const group = db.query(
          "SELECT eg.*, e.company_id, e.status FROM estimate_groups eg JOIN estimates e ON eg.estimate_id = e.id WHERE eg.id = ?"
        ).get(id) as any;

        if (!group) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && group.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        if (group.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        const { library_item_id = null, name, description = "", unit, quantity = 0, unit_price = 0, sort_order = 0 } = await req.json();
        if (!name || !unit) return Response.json({ error: "name and unit required" }, { status: 400 });

        const item = db
          .query(
            "INSERT INTO estimate_items (estimate_group_id, library_item_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
          )
          .get(id, library_item_id, name, description, unit, quantity, unit_price, sort_order);

        db.query("UPDATE estimates SET updated_at = datetime('now') WHERE id = ?").run(group.estimate_id);
        return Response.json(item, { status: 201 });
      },
    },
    "/api/estimate-items/:id": {
      async PUT(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const item = db.query(
          `SELECT ei.*, eg.estimate_id, e.company_id, e.status
           FROM estimate_items ei
           JOIN estimate_groups eg ON ei.estimate_group_id = eg.id
           JOIN estimates e ON eg.estimate_id = e.id
           WHERE ei.id = ?`
        ).get(id) as any;

        if (!item) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && item.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        if (item.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        const body = await req.json();
        const updates: string[] = [];
        const values: any[] = [];

        for (const key of ["name", "description", "unit", "quantity", "unit_price", "sort_order", "estimate_group_id"]) {
          if (body[key] !== undefined) {
            updates.push(`${key} = ?`);
            values.push(body[key]);
          }
        }

        if (updates.length === 0) return Response.json(item);

        values.push(id);
        const updated = db.query(`UPDATE estimate_items SET ${updates.join(", ")} WHERE id = ? RETURNING *`).get(...values);

        db.query("UPDATE estimates SET updated_at = datetime('now') WHERE id = ?").run(item.estimate_id);
        return Response.json(updated);
      },
      DELETE(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const item = db.query(
          `SELECT ei.*, eg.estimate_id, e.company_id, e.status
           FROM estimate_items ei
           JOIN estimate_groups eg ON ei.estimate_group_id = eg.id
           JOIN estimates e ON eg.estimate_id = e.id
           WHERE ei.id = ?`
        ).get(id) as any;

        if (!item) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && item.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        if (item.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        db.query("DELETE FROM estimate_items WHERE id = ?").run(id);
        db.query("UPDATE estimates SET updated_at = datetime('now') WHERE id = ?").run(item.estimate_id);
        return Response.json({ ok: true });
      },
    },
  };
}
