# Dokaznica Mjera (Proof of Measurements) - Design Spec

## Overview

A smart calculator (drawer UI) for each estimate item that computes quantity from real-world measurements. Each item can have multiple calculation rows. The calculation fields adapt dynamically based on the unit of measurement. Totals from the calculator are applied to the item's quantity field.

## Data Model

### item_calculations
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| estimate_item_id | INTEGER FK | references estimate_items, ON DELETE CASCADE |
| description | TEXT | e.g. "Zid sjever", "Oduzmi prozor" |
| field_a | REAL NOT NULL | first field (always present) |
| field_b | REAL nullable | second field (for m², m³) |
| field_c | REAL nullable | third field (for m³ only) |
| multiplier | REAL NOT NULL DEFAULT 1 | can be negative for deductions |
| result | REAL NOT NULL | computed: field_a × field_b × field_c × multiplier |
| sort_order | INTEGER NOT NULL DEFAULT 0 | display order |

### Dynamic fields by unit

| Unit | Fields | Formula |
|------|--------|---------|
| m² | Dužina (A) × Visina (B) | A × B × multiplier |
| m³ | Dužina (A) × Širina (B) × Visina (C) | A × B × C × multiplier |
| m¹ | Dužina (A) | A × multiplier |
| kom | Količina (A) | A × multiplier |
| kg | Količina (A) | A × multiplier |
| t | Količina (A) | A × multiplier |
| l | Količina (A) | A × multiplier |
| pauš. | Količina (A) | A × multiplier |
| sat | Količina (A) | A × multiplier |
| dan | Količina (A) | A × multiplier |
| komplet | Količina (A) | A × multiplier |

## API Routes

All routes require authentication + subscription check. Estimate must be in draft status for write operations.

### Calculations CRUD
- `GET /api/estimate-items/:id/calculations` — list all calculations for an item (ordered by sort_order)
- `POST /api/estimate-items/:id/calculations` — add a calculation row
- `PUT /api/item-calculations/:id` — update a calculation row
- `DELETE /api/item-calculations/:id` — delete a calculation row
- `POST /api/estimate-items/:id/calculations/apply` — compute SUM(result) and write it to estimate_items.quantity

### Authorization
- Same rules as estimate items: user must belong to the company that owns the estimate
- Write operations blocked when estimate status = "finished"
- Apply endpoint updates the estimate's `updated_at` timestamp

## Frontend

### Drawer Calculator

**Trigger:** Button with calculator icon next to the quantity field in each estimate item row (draft mode only). In finished mode, button still visible but opens read-only view.

**Drawer:** Opens from right side, large (~60-70% screen width).

**Layout:**

```
┌─────────────────────────────────────────────────┐
│ Header: Item name | Unit badge | Current qty    │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Opis    | Dužina | Visina | Rez. | Mn. | Uk.│ │ ← columns adapt to unit
│ ├─────────────────────────────────────────────┤ │
│ │ Zid sj. | 8.50   | 2.80   |23.80 | 1   |23.80│
│ │ Zid jug | 8.50   | 2.80   |23.80 | 1   |23.80│
│ │ Prozor  | 1.20   | 1.40   | 1.68 | -2  |-3.36│ ← red tint for negative
│ ├─────────────────────────────────────────────┤ │
│ │                          UKUPNO:       44.24│ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [+ Dodaj red]                                   │
│                                                 │
├─────────────────────────────────────────────────┤
│                    [Zatvori]  [Primijeni (44.24)]│
└─────────────────────────────────────────────────┘
```

### Behavior

- **Adding rows:** Click "Dodaj red" → new empty row appears with defaults (0 values, multiplier 1)
- **Inline editing:** All fields are editable inline (DecimalInput components, comma/dot as decimal)
- **Result auto-calculates:** As user types in fields, result updates in real-time (client-side)
- **Negative multiplier:** Row gets a subtle red/destructive background tint
- **Apply:** Computes SUM of all results, writes to item quantity, closes drawer
- **Close without apply:** Changes to calculation rows ARE saved (each row saves on blur), but quantity is NOT updated
- **Read-only mode (finished):** Drawer opens, calculations visible, no editing, no Apply button
- **Empty state:** If item has no calculations yet, show message "Nema kalkulacija. Dodaj prvi red." with add button
- **Quantity field indicator:** If an item has calculations stored, show a small calculator icon next to the quantity to indicate dokaznica exists

### Column labels by unit

| Unit | Col A | Col B | Col C |
|------|-------|-------|-------|
| m² | Dužina | Visina | — |
| m³ | Dužina | Širina | Visina |
| m¹ | Dužina | — | — |
| kom, kg, t, l, pauš., sat, dan, komplet | Količina | — | — |
