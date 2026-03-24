# Dokaznica Mjera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a smart measurement calculator (dokaznica mjera) drawer for each estimate item, with dynamic fields per unit, multiple calculation rows, and apply-to-quantity workflow.

**Architecture:** New `item_calculations` table + CRUD API routes + React drawer component with inline-editable calculation table. Drawer triggered from quantity field in estimate editor.

**Tech Stack:** bun:sqlite, Bun.serve() routes, React, shadcn/ui Sheet component, existing DecimalInput

**Spec:** `docs/superpowers/specs/2026-03-24-dokaznica-mjera-design.md`

---

## File Structure

```
Changes:
├── server/
│   ├── db/schema.ts                    # Modify: add item_calculations table
│   └── routes/calculations.ts          # Create: CRUD + apply routes
├── src/
│   ├── index.ts                        # Modify: register calculation routes
│   ├── components/
│   │   └── ui/sheet.tsx                # Create: add shadcn Sheet component
│   ├── lib/
│   │   └── calculation-fields.ts       # Create: unit → field config mapping
│   └── pages/
│       └── estimate-editor.tsx         # Modify: add calculator button + drawer
├── test/
│   └── calculations.test.ts            # Create: API tests
```

---

### Task 1: Database Schema

**Files:**
- Modify: `server/db/schema.ts`

- [ ] **Step 1: Add item_calculations table to schema**

Add to `server/db/schema.ts` after the `estimate_items` table creation:

```ts
  db.exec(`
    CREATE TABLE IF NOT EXISTS item_calculations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_item_id INTEGER NOT NULL REFERENCES estimate_items(id) ON DELETE CASCADE,
      description TEXT NOT NULL DEFAULT '',
      field_a REAL NOT NULL DEFAULT 0,
      field_b REAL,
      field_c REAL,
      multiplier REAL NOT NULL DEFAULT 1,
      result REAL NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);
```

- [ ] **Step 2: Run existing tests to verify no regression**

Run: `cd /Users/tarik/Documents/development/predmjer-i-predracun && bun test`
Expected: All existing tests PASS

---

### Task 2: Calculations API Routes

**Files:**
- Create: `server/routes/calculations.ts`
- Create: `test/calculations.test.ts`

- [ ] **Step 1: Create test file**

Create `test/calculations.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/tarik/Documents/development/predmjer-i-predracun && bun test test/calculations.test.ts`
Expected: FAIL — cannot resolve `../server/routes/calculations`

- [ ] **Step 3: Implement calculation routes**

Create `server/routes/calculations.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/tarik/Documents/development/predmjer-i-predracun && bun test test/calculations.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Run all tests**

Run: `cd /Users/tarik/Documents/development/predmjer-i-predracun && bun test`
Expected: All tests PASS (existing + new)

---

### Task 3: Register Routes in Server

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add calculation routes to server**

Add import at top of `src/index.ts`:
```ts
import { createCalculationRoutes } from "../server/routes/calculations";
```

Add after other route instantiations:
```ts
const calcRoutes = createCalculationRoutes(db);
```

Add `...calcRoutes,` in the routes object (before the uploads handler).

- [ ] **Step 2: Verify server starts**

Start dev server briefly and confirm no errors.

---

### Task 4: Add shadcn Sheet Component

**Files:**
- Create: `src/components/ui/sheet.tsx`

- [ ] **Step 1: Install Sheet component**

Run from project directory:
```bash
bunx shadcn@latest add sheet
```

If that fails, copy from shadcn registry manually. The Sheet component is needed for the drawer UI.

---

### Task 5: Unit Field Configuration

**Files:**
- Create: `src/lib/calculation-fields.ts`

- [ ] **Step 1: Create field config helper**

Create `src/lib/calculation-fields.ts`:

