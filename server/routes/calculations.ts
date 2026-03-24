import { Database } from "bun:sqlite";
import { requireAuth, checkSubscription } from "../auth/middleware";

function computeResult(a: number, b: number | null, c: number | null, multiplier: number): number {
  let result = a;
  if (b !== null && b !== undefined) result *= b;
  if (c !== null && c !== undefined) result *= c;
  return result * multiplier;
}

function getItemWithEstimate(db: Database, itemId: number) {
  return db.query(
    `SELECT ei.*, eg.estimate_id, e.company_id, e.status
     FROM estimate_items ei
     JOIN estimate_groups eg ON ei.estimate_group_id = eg.id
     JOIN estimates e ON eg.estimate_id = e.id
     WHERE ei.id = ?`
  ).get(itemId) as any;
}

function getCalcWithEstimate(db: Database, calcId: number) {
  return db.query(
    `SELECT ic.*, ei.id as item_id, eg.estimate_id, e.company_id, e.status
     FROM item_calculations ic
     JOIN estimate_items ei ON ic.estimate_item_id = ei.id
     JOIN estimate_groups eg ON ei.estimate_group_id = eg.id
     JOIN estimates e ON eg.estimate_id = e.id
     WHERE ic.id = ?`
  ).get(calcId) as any;
}

export function createCalculationRoutes(db: Database) {
  return {
    "/api/estimate-items/:id/calculations": {
      GET(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const item = getItemWithEstimate(db, id);
        if (!item) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && item.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const calculations = db
          .query("SELECT * FROM item_calculations WHERE estimate_item_id = ? ORDER BY sort_order")
          .all(id);
        return Response.json(calculations);
      },
      async POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const item = getItemWithEstimate(db, id);
        if (!item) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && item.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        if (item.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        const { description = "", field_a = 0, field_b = null, field_c = null, multiplier = 1, sort_order = 0 } = await req.json();
        const result = computeResult(field_a, field_b, field_c, multiplier);

        const calc = db
          .query(
            "INSERT INTO item_calculations (estimate_item_id, description, field_a, field_b, field_c, multiplier, result, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
          )
          .get(id, description, field_a, field_b, field_c, multiplier, result, sort_order);

        return Response.json(calc, { status: 201 });
      },
    },
    "/api/estimate-items/:id/calculations/apply": {
      POST(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const item = getItemWithEstimate(db, id);
        if (!item) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && item.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        if (item.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        const total = db
          .query("SELECT COALESCE(SUM(result), 0) as total FROM item_calculations WHERE estimate_item_id = ?")
          .get(id) as { total: number };

        const updated = db
          .query("UPDATE estimate_items SET quantity = ? WHERE id = ? RETURNING *")
          .get(total.total, id);

        db.query("UPDATE estimates SET updated_at = datetime('now') WHERE id = ?").run(item.estimate_id);

        return Response.json(updated);
      },
    },
    "/api/item-calculations/:id": {
      async PUT(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const calc = getCalcWithEstimate(db, id);
        if (!calc) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && calc.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        if (calc.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        const body = await req.json();
        const fieldA = body.field_a ?? calc.field_a;
        const fieldB = body.field_b !== undefined ? body.field_b : calc.field_b;
        const fieldC = body.field_c !== undefined ? body.field_c : calc.field_c;
        const multiplier = body.multiplier ?? calc.multiplier;
        const description = body.description ?? calc.description;
        const sortOrder = body.sort_order ?? calc.sort_order;
        const result = computeResult(fieldA, fieldB, fieldC, multiplier);

        const updated = db
          .query(
            "UPDATE item_calculations SET description = ?, field_a = ?, field_b = ?, field_c = ?, multiplier = ?, result = ?, sort_order = ? WHERE id = ? RETURNING *"
          )
          .get(description, fieldA, fieldB, fieldC, multiplier, result, sortOrder, id);

        return Response.json(updated);
      },
      DELETE(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const calc = getCalcWithEstimate(db, id);
        if (!calc) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && calc.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }
        if (calc.status === "finished") {
          return Response.json({ error: "Cannot edit finished estimate" }, { status: 403 });
        }

        db.query("DELETE FROM item_calculations WHERE id = ?").run(id);
        return Response.json({ ok: true });
      },
    },
  };
}