```ts
export type FieldConfig = {
  fieldA: string;
  fieldB: string | null;
  fieldC: string | null;
};

const FIELD_CONFIGS: Record<string, FieldConfig> = {
  "m²": { fieldA: "Dužina", fieldB: "Visina", fieldC: null },
  "m³": { fieldA: "Dužina", fieldB: "Širina", fieldC: "Visina" },
  "m¹": { fieldA: "Dužina", fieldB: null, fieldC: null },
};

const SINGLE_FIELD: FieldConfig = { fieldA: "Količina", fieldB: null, fieldC: null };

export function getFieldConfig(unit: string): FieldConfig {
  return FIELD_CONFIGS[unit] || SINGLE_FIELD;
}

export function computeResult(a: number, b: number | null, c: number | null, multiplier: number): number {
  let result = a;
  if (b !== null && b !== undefined) result *= b;
  if (c !== null && c !== undefined) result *= c;
  return result * multiplier;
}
```

---

### Task 6: Calculation Drawer Component

**Files:**
- Create: `src/components/calculation-drawer.tsx`
- Modify: `src/pages/estimate-editor.tsx`

- [ ] **Step 1: Create the drawer component**

Create `src/components/calculation-drawer.tsx`:

```tsx
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { getFieldConfig, computeResult } from "../lib/calculation-fields";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "./ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import { Plus, Trash2, Calculator } from "lucide-react";
import { cn } from "../lib/utils";

type Calculation = {
  id: number;
  estimate_item_id: number;
  description: string;
  field_a: number;
  field_b: number | null;
  field_c: number | null;
  multiplier: number;
  result: number;
  sort_order: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  unit: string;
  currentQuantity: number;
  isDraft: boolean;
  onApplied: () => void;
};

function DecimalCell({
  value,
  onSave,
  disabled,
}: {
  value: number;
  onSave: (val: number) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(value.toFixed(2));

  useEffect(() => { setText(value.toFixed(2)); }, [value]);

  if (disabled) return <span className="text-sm">{value.toFixed(2)}</span>;

  return (
    <Input
      className="h-8 text-sm text-right w-20"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^0-9.,-]/g, ""))}
      onBlur={() => {
        const parsed = parseFloat(text.replace(",", "."));
        const final = isNaN(parsed) ? 0 : parsed;
        setText(final.toFixed(2));
        if (final !== value) onSave(final);
      }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      inputMode="decimal"
    />
  );
}

export function CalculationDrawer({ open, onClose, itemId, itemName, unit, currentQuantity, isDraft, onApplied }: Props) {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(false);

  const fieldConfig = getFieldConfig(unit);
  const total = calculations.reduce((sum, c) => sum + c.result, 0);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Calculation[]>(`/api/estimate-items/${itemId}/calculations`);
      setCalculations(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (open) load();
  }, [open, itemId]);

  const handleAdd = async () => {
    try {
      const maxOrder = calculations.reduce((max, c) => Math.max(max, c.sort_order), -1);
      await api.post(`/api/estimate-items/${itemId}/calculations`, {
        description: "",
        field_a: 0,
        field_b: fieldConfig.fieldB ? 0 : null,
        field_c: fieldConfig.fieldC ? 0 : null,
        multiplier: 1,
        sort_order: maxOrder + 1,
      });
      load();
    } catch {}
  };

  const handleUpdate = async (calcId: number, field: string, value: number | string) => {
    const calc = calculations.find((c) => c.id === calcId);
    if (!calc) return;

    const updated = { ...calc, [field]: value };
    const newResult = computeResult(
      updated.field_a, updated.field_b, updated.field_c, updated.multiplier
    );

    // Optimistic update
    setCalculations((prev) =>
      prev.map((c) => c.id === calcId ? { ...c, [field]: value, result: newResult } : c)
    );

    try {
      await api.put(`/api/item-calculations/${calcId}`, { [field]: value });
    } catch { load(); }
  };

  const handleDelete = async (calcId: number) => {
    setCalculations((prev) => prev.filter((c) => c.id !== calcId));
    try {
      await api.delete(`/api/item-calculations/${calcId}`);
    } catch { load(); }
  };

  const handleApply = async () => {
    try {
      await api.post(`/api/estimate-items/${itemId}/calculations/apply`);
      onApplied();
      onClose();
    } catch {}
  };

  // Column count for colspan
  let colCount = 4; // description + result + multiplier + total
  if (fieldConfig.fieldB) colCount++;
  if (fieldConfig.fieldC) colCount++;
  if (isDraft) colCount++; // delete button

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[65vw] max-w-[900px] sm:max-w-[900px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">Dokaznica mjera</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{itemName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{unit}</Badge>
              <Badge variant="outline">Trenutno: {currentQuantity.toFixed(2)}</Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Učitavanje...</div>
          ) : calculations.length === 0 ? (
            <div className="text-center py-16">
              <Calculator className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-3">Nema kalkulacija.</p>
              {isDraft && (
                <Button variant="outline" size="sm" onClick={handleAdd}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj prvi red
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Opis</TableHead>
                  <TableHead className="text-right">{fieldConfig.fieldA}</TableHead>
                  {fieldConfig.fieldB && <TableHead className="text-right">{fieldConfig.fieldB}</TableHead>}
                  {fieldConfig.fieldC && <TableHead className="text-right">{fieldConfig.fieldC}</TableHead>}
                  <TableHead className="text-right">Rezultat</TableHead>
                  <TableHead className="text-right w-[80px]">Množilac</TableHead>
                  <TableHead className="text-right">Ukupno</TableHead>
                  {isDraft && <TableHead className="w-[40px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow
                    key={calc.id}
                    className={cn(calc.multiplier < 0 && "bg-destructive/5")}
                  >
                    <TableCell>
                      {isDraft ? (
                        <Input
                          className="h-8 text-sm"
                          defaultValue={calc.description}
                          onBlur={(e) => handleUpdate(calc.id, "description", e.target.value)}
                          placeholder="Opis..."
                        />
                      ) : (
                        <span className="text-sm">{calc.description}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DecimalCell value={calc.field_a} onSave={(v) => handleUpdate(calc.id, "field_a", v)} disabled={!isDraft} />
                    </TableCell>
                    {fieldConfig.fieldB && (
                      <TableCell className="text-right">
                        <DecimalCell value={calc.field_b ?? 0} onSave={(v) => handleUpdate(calc.id, "field_b", v)} disabled={!isDraft} />
                      </TableCell>
                    )}
                    {fieldConfig.fieldC && (
                      <TableCell className="text-right">
                        <DecimalCell value={calc.field_c ?? 0} onSave={(v) => handleUpdate(calc.id, "field_c", v)} disabled={!isDraft} />
                      </TableCell>
                    )}
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {computeResult(calc.field_a, calc.field_b, calc.field_c, 1).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DecimalCell value={calc.multiplier} onSave={(v) => handleUpdate(calc.id, "multiplier", v)} disabled={!isDraft} />
                    </TableCell>
                    <TableCell className={cn("text-right font-medium text-sm", calc.result < 0 && "text-destructive")}>
                      {calc.result.toFixed(2)}
                    </TableCell>
                    {isDraft && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(calc.id)}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="border-t-2 border-border">
                  <TableCell colSpan={colCount - (isDraft ? 2 : 1)} className="text-right font-bold">
                    UKUPNO:
                  </TableCell>
                  <TableCell className={cn("text-right font-bold text-base", total < 0 && "text-destructive")}>
                    {total.toFixed(2)}
                  </TableCell>
                  {isDraft && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          )}

          {isDraft && calculations.length > 0 && (
            <Button variant="outline" size="sm" className="mt-3" onClick={handleAdd}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj red
            </Button>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t border-border flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Zatvori</Button>
          {isDraft && calculations.length > 0 && (
            <Button onClick={handleApply}>
              Primijeni ({total.toFixed(2)})
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Add calculator button to estimate editor**

In `src/pages/estimate-editor.tsx`:

Add import at top:
```tsx
import { CalculationDrawer } from "../components/calculation-drawer";
import { Calculator } from "lucide-react";
```

Add state for the drawer (inside `EstimateEditor` component):
```tsx
const [calcDrawer, setCalcDrawer] = useState<{ itemId: number; itemName: string; unit: string; quantity: number } | null>(null);
```

Find the quantity `DecimalInput` cell (around line 559) and wrap it with a calculator button:

Replace the quantity TableCell content (draft mode) from:
```tsx
<DecimalInput
  className="h-8 text-sm text-right w-24"
  value={item.quantity}
  onSave={(val) => handleUpdateItem(item.id, "quantity", val)}
/>
```

To:
```tsx
<div className="flex items-center gap-1 justify-end">
  <DecimalInput
    className="h-8 text-sm text-right w-20"
    value={item.quantity}
    onSave={(val) => handleUpdateItem(item.id, "quantity", val)}
  />
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 flex-shrink-0"
    onClick={() => setCalcDrawer({ itemId: item.id, itemName: item.name, unit: item.unit, quantity: item.quantity })}
    title="Dokaznica mjera"
  >
    <Calculator className="w-3.5 h-3.5" />
  </Button>
</div>
```

Also update the read-only (finished) quantity display to show calculator icon if calculations exist. Replace:
```tsx
item.quantity.toFixed(2)
```

With:
```tsx
<span className="flex items-center justify-end gap-1">
  {item.quantity.toFixed(2)}
  <Button
    variant="ghost"
    size="icon"
    className="h-6 w-6"
    onClick={() => setCalcDrawer({ itemId: item.id, itemName: item.name, unit: item.unit, quantity: item.quantity })}
  >
    <Calculator className="w-3 h-3 text-muted-foreground" />
  </Button>
</span>
```

Add the drawer component at the end of the return JSX (before the closing `</div>`):
```tsx
{calcDrawer && (
  <CalculationDrawer
    open={!!calcDrawer}
    onClose={() => setCalcDrawer(null)}
    itemId={calcDrawer.itemId}
    itemName={calcDrawer.itemName}
    unit={calcDrawer.unit}
    currentQuantity={calcDrawer.quantity}
    isDraft={isDraft}
    onApplied={load}
  />
)}
```

- [ ] **Step 3: Verify everything works**

Start the dev server, create an estimate with items, click the calculator icon, add calculation rows, apply, verify quantity updates.

- [ ] **Step 4: Run all tests**

Run: `cd /Users/tarik/Documents/development/predmjer-i-predracun && bun test`
Expected: All tests PASS

---

### Task 7: Duplicate Estimate — Copy Calculations

**Files:**
- Modify: `server/routes/estimates.ts`

- [ ] **Step 1: Update duplicate logic to copy calculations**

In `server/routes/estimates.ts`, find the duplicate endpoint (`/api/estimates/:id/duplicate` POST handler). After the loop that copies items, add calculation copying:

Inside the inner `for (const item of items)` loop, after the item INSERT, add:

```ts
const newItem = db.query(
  "INSERT INTO estimate_items (estimate_group_id, library_item_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"
).get(newGroup.id, item.library_item_id, item.name, item.description, item.unit, item.quantity, item.unit_price, item.sort_order) as any;

const calcs = db.query("SELECT * FROM item_calculations WHERE estimate_item_id = ? ORDER BY sort_order").all(item.id) as any[];
for (const calc of calcs) {
  db.query(
    "INSERT INTO item_calculations (estimate_item_id, description, field_a, field_b, field_c, multiplier, result, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(newItem.id, calc.description, calc.field_a, calc.field_b, calc.field_c, calc.multiplier, calc.result, calc.sort_order);
}
```

Note: The current code uses a bare `.run()` for item insert without RETURNING. Change it to use RETURNING to get the new item ID.

- [ ] **Step 2: Run all tests**

Run: `cd /Users/tarik/Documents/development/predmjer-i-predracun && bun test`
Expected: All tests PASS
