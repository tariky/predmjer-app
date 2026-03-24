# Predmjer i Predračun Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fullstack construction cost estimation app with auth, library management, estimate CRUD, and PDF/Excel export.

**Architecture:** Bun monolith serving React SPA + REST API. SQLite for persistence. Session-based auth with HTTP-only cookies. shadcn/ui + Tailwind for UI with industrial construction theme.

**Tech Stack:** Bun, bun:sqlite, React 19, shadcn/ui, Tailwind CSS 4, jsPDF, ExcelJS, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-24-predmjer-i-predracun-design.md`

**Base template:** Parent directory (`/Users/tarik/Documents/development/`) has a working Bun + React + shadcn template to copy from.

---

## File Structure

```
predmjer-i-predracun/
├── src/
│   ├── index.ts                    # Bun.serve() entry point, route registration
│   ├── index.html                  # HTML entry point
│   ├── index.css                   # Global styles + industrial theme
│   ├── frontend.tsx                # React root mount
│   ├── App.tsx                     # Router + auth provider
│   ├── lib/
│   │   ├── utils.ts                # cn() utility (from shadcn)
│   │   ├── api.ts                  # fetch wrapper for API calls
│   │   └── auth-context.tsx        # React auth context + provider
│   ├── components/
│   │   ├── ui/                     # shadcn components
│   │   ├── layout.tsx              # App shell: sidebar + content area
│   │   ├── subscription-expired.tsx # Fullscreen subscription expired message
│   │   └── protected-route.tsx     # Auth gate component
│   ├── pages/
│   │   ├── login.tsx               # Login page
│   │   ├── dashboard.tsx           # Estimates list
│   │   ├── estimate-editor.tsx     # Estimate editor with groups/items
│   │   ├── library.tsx             # Library management
│   │   ├── admin-companies.tsx     # Admin: companies CRUD
│   │   └── admin-users.tsx         # Admin: users CRUD
│   └── styles/
│       └── globals.css             # Tailwind + shadcn theme vars
├── server/
│   ├── db/
│   │   ├── schema.ts               # Create tables, run migrations
│   │   ├── seed.ts                 # Seed system library items + super admin
│   │   └── index.ts                # DB singleton export
│   ├── auth/
│   │   ├── session.ts              # Session create/validate/destroy
│   │   └── middleware.ts           # Auth middleware, subscription check
│   ├── routes/
│   │   ├── auth.ts                 # Login/logout/me routes
│   │   ├── admin.ts                # Companies + users admin routes
│   │   ├── library.ts              # Item groups + library items routes
│   │   ├── estimates.ts            # Estimates CRUD routes
│   │   └── export.ts               # PDF + Excel export routes
│   └── lib/
│       ├── pdf.ts                  # PDF generation with jsPDF
│       └── excel.ts                # Excel generation with ExcelJS
├── test/
│   ├── db.test.ts                  # Database schema tests
│   ├── auth.test.ts                # Auth API tests
│   ├── admin.test.ts               # Admin API tests
│   ├── library.test.ts             # Library API tests
│   ├── estimates.test.ts           # Estimates API tests
│   └── export.test.ts              # Export tests
├── package.json
├── tsconfig.json
├── bunfig.toml
├── components.json                 # shadcn config
├── build.ts                        # Production build script
└── .env                            # SESSION_SECRET, DB_PATH
```

---

### Task 1: Project Setup

**Files:**
- Create: `predmjer-i-predracun/package.json`
- Create: `predmjer-i-predracun/tsconfig.json`
- Create: `predmjer-i-predracun/bunfig.toml`
- Create: `predmjer-i-predracun/components.json`
- Create: `predmjer-i-predracun/build.ts`
- Create: `predmjer-i-predracun/.env`
- Create: `predmjer-i-predracun/.gitignore`
- Create: `predmjer-i-predracun/src/lib/utils.ts`
- Create: `predmjer-i-predracun/src/styles/globals.css`
- Create: `predmjer-i-predracun/src/index.css`
- Create: `predmjer-i-predracun/src/index.html`
- Create: `predmjer-i-predracun/src/frontend.tsx`
- Create: `predmjer-i-predracun/src/App.tsx`
- Create: `predmjer-i-predracun/src/index.ts`

- [ ] **Step 1: Initialize project**

Copy the template structure from parent directory and adapt it. Create `package.json`:

```json
{
  "name": "predmjer-i-predracun",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --hot src/index.ts",
    "start": "NODE_ENV=production bun src/index.ts",
    "build": "bun run build.ts",
    "seed": "bun server/db/seed.ts",
    "test": "bun test"
  },
  "dependencies": {
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "bun-plugin-tailwind": "^0.1.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "exceljs": "^4.4.0",
    "jspdf": "^2.5.2",
    "jspdf-autotable": "^3.8.4",
    "lucide-react": "^0.545.0",
    "react": "^19",
    "react-dom": "^19",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@types/bun": "latest",
    "tailwindcss": "^4.1.11",
    "tw-animate-css": "^1.4.0"
  }
}
```

- [ ] **Step 2: Create config files**

Copy `tsconfig.json` from parent directory (identical). Update paths alias to `./src/*`.

Copy `bunfig.toml` from parent (identical).

Copy `build.ts` from parent (identical).

Create `components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Create `.env`:
```
SESSION_SECRET=change-me-in-production
DB_PATH=./data/app.db
```

Create `.gitignore`:
```
node_modules/
dist/
data/
.env
```

- [ ] **Step 3: Create globals.css with industrial construction theme**

Create `src/styles/globals.css` — dark zinc/slate base with orange accent colors:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* Industrial construction dark theme — always dark */
:root {
  --radius: 0.5rem;
  --background: oklch(0.145 0.005 285);
  --foreground: oklch(0.94 0 0);
  --card: oklch(0.19 0.005 285);
  --card-foreground: oklch(0.94 0 0);
  --popover: oklch(0.19 0.005 285);
  --popover-foreground: oklch(0.94 0 0);
  --primary: oklch(0.75 0.18 55);
  --primary-foreground: oklch(0.16 0.005 285);
  --secondary: oklch(0.25 0.005 285);
  --secondary-foreground: oklch(0.88 0 0);
  --muted: oklch(0.22 0.005 285);
  --muted-foreground: oklch(0.6 0 0);
  --accent: oklch(0.75 0.18 55);
  --accent-foreground: oklch(0.16 0.005 285);
  --destructive: oklch(0.65 0.2 25);
  --border: oklch(0.28 0.005 285);
  --input: oklch(0.28 0.005 285);
  --ring: oklch(0.75 0.18 55);
  --chart-1: oklch(0.75 0.18 55);
  --chart-2: oklch(0.6 0.15 160);
  --chart-3: oklch(0.55 0.1 230);
  --chart-4: oklch(0.7 0.15 85);
  --chart-5: oklch(0.65 0.12 340);
  --sidebar: oklch(0.17 0.005 285);
  --sidebar-foreground: oklch(0.88 0 0);
  --sidebar-primary: oklch(0.75 0.18 55);
  --sidebar-primary-foreground: oklch(0.16 0.005 285);
  --sidebar-accent: oklch(0.25 0.005 285);
  --sidebar-accent-foreground: oklch(0.88 0 0);
  --sidebar-border: oklch(0.28 0.005 285);
  --sidebar-ring: oklch(0.75 0.18 55);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 4: Create entry files**

Create `src/index.css`:
```css
@import "../src/styles/globals.css";

@layer base {
  :root {
    @apply font-sans antialiased;
  }
  body {
    @apply min-h-screen m-0;
  }
}
```

Wait — the globals.css import path needs to work. Since index.css is in `src/` and globals.css is in `src/styles/`, use:

```css
@import "./styles/globals.css";

@layer base {
  :root {
    @apply font-sans antialiased;
  }
  body {
    @apply min-h-screen m-0;
  }
}
```

Create `src/index.html`:
```html
<!doctype html>
<html lang="bs">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Predmjer i Predračun</title>
    <script type="module" src="./frontend.tsx" async></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

Create `src/frontend.tsx` (copy from parent template — identical):
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
```

Create `src/App.tsx` (minimal placeholder):
```tsx
export function App() {
  return <div className="p-8 text-foreground">Predmjer i Predračun - Loading...</div>;
}
```

Create `src/lib/utils.ts` (copy from parent — identical):
```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Create minimal server entry**

Create `src/index.ts`:
```ts
import { serve } from "bun";
import index from "./index.html";

const server = serve({
  port: 3000,
  routes: {
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
```

- [ ] **Step 6: Install dependencies and verify**

Run:
```bash
cd predmjer-i-predracun && bun install
```

- [ ] **Step 7: Start dev server and verify it loads**

Run:
```bash
cd predmjer-i-predracun && bun dev
```

Expected: Server starts at localhost:3000, page shows "Predmjer i Predračun - Loading..."

- [ ] **Step 8: Add shadcn components**

Run from `predmjer-i-predracun/`:
```bash
bunx shadcn@latest add button card input label select textarea dialog dropdown-menu table badge separator tabs collapsible alert-dialog tooltip sonner
```

Note: If shadcn CLI prompts for init, the components.json should handle it. If it fails, copy ui components from parent `src/components/ui/` and add the missing ones.

- [ ] **Step 9: Commit**

```
feat: initial project setup with Bun + React + shadcn + industrial theme
```

---

### Task 2: Database Schema & Seed

**Files:**
- Create: `server/db/index.ts`
- Create: `server/db/schema.ts`
- Create: `server/db/seed.ts`
- Create: `test/db.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/db.test.ts`:
```ts
import { test, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";

let db: Database;

beforeAll(() => {
  db = new Database(":memory:");
  // We'll import and run schema creation
});

afterAll(() => {
  db.close();
});

test("schema creates all tables", async () => {
  const { createSchema } = await import("../server/db/schema");
  createSchema(db);

  const tables = db
    .query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as { name: string }[];

  const tableNames = tables.map((t) => t.name);
  expect(tableNames).toContain("users");
  expect(tableNames).toContain("companies");
  expect(tableNames).toContain("item_groups");
  expect(tableNames).toContain("library_items");
  expect(tableNames).toContain("estimates");
  expect(tableNames).toContain("estimate_groups");
  expect(tableNames).toContain("estimate_items");
  expect(tableNames).toContain("sessions");
});

test("can insert and query a company", async () => {
  const result = db
    .query(
      "INSERT INTO companies (name, address, phone, email) VALUES (?, ?, ?, ?) RETURNING *"
    )
    .get("Test Co", "Test Addr", "123", "test@co.com") as any;

  expect(result.name).toBe("Test Co");
  expect(result.id).toBe(1);
  expect(result.subscription_expires_at).toBeNull();
});

test("can insert user with company", async () => {
  const result = db
    .query(
      "INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?) RETURNING *"
    )
    .get("admin", "hash", "Admin", "super_admin", null) as any;

  expect(result.username).toBe("admin");
  expect(result.role).toBe("super_admin");
});

test("username must be unique", () => {
  expect(() => {
    db.query(
      "INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)"
    ).run("admin", "hash2", "Admin2", "user");
  }).toThrow();
});

test("foreign key on estimates.company_id enforced", () => {
  expect(() => {
    db.query(
      "INSERT INTO estimates (company_id, name, client_name, location, status, created_by) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(999, "Test", "Client", "Loc", "draft", 1);
  }).toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd predmjer-i-predracun && bun test test/db.test.ts`
Expected: FAIL — cannot resolve `../server/db/schema`

- [ ] **Step 3: Implement database schema**

Create `server/db/schema.ts`:
```ts
import { Database } from "bun:sqlite";

export function createSchema(db: Database) {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      logo_url TEXT,
      subscription_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('super_admin', 'user')),
      company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS item_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS library_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES item_groups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL,
      unit_price REAL NOT NULL DEFAULT 0,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      client_name TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'finished')),
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_id INTEGER NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
      group_name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS estimate_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_group_id INTEGER NOT NULL REFERENCES estimate_groups(id) ON DELETE CASCADE,
      library_item_id INTEGER REFERENCES library_items(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit_price REAL NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);
}
```

- [ ] **Step 4: Create DB singleton**

Create `server/db/index.ts`:
```ts
import { Database } from "bun:sqlite";
import { createSchema } from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DB_PATH || "./data/app.db";
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
createSchema(db);

export default db;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd predmjer-i-predracun && bun test test/db.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 6: Create seed script**

Create `server/db/seed.ts`:
```ts
import { Database } from "bun:sqlite";
import { createSchema } from "./schema";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const dbPath = process.env.DB_PATH || "./data/app.db";
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
createSchema(db);

// Create super admin (password: admin123)
const hashedPassword = await Bun.password.hash("admin123", { algorithm: "bcrypt" });

db.query(`
  INSERT OR IGNORE INTO users (username, password_hash, display_name, role, company_id)
  VALUES (?, ?, ?, ?, ?)
`).run("admin", hashedPassword, "Super Admin", "super_admin", null);

// Seed system item groups
const groups = [
  "Pripremni radovi",
  "Zemljani radovi",
  "Betonski i armiranobetonski radovi",
  "Zidarski radovi",
  "Tesarski radovi",
  "Armirački radovi",
  "Izolaterski radovi",
  "Krovopokrivački radovi",
  "Limarski radovi",
  "Stolarski radovi",
  "Bravarski radovi",
  "Keramičarski radovi",
  "Podopolagački radovi",
  "Soboslikarski i ličilački radovi",
  "Fasaderski radovi",
  "Instalaterski radovi - vodovod i kanalizacija",
  "Instalaterski radovi - grijanje",
  "Elektroinstalaterski radovi",
];

const insertGroup = db.query(
  "INSERT OR IGNORE INTO item_groups (name, created_by) VALUES (?, NULL)"
);

for (const name of groups) {
  insertGroup.run(name);
}

// Seed some common library items
const items: { group: string; name: string; description: string; unit: string; unit_price: number }[] = [
  { group: "Pripremni radovi", name: "Čišćenje terena", description: "Čišćenje terena od rastinja, šiblja i otpadaka sa odvozom na deponiju", unit: "m²", unit_price: 2.5 },
  { group: "Pripremni radovi", name: "Rušenje postojećeg objekta", description: "Rušenje postojećeg objekta sa odvozom šuta na gradsku deponiju", unit: "m³", unit_price: 35.0 },
  { group: "Zemljani radovi", name: "Široki iskop", description: "Široki iskop zemlje III kategorije mašinskim putem sa utovarom u kamion", unit: "m³", unit_price: 8.0 },
  { group: "Zemljani radovi", name: "Ručni iskop", description: "Ručni iskop zemlje III kategorije za trakaste temelje", unit: "m³", unit_price: 25.0 },
  { group: "Zemljani radovi", name: "Nasipanje i nabijanje", description: "Nasipanje i nabijanje šljunkom u slojevima od 20cm", unit: "m³", unit_price: 18.0 },
  { group: "Betonski i armiranobetonski radovi", name: "Podložni beton MB 10", description: "Betoniranje podložnog betona marke MB 10, debljine 10cm", unit: "m³", unit_price: 120.0 },
  { group: "Betonski i armiranobetonski radovi", name: "Beton temelja MB 30", description: "Betoniranje temelja betonom marke MB 30 sa ugradnjom i vibriranjem", unit: "m³", unit_price: 160.0 },
  { group: "Zidarski radovi", name: "Zidanje blok opekom", description: "Zidanje zidova blok opekom d=25cm u produžnom malteru", unit: "m²", unit_price: 45.0 },
  { group: "Zidarski radovi", name: "Malterisanje zidova", description: "Malterisanje unutrašnjih zidova produžnim malterom u dva sloja", unit: "m²", unit_price: 15.0 },
  { group: "Tesarski radovi", name: "Oplata temelja", description: "Izrada i montaža drvene oplate temelja", unit: "m²", unit_price: 22.0 },
  { group: "Tesarski radovi", name: "Oplata ploče", description: "Izrada i montaža drvene oplate armirano-betonske ploče", unit: "m²", unit_price: 28.0 },
  { group: "Armirački radovi", name: "Armatura RA 400/500", description: "Nabavka, sječenje, savijanje i ugradnja armature RA 400/500", unit: "kg", unit_price: 2.8 },
  { group: "Armirački radovi", name: "Armaturna mreža MAG 500/560", description: "Nabavka i ugradnja armaturne mreže MAG 500/560", unit: "kg", unit_price: 2.5 },
  { group: "Izolaterski radovi", name: "Hidroizolacija temelja", description: "Izrada horizontalne hidroizolacije temelja bitumenskom trakom", unit: "m²", unit_price: 18.0 },
  { group: "Keramičarski radovi", name: "Postavljanje podnih pločica", description: "Nabavka i postavljanje podnih keramičkih pločica I klase ljepljenjem", unit: "m²", unit_price: 35.0 },
  { group: "Soboslikarski i ličilački radovi", name: "Gletovanje zidova", description: "Gletovanje unutrašnjih zidova glet masom u dva sloja sa brušenjem", unit: "m²", unit_price: 8.0 },
  { group: "Soboslikarski i ličilački radovi", name: "Bojenje zidova", description: "Bojenje unutrašnjih zidova poludisperzivnom bojom u dva sloja", unit: "m²", unit_price: 5.0 },
  { group: "Fasaderski radovi", name: "Stiropor fasada 10cm", description: "Izrada fasade sa termoizolacijom od stiropora d=10cm, sa mrežicom i završnom obradom", unit: "m²", unit_price: 42.0 },
];

const insertItem = db.query(`
  INSERT OR IGNORE INTO library_items (group_id, name, description, unit, unit_price, created_by)
  VALUES ((SELECT id FROM item_groups WHERE name = ?), ?, ?, ?, ?, NULL)
`);

for (const item of items) {
  insertItem.run(item.group, item.name, item.description, item.unit, item.unit_price);
}

console.log("Seed complete:");
console.log(`- Super admin: admin / admin123`);
console.log(`- ${groups.length} item groups`);
console.log(`- ${items.length} library items`);

db.close();
```

- [ ] **Step 7: Commit**

```
feat: database schema with migrations and seed data
```

---

### Task 3: Auth System

**Files:**
- Create: `server/auth/session.ts`
- Create: `server/auth/middleware.ts`
- Create: `server/routes/auth.ts`
- Create: `test/auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/auth.test.ts`:
```ts
import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";

let db: Database;
let baseUrl: string;
let server: any;

beforeAll(async () => {
  db = new Database(":memory:");
  createSchema(db);

  // Create a test company and user
  db.query("INSERT INTO companies (name) VALUES (?)").run("Test Co");
  const hash = await Bun.password.hash("test123", { algorithm: "bcrypt" });
  db.query(
    "INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)"
  ).run("testuser", hash, "Test User", "user", 1);
  db.query(
    "INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)"
  ).run("admin", hash, "Admin", "super_admin");

  // Import and start server with test db
  const { createAuthRoutes } = await import("../server/routes/auth");
  const routes = createAuthRoutes(db);

  server = Bun.serve({
    port: 0,
    routes,
  });
  baseUrl = `http://localhost:${server.port}`;
});

afterAll(() => {
  server?.stop();
  db.close();
});

describe("POST /api/auth/login", () => {
  test("returns session cookie on valid credentials", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testuser", password: "test123" }),
    });
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("session=");
    expect(cookie).toContain("HttpOnly");
  });

  test("returns 401 on invalid credentials", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testuser", password: "wrong" }),
    });
    expect(res.status).toBe(401);
  });

  test("returns 401 on non-existent user", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "nobody", password: "test123" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  test("returns user info with valid session", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testuser", password: "test123" }),
    });
    const cookie = loginRes.headers.get("set-cookie")!;

    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookie.split(";")[0] },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.username).toBe("testuser");
    expect(data.company).toBeDefined();
    expect(data.company.name).toBe("Test Co");
    expect(data.password_hash).toBeUndefined();
  });

  test("returns 401 without session", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  test("destroys session", async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "testuser", password: "test123" }),
    });
    const cookie = loginRes.headers.get("set-cookie")!;
    const sessionCookie = cookie.split(";")[0];

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    expect(logoutRes.status).toBe(200);

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    expect(meRes.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd predmjer-i-predracun && bun test test/auth.test.ts`
Expected: FAIL — cannot resolve modules

- [ ] **Step 3: Implement session management**

Create `server/auth/session.ts`:
```ts
import { Database } from "bun:sqlite";

export function createSession(db: Database, userId: number): string {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expiresAt
  );
  return token;
}

export function validateSession(
  db: Database,
  token: string
): { userId: number } | null {
  const session = db
    .query("SELECT user_id, expires_at FROM sessions WHERE id = ?")
    .get(token) as { user_id: number; expires_at: string } | null;

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
```

- [ ] **Step 4: Implement auth middleware**

Create `server/auth/middleware.ts`:
```ts
import { Database } from "bun:sqlite";
import { getSessionFromCookie, validateSession } from "./session";

export type AuthUser = {
  id: number;
  username: string;
  display_name: string;
  role: "super_admin" | "user";
  company_id: number | null;
};

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

export function authenticate(
  db: Database,
  req: Request
): AuthUser | null {
  const token = getSessionFromCookie(req);
  if (!token) return null;

  const session = validateSession(db, token);
  if (!session) return null;

  const user = db
    .query(
      "SELECT id, username, display_name, role, company_id FROM users WHERE id = ?"
    )
    .get(session.userId) as AuthUser | null;

  return user;
}

export function requireAuth(db: Database, req: Request): AuthUser | Response {
  const user = authenticate(db, req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export function requireAdmin(db: Database, req: Request): AuthUser | Response {
  const result = requireAuth(db, req);
  if (result instanceof Response) return result;
  if (result.role !== "super_admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

export function checkSubscription(db: Database, user: AuthUser): Response | null {
  if (user.role === "super_admin") return null;
  if (!user.company_id) return null;

  const company = db
    .query("SELECT subscription_expires_at FROM companies WHERE id = ?")
    .get(user.company_id) as { subscription_expires_at: string | null } | null;

  if (!company) return null;
  if (!company.subscription_expires_at) {
    return Response.json(
      { error: "subscription_expired", message: "Vaša pretplata je istekla." },
      { status: 403 }
    );
  }
  if (new Date(company.subscription_expires_at) < new Date()) {
    return Response.json(
      { error: "subscription_expired", message: "Vaša pretplata je istekla." },
      { status: 403 }
    );
  }
  return null;
}
```

- [ ] **Step 5: Implement auth routes**

Create `server/routes/auth.ts`:
```ts
import { Database } from "bun:sqlite";
import { createSession, destroySession, getSessionFromCookie, sessionCookie } from "../auth/session";
import { authenticate } from "../auth/middleware";

export function createAuthRoutes(db: Database) {
  return {
    "/api/auth/login": {
      async POST(req: Request) {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
          return Response.json({ error: "Username and password required" }, { status: 400 });
        }

        const user = db
          .query("SELECT id, password_hash FROM users WHERE username = ?")
          .get(username) as { id: number; password_hash: string } | null;

        if (!user) {
          return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const valid = await Bun.password.verify(password, user.password_hash);
        if (!valid) {
          return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = createSession(db, user.id);

        return Response.json({ ok: true }, {
          headers: { "Set-Cookie": sessionCookie(token) },
        });
      },
    },

    "/api/auth/logout": {
      POST(req: Request) {
        const token = getSessionFromCookie(req);
        if (token) {
          destroySession(db, token);
        }
        return Response.json({ ok: true }, {
          headers: { "Set-Cookie": "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" },
        });
      },
    },

    "/api/auth/me": {
      GET(req: Request) {
        const user = authenticate(db, req);
        if (!user) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        let company = null;
        if (user.company_id) {
          company = db
            .query("SELECT id, name, address, phone, email, logo_url, subscription_expires_at FROM companies WHERE id = ?")
            .get(user.company_id);
        }

        return Response.json({
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role,
          company_id: user.company_id,
          company,
        });
      },
    },
  };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd predmjer-i-predracun && bun test test/auth.test.ts`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```
feat: auth system with session management and subscription check
```

---

### Task 4: Admin API Routes

**Files:**
- Create: `server/routes/admin.ts`
- Create: `test/admin.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/admin.test.ts`:
```ts
import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";
import { createAuthRoutes } from "../server/routes/auth";
import { createAdminRoutes } from "../server/routes/admin";

let db: Database;
let baseUrl: string;
let server: any;
let adminCookie: string;
let userCookie: string;

beforeAll(async () => {
  db = new Database(":memory:");
  createSchema(db);

  const hash = await Bun.password.hash("test123", { algorithm: "bcrypt" });
  db.query("INSERT INTO companies (name) VALUES (?)").run("Existing Co");
  db.query(
    "INSERT INTO users (username, password_hash, display_name, role) VALUES (?, ?, ?, ?)"
  ).run("admin", hash, "Admin", "super_admin");
  db.query(
    "INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)"
  ).run("user1", hash, "User 1", "user", 1);

  const authRoutes = createAuthRoutes(db);
  const adminRoutes = createAdminRoutes(db);

  server = Bun.serve({
    port: 0,
    routes: { ...authRoutes, ...adminRoutes },
  });
  baseUrl = `http://localhost:${server.port}`;

  // Login as admin
  let res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "test123" }),
  });
  adminCookie = res.headers.get("set-cookie")!.split(";")[0];

  // Login as user
  res = await fetch(`${baseUrl}/api/auth/login`, {
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

describe("Companies CRUD", () => {
  test("admin can create company", async () => {
    const res = await fetch(`${baseUrl}/api/admin/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ name: "New Co", address: "Addr", phone: "123", email: "new@co.com" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("New Co");
  });

  test("admin can list companies", async () => {
    const res = await fetch(`${baseUrl}/api/admin/companies`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  test("admin can update company with subscription date", async () => {
    const res = await fetch(`${baseUrl}/api/admin/companies/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ name: "Updated Co", subscription_expires_at: "2027-01-01T00:00:00.000Z" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated Co");
    expect(data.subscription_expires_at).toBe("2027-01-01T00:00:00.000Z");
  });

  test("regular user cannot access admin routes", async () => {
    const res = await fetch(`${baseUrl}/api/admin/companies`, {
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(403);
  });
});

describe("Users CRUD", () => {
  test("admin can create user", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        username: "newuser",
        password: "pass123",
        display_name: "New User",
        role: "user",
        company_id: 1,
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.username).toBe("newuser");
    expect(data.password_hash).toBeUndefined();
  });

  test("admin can list users", async () => {
    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Cookie: adminCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd predmjer-i-predracun && bun test test/admin.test.ts`
Expected: FAIL — cannot resolve `../server/routes/admin`

- [ ] **Step 3: Implement admin routes**

Create `server/routes/admin.ts`:
```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd predmjer-i-predracun && bun test test/admin.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```
feat: admin API routes for companies and users management
```

---

### Task 5: Library API Routes

**Files:**
- Create: `server/routes/library.ts`
- Create: `test/library.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/library.test.ts`:
```ts
import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";
import { createAuthRoutes } from "../server/routes/auth";
import { createLibraryRoutes } from "../server/routes/library";

let db: Database;
let baseUrl: string;
let server: any;
let userCookie: string;
let user2Cookie: string;

beforeAll(async () => {
  db = new Database(":memory:");
  createSchema(db);

  db.query("INSERT INTO companies (name, subscription_expires_at) VALUES (?, ?)").run("Test Co", "2030-01-01T00:00:00.000Z");
  const hash = await Bun.password.hash("test123", { algorithm: "bcrypt" });
  db.query("INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)").run("user1", hash, "User 1", "user", 1);
  db.query("INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)").run("user2", hash, "User 2", "user", 1);

  // Seed a system group
  db.query("INSERT INTO item_groups (name, created_by) VALUES (?, NULL)").run("Zidarski radovi");
  db.query("INSERT INTO library_items (group_id, name, description, unit, unit_price, created_by) VALUES (?, ?, ?, ?, ?, NULL)").run(1, "System Item", "Desc", "m²", 10.0);

  const authRoutes = createAuthRoutes(db);
  const libraryRoutes = createLibraryRoutes(db);

  server = Bun.serve({ port: 0, routes: { ...authRoutes, ...libraryRoutes } });
  baseUrl = `http://localhost:${server.port}`;

  let res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user1", password: "test123" }),
  });
  userCookie = res.headers.get("set-cookie")!.split(";")[0];

  res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "user2", password: "test123" }),
  });
  user2Cookie = res.headers.get("set-cookie")!.split(";")[0];
});

afterAll(() => {
  server?.stop();
  db.close();
});

describe("Item Groups", () => {
  test("can list all groups", async () => {
    const res = await fetch(`${baseUrl}/api/item-groups`, { headers: { Cookie: userCookie } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  test("can create a group", async () => {
    const res = await fetch(`${baseUrl}/api/item-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "My Group" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("My Group");
    expect(data.created_by).toBe(1);
  });

  test("cannot delete system group", async () => {
    const res = await fetch(`${baseUrl}/api/item-groups/1`, {
      method: "DELETE",
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(403);
  });

  test("cannot delete another user's group", async () => {
    const res = await fetch(`${baseUrl}/api/item-groups/2`, {
      method: "DELETE",
      headers: { Cookie: user2Cookie },
    });
    expect(res.status).toBe(403);
  });
});

describe("Library Items", () => {
  test("can list items by group", async () => {
    const res = await fetch(`${baseUrl}/api/library-items?group_id=1`, {
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  test("can create item", async () => {
    const res = await fetch(`${baseUrl}/api/library-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ group_id: 1, name: "My Item", description: "Desc", unit: "kom", unit_price: 5.0 }),
    });
    expect(res.status).toBe(201);
  });

  test("cannot edit system item", async () => {
    const res = await fetch(`${baseUrl}/api/library-items/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "Renamed" }),
    });
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd predmjer-i-predracun && bun test test/library.test.ts`

- [ ] **Step 3: Implement library routes**

Create `server/routes/library.ts`:
```ts
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
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd predmjer-i-predracun && bun test test/library.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```
feat: library API routes for item groups and library items
```

---

### Task 6: Estimates API Routes

**Files:**
- Create: `server/routes/estimates.ts`
- Create: `test/estimates.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/estimates.test.ts`:
```ts
import { test, expect, beforeAll, afterAll, describe } from "bun:test";
import { Database } from "bun:sqlite";
import { createSchema } from "../server/db/schema";
import { createAuthRoutes } from "../server/routes/auth";
import { createEstimateRoutes } from "../server/routes/estimates";

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

  const authRoutes = createAuthRoutes(db);
  const estimateRoutes = createEstimateRoutes(db);

  server = Bun.serve({ port: 0, routes: { ...authRoutes, ...estimateRoutes } });
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

describe("Estimates CRUD", () => {
  test("can create estimate", async () => {
    const res = await fetch(`${baseUrl}/api/estimates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "Test Estimate", client_name: "Client", location: "Sarajevo" }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("Test Estimate");
    expect(data.status).toBe("draft");
  });

  test("can list company estimates", async () => {
    const res = await fetch(`${baseUrl}/api/estimates`, { headers: { Cookie: userCookie } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.length).toBe(1);
  });

  test("can get estimate with groups and items", async () => {
    // Add a group first
    await fetch(`${baseUrl}/api/estimates/1/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ group_name: "Zidarski radovi", sort_order: 0 }),
    });

    // Add an item
    await fetch(`${baseUrl}/api/estimate-groups/1/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "Zidanje", description: "Zidanje blok opekom", unit: "m²", quantity: 100, unit_price: 45 }),
    });

    const res = await fetch(`${baseUrl}/api/estimates/1`, { headers: { Cookie: userCookie } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.groups.length).toBe(1);
    expect(data.groups[0].items.length).toBe(1);
    expect(data.groups[0].items[0].quantity).toBe(100);
  });

  test("can change status", async () => {
    const res = await fetch(`${baseUrl}/api/estimates/1/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ status: "finished" }),
    });
    expect(res.status).toBe(200);
  });

  test("cannot edit finished estimate", async () => {
    const res = await fetch(`${baseUrl}/api/estimates/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ name: "Changed" }),
    });
    expect(res.status).toBe(403);
  });

  test("can duplicate estimate", async () => {
    // Set back to draft first
    await fetch(`${baseUrl}/api/estimates/1/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: userCookie },
      body: JSON.stringify({ status: "draft" }),
    });

    const res = await fetch(`${baseUrl}/api/estimates/1/duplicate`, {
      method: "POST",
      headers: { Cookie: userCookie },
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toContain("Kopija");

    // Verify duplicated data
    const detailRes = await fetch(`${baseUrl}/api/estimates/${data.id}`, { headers: { Cookie: userCookie } });
    const detail = await detailRes.json();
    expect(detail.groups.length).toBe(1);
    expect(detail.groups[0].items.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd predmjer-i-predracun && bun test test/estimates.test.ts`

- [ ] **Step 3: Implement estimate routes**

Create `server/routes/estimates.ts`:
```ts
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

        for (const key of ["name", "client_name", "location"]) {
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
            "INSERT INTO estimates (company_id, name, client_name, location, status, created_by) VALUES (?, ?, ?, ?, 'draft', ?) RETURNING *"
          )
          .get(estimate.company_id, `Kopija - ${estimate.name}`, estimate.client_name, estimate.location, user.id) as any;

        const groups = db.query("SELECT * FROM estimate_groups WHERE estimate_id = ? ORDER BY sort_order").all(id) as any[];

        for (const group of groups) {
          const newGroup = db
            .query("INSERT INTO estimate_groups (estimate_id, group_name, sort_order) VALUES (?, ?, ?) RETURNING *")
            .get(newEstimate.id, group.group_name, group.sort_order) as any;

          const items = db.query("SELECT * FROM estimate_items WHERE estimate_group_id = ? ORDER BY sort_order").all(group.id) as any[];

          for (const item of items) {
            db.query(
              "INSERT INTO estimate_items (estimate_group_id, library_item_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            ).run(newGroup.id, item.library_item_id, item.name, item.description, item.unit, item.quantity, item.unit_price, item.sort_order);
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd predmjer-i-predracun && bun test test/estimates.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```
feat: estimates API with groups, items, duplicate, and status management
```

---

### Task 7: Export API (PDF & Excel)

**Files:**
- Create: `server/lib/pdf.ts`
- Create: `server/lib/excel.ts`
- Create: `server/routes/export.ts`
- Create: `test/export.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/export.test.ts`:
```ts
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

  db.query("INSERT INTO companies (name, address, phone, email, subscription_expires_at) VALUES (?, ?, ?, ?, ?)").run("Građevinska firma d.o.o.", "Ulica 1, Sarajevo", "+387 33 123 456", "info@firma.ba", "2030-01-01");
  const hash = await Bun.password.hash("test123", { algorithm: "bcrypt" });
  db.query("INSERT INTO users (username, password_hash, display_name, role, company_id) VALUES (?, ?, ?, ?, ?)").run("user1", hash, "Tarik", "user", 1);

  // Create estimate with groups and items
  db.query("INSERT INTO estimates (company_id, name, client_name, location, status, created_by) VALUES (?, ?, ?, ?, ?, ?)").run(1, "Stambeni objekat", "Investitor d.o.o.", "Sarajevo", "draft", 1);
  db.query("INSERT INTO estimate_groups (estimate_id, group_name, sort_order) VALUES (?, ?, ?)").run(1, "Zemljani radovi", 0);
  db.query("INSERT INTO estimate_items (estimate_group_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)").run(1, "Široki iskop", "Iskop zemlje III kat.", "m³", 250, 8.0, 0);
  db.query("INSERT INTO estimate_items (estimate_group_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)").run(1, "Ručni iskop", "Ručni iskop za temelje", "m³", 30, 25.0, 1);
  db.query("INSERT INTO estimate_groups (estimate_id, group_name, sort_order) VALUES (?, ?, ?)").run(1, "Betonski radovi", 1);
  db.query("INSERT INTO estimate_items (estimate_group_id, name, description, unit, quantity, unit_price, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)").run(2, "Podložni beton", "MB 10 d=10cm", "m³", 15, 120.0, 0);

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd predmjer-i-predracun && bun test test/export.test.ts`

- [ ] **Step 3: Implement PDF generation**

Create `server/lib/pdf.ts`:
```ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type EstimateData = {
  estimate: {
    name: string;
    client_name: string;
    location: string;
    created_at: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  groups: {
    group_name: string;
    items: {
      name: string;
      description: string;
      unit: string;
      quantity: number;
      unit_price: number;
    }[];
  }[];
};

export function generatePDF(data: EstimateData): ArrayBuffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header — company info
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.company.name, margin, 20);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.company.address, margin, 26);
  doc.text(`Tel: ${data.company.phone} | Email: ${data.company.email}`, margin, 31);

  // Separator line
  doc.setDrawColor(200);
  doc.line(margin, 35, pageWidth - margin, 35);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PREDMJER I PREDRAČUN RADOVA", margin, 44);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Naziv: ${data.estimate.name}`, margin, 52);
  doc.text(`Investitor: ${data.estimate.client_name}`, margin, 57);
  doc.text(`Lokacija: ${data.estimate.location}`, margin, 62);
  doc.text(`Datum: ${new Date(data.estimate.created_at).toLocaleDateString("bs-BA")}`, margin, 67);

  let yPos = 75;
  let itemCounter = 0;
  const groupTotals: { name: string; total: number }[] = [];

  for (const group of data.groups) {
    // Group header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(group.group_name.toUpperCase(), margin, yPos);
    yPos += 3;

    const tableData = group.items.map((item) => {
      itemCounter++;
      const total = item.quantity * item.unit_price;
      return [
        itemCounter.toString(),
        item.name,
        item.description,
        item.unit,
        item.quantity.toFixed(2),
        item.unit_price.toFixed(2),
        total.toFixed(2),
      ];
    });

    const groupTotal = group.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    groupTotals.push({ name: group.group_name, total: groupTotal });

    autoTable(doc, {
      startY: yPos,
      head: [["R.br.", "Naziv stavke", "Opis", "Jed.", "Količina", "Jed. cijena", "Ukupno"]],
      body: tableData,
      foot: [["", "", "", "", "", "UKUPNO:", groupTotal.toFixed(2)]],
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: "bold" },
      footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 30 },
        2: { cellWidth: 45 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20, halign: "right" },
        5: { cellWidth: 22, halign: "right" },
        6: { cellWidth: 22, halign: "right" },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  }

  // Recapitulation
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("REKAPITULACIJA", margin, yPos);
  yPos += 3;

  const recapData = groupTotals.map((g, i) => [
    (i + 1).toString(),
    g.name,
    g.total.toFixed(2),
  ]);

  const grandTotal = groupTotals.reduce((sum, g) => sum + g.total, 0);

  autoTable(doc, {
    startY: yPos,
    head: [["R.br.", "Grupa radova", "Iznos"]],
    body: recapData,
    foot: [["", "UKUPNO:", grandTotal.toFixed(2)]],
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: "bold" },
    footStyles: { fillColor: [220, 220, 220], fontStyle: "bold", fontSize: 12 },
    columnStyles: {
      0: { cellWidth: 15 },
      2: { halign: "right", cellWidth: 35 },
    },
  });

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Stranica ${i} od ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  return doc.output("arraybuffer");
}
```

- [ ] **Step 4: Implement Excel generation**

Create `server/lib/excel.ts`:
```ts
import ExcelJS from "exceljs";

type EstimateData = {
  estimate: {
    name: string;
    client_name: string;
    location: string;
    created_at: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  groups: {
    group_name: string;
    items: {
      name: string;
      description: string;
      unit: string;
      quantity: number;
      unit_price: number;
    }[];
  }[];
};

export async function generateExcel(data: EstimateData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Predmjer", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
  });

  // Column widths
  sheet.columns = [
    { width: 6 },   // R.br.
    { width: 25 },  // Naziv
    { width: 35 },  // Opis
    { width: 8 },   // Jed.
    { width: 12 },  // Količina
    { width: 12 },  // Jed. cijena
    { width: 14 },  // Ukupno
  ];

  // Company header
  const companyRow = sheet.addRow([data.company.name]);
  companyRow.font = { bold: true, size: 14 };
  sheet.mergeCells(companyRow.number, 1, companyRow.number, 7);

  const addrRow = sheet.addRow([`${data.company.address} | Tel: ${data.company.phone} | ${data.company.email}`]);
  addrRow.font = { size: 9, color: { argb: "FF666666" } };
  sheet.mergeCells(addrRow.number, 1, addrRow.number, 7);

  sheet.addRow([]);

  // Title
  const titleRow = sheet.addRow(["PREDMJER I PREDRAČUN RADOVA"]);
  titleRow.font = { bold: true, size: 13 };
  sheet.mergeCells(titleRow.number, 1, titleRow.number, 7);

  sheet.addRow([`Naziv: ${data.estimate.name}`]);
  sheet.addRow([`Investitor: ${data.estimate.client_name}`]);
  sheet.addRow([`Lokacija: ${data.estimate.location}`]);
  sheet.addRow([`Datum: ${new Date(data.estimate.created_at).toLocaleDateString("bs-BA")}`]);
  sheet.addRow([]);

  let itemCounter = 0;
  const groupSubtotalRows: { row: number; name: string }[] = [];

  for (const group of data.groups) {
    // Group header
    const groupRow = sheet.addRow([group.group_name.toUpperCase()]);
    groupRow.font = { bold: true, size: 11 };
    groupRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3C3C3C" } };
    groupRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    sheet.mergeCells(groupRow.number, 1, groupRow.number, 7);

    // Table header
    const headerRow = sheet.addRow(["R.br.", "Naziv stavke", "Opis", "Jed.", "Količina", "Jed. cijena", "Ukupno"]);
    headerRow.font = { bold: true, size: 9 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };

    const firstItemRow = sheet.rowCount + 1;

    for (const item of group.items) {
      itemCounter++;
      const row = sheet.addRow([
        itemCounter,
        item.name,
        item.description,
        item.unit,
        item.quantity,
        item.unit_price,
        { formula: `E${sheet.rowCount + 1}*F${sheet.rowCount + 1}` },
      ]);
      // Fix: formula references should use current row
      const currentRow = sheet.rowCount;
      row.getCell(7).value = { formula: `E${currentRow}*F${currentRow}` } as any;
      row.getCell(5).numFmt = "#,##0.00";
      row.getCell(6).numFmt = "#,##0.00";
      row.getCell(7).numFmt = "#,##0.00";
    }

    const lastItemRow = sheet.rowCount;

    // Subtotal row
    const subtotalRow = sheet.addRow(["", "", "", "", "", "UKUPNO:", { formula: `SUM(G${firstItemRow}:G${lastItemRow})` }]);
    subtotalRow.font = { bold: true };
    subtotalRow.getCell(7).numFmt = "#,##0.00";
    groupSubtotalRows.push({ row: sheet.rowCount, name: group.group_name });

    sheet.addRow([]);
  }

  // Recapitulation
  sheet.addRow([]);
  const recapTitle = sheet.addRow(["REKAPITULACIJA"]);
  recapTitle.font = { bold: true, size: 12 };
  sheet.mergeCells(recapTitle.number, 1, recapTitle.number, 7);

  const recapHeader = sheet.addRow(["R.br.", "Grupa radova", "", "", "", "", "Iznos"]);
  recapHeader.font = { bold: true };
  recapHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };

  const recapStartRow = sheet.rowCount + 1;

  groupSubtotalRows.forEach((g, i) => {
    const row = sheet.addRow([i + 1, g.name, "", "", "", "", { formula: `G${g.row}` }]);
    row.getCell(7).numFmt = "#,##0.00";
    sheet.mergeCells(row.number, 2, row.number, 6);
  });

  const recapEndRow = sheet.rowCount;

  const grandTotalRow = sheet.addRow(["", "UKUPNO:", "", "", "", "", { formula: `SUM(G${recapStartRow}:G${recapEndRow})` }]);
  grandTotalRow.font = { bold: true, size: 12 };
  grandTotalRow.getCell(7).numFmt = "#,##0.00";
  sheet.mergeCells(grandTotalRow.number, 2, grandTotalRow.number, 6);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
```

- [ ] **Step 5: Implement export routes**

Create `server/routes/export.ts`:
```ts
import { Database } from "bun:sqlite";
import { requireAuth, checkSubscription } from "../auth/middleware";
import { generatePDF } from "../lib/pdf";
import { generateExcel } from "../lib/excel";

export function createExportRoutes(db: Database) {
  function getEstimateData(db: Database, estimateId: number) {
    const estimate = db.query("SELECT * FROM estimates WHERE id = ?").get(estimateId) as any;
    if (!estimate) return null;

    const company = db.query("SELECT * FROM companies WHERE id = ?").get(estimate.company_id) as any;

    const groups = db
      .query("SELECT * FROM estimate_groups WHERE estimate_id = ? ORDER BY sort_order")
      .all(estimateId) as any[];

    for (const group of groups) {
      group.items = db
        .query("SELECT * FROM estimate_items WHERE estimate_group_id = ? ORDER BY sort_order")
        .all(group.id);
    }

    return { estimate, company, groups };
  }

  return {
    "/api/estimates/:id/export/pdf": {
      GET(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const data = getEstimateData(db, id);
        if (!data) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && data.estimate.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const pdfBuffer = generatePDF(data);
        const filename = `predmjer-${data.estimate.name.replace(/\s+/g, "-")}.pdf`;

        return new Response(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      },
    },
    "/api/estimates/:id/export/excel": {
      async GET(req: Request) {
        const user = requireAuth(db, req);
        if (user instanceof Response) return user;
        const sub = checkSubscription(db, user);
        if (sub) return sub;

        const id = parseInt(req.params.id);
        const data = getEstimateData(db, id);
        if (!data) return Response.json({ error: "Not found" }, { status: 404 });
        if (user.role !== "super_admin" && data.estimate.company_id !== user.company_id) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const excelBuffer = await generateExcel(data);
        const filename = `predmjer-${data.estimate.name.replace(/\s+/g, "-")}.xlsx`;

        return new Response(excelBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      },
    },
  };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd predmjer-i-predracun && bun test test/export.test.ts`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```
feat: PDF and Excel export for estimates
```

---

### Task 8: Wire Up Server with All Routes

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Update server entry to register all routes**

Update `src/index.ts`:
```ts
import { serve } from "bun";
import index from "./index.html";
import db from "../server/db/index";
import { createAuthRoutes } from "../server/routes/auth";
import { createAdminRoutes } from "../server/routes/admin";
import { createLibraryRoutes } from "../server/routes/library";
import { createEstimateRoutes } from "../server/routes/estimates";
import { createExportRoutes } from "../server/routes/export";

const authRoutes = createAuthRoutes(db);
const adminRoutes = createAdminRoutes(db);
const libraryRoutes = createLibraryRoutes(db);
const estimateRoutes = createEstimateRoutes(db);
const exportRoutes = createExportRoutes(db);

const server = serve({
  port: parseInt(process.env.PORT || "3000"),
  routes: {
    ...authRoutes,
    ...adminRoutes,
    ...libraryRoutes,
    ...estimateRoutes,
    ...exportRoutes,

    // Serve uploaded files
    "/uploads/*": async (req) => {
      const path = `./data${new URL(req.url).pathname}`;
      const file = Bun.file(path);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Not found", { status: 404 });
    },

    // SPA fallback — must be last
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);
```

- [ ] **Step 2: Run all backend tests**

Run: `cd predmjer-i-predracun && bun test`
Expected: All tests PASS

- [ ] **Step 3: Run seed and start server**

Run:
```bash
cd predmjer-i-predracun && bun run seed && bun dev
```
Expected: Seed completes, server starts, page loads

- [ ] **Step 4: Commit**

```
feat: wire up all API routes in server entry
```

---

### Task 9: Frontend — API Client & Auth Context

**Files:**
- Create: `src/lib/api.ts`
- Create: `src/lib/auth-context.tsx`

- [ ] **Step 1: Create API client**

Create `src/lib/api.ts`:
```ts
export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "same-origin",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.message || data.error || "Request failed", data.error);
  }

  if (res.headers.get("content-type")?.includes("json")) {
    return res.json();
  }
  return res as any;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: any) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: any) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(path, { method: "POST", body: formData, credentials: "same-origin" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(res.status, data.message || data.error || "Upload failed");
    }
    return res.json();
  },
};
```

- [ ] **Step 2: Create auth context**

Create `src/lib/auth-context.tsx`:
```tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api, ApiError } from "./api";

type Company = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  subscription_expires_at: string | null;
};

type User = {
  id: number;
  username: string;
  display_name: string;
  role: "super_admin" | "user";
  company_id: number | null;
  company: Company | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isSubscriptionExpired: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<User>("/api/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (username: string, password: string) => {
    await api.post("/api/auth/login", { username, password });
    await refresh();
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  };

  const isSubscriptionExpired =
    user?.role !== "super_admin" &&
    user?.company?.subscription_expires_at != null &&
    new Date(user.company.subscription_expires_at) < new Date();

  // Also check null subscription = expired
  const noSubscription =
    user?.role !== "super_admin" &&
    user?.company != null &&
    user.company.subscription_expires_at == null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refresh,
        isSubscriptionExpired: isSubscriptionExpired || noSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 3: Commit**

```
feat: API client and auth context for frontend
```

---

### Task 10: Frontend — Router, Layout & Core Pages

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/layout.tsx`
- Create: `src/components/protected-route.tsx`
- Create: `src/components/subscription-expired.tsx`
- Create: `src/pages/login.tsx`
- Create: `src/pages/dashboard.tsx`

- [ ] **Step 1: Create app router**

Update `src/App.tsx`:
```tsx
import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { LoginPage } from "./pages/login";
import { Dashboard } from "./pages/dashboard";
import { EstimateEditor } from "./pages/estimate-editor";
import { Library } from "./pages/library";
import { AdminCompanies } from "./pages/admin-companies";
import { AdminUsers } from "./pages/admin-users";
import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/protected-route";
import "./index.css";

type Route =
  | { page: "dashboard" }
  | { page: "estimate"; id: number }
  | { page: "library" }
  | { page: "admin-companies" }
  | { page: "admin-users" };

function Router() {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState<Route>({ page: "dashboard" });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Učitavanje...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ProtectedRoute>
      <Layout route={route} onNavigate={setRoute}>
        {route.page === "dashboard" && <Dashboard onOpenEstimate={(id) => setRoute({ page: "estimate", id })} />}
        {route.page === "estimate" && <EstimateEditor id={route.id} onBack={() => setRoute({ page: "dashboard" })} />}
        {route.page === "library" && <Library />}
        {route.page === "admin-companies" && <AdminCompanies />}
        {route.page === "admin-users" && <AdminUsers />}
      </Layout>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Create protected route with subscription check**

Create `src/components/protected-route.tsx`:
```tsx
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { SubscriptionExpired } from "./subscription-expired";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isSubscriptionExpired } = useAuth();

  if (isSubscriptionExpired) {
    return <SubscriptionExpired />;
  }

  return <>{children}</>;
}
```

Create `src/components/subscription-expired.tsx`:
```tsx
import { useAuth } from "../lib/auth-context";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

export function SubscriptionExpired() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Pretplata je istekla
        </h1>
        <p className="text-muted-foreground">
          Vaša pretplata je istekla. Molimo izvršite uplatu kako ne biste izgubili pristup.
          Kontaktirajte administratora za više informacija o produljenju pretplate.
        </p>
        <Button variant="outline" onClick={logout}>
          Odjavi se
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create app layout with sidebar**

Create `src/components/layout.tsx`:
```tsx
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Library,
  Building2,
  Users,
  LogOut,
  HardHat,
} from "lucide-react";

type Route =
  | { page: "dashboard" }
  | { page: "estimate"; id: number }
  | { page: "library" }
  | { page: "admin-companies" }
  | { page: "admin-users" };

type Props = {
  route: Route;
  onNavigate: (route: Route) => void;
  children: ReactNode;
};

export function Layout({ route, onNavigate, children }: Props) {
  const { user, logout } = useAuth();

  const navItems = [
    { page: "dashboard" as const, label: "Predmjeri", icon: LayoutDashboard },
    { page: "library" as const, label: "Biblioteka", icon: Library },
  ];

  const adminItems = [
    { page: "admin-companies" as const, label: "Kompanije", icon: Building2 },
    { page: "admin-users" as const, label: "Korisnici", icon: Users },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <HardHat className="w-6 h-6 text-primary" />
            <span className="font-bold text-sidebar-foreground">Predmjer</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.page}
              variant={route.page === item.page ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => onNavigate({ page: item.page })}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          ))}

          {user?.role === "super_admin" && (
            <>
              <div className="pt-4 pb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Admin
              </div>
              {adminItems.map((item) => (
                <Button
                  key={item.page}
                  variant={route.page === item.page ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => onNavigate({ page: item.page })}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="text-sm text-sidebar-foreground mb-2 px-2 truncate">
            {user?.display_name}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Odjavi se
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create login page**

Create `src/pages/login.tsx`:
```tsx
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { HardHat } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      setError("Pogrešno korisničko ime ili lozinka");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <HardHat className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Predmjer i Predračun</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Korisničko ime</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Lozinka</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Prijava..." : "Prijavi se"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Create dashboard page**

Create `src/pages/dashboard.tsx`:
```tsx
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Plus, Copy, FileDown, FileSpreadsheet, Trash2, Search } from "lucide-react";

type Estimate = {
  id: number;
  name: string;
  client_name: string;
  location: string;
  status: "draft" | "finished";
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export function Dashboard({ onOpenEstimate }: { onOpenEstimate: (id: number) => void }) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const load = async () => {
    const data = await api.get<Estimate[]>("/api/estimates");
    setEstimates(data);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = estimates.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.client_name.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const est = await api.post<Estimate>("/api/estimates", {
      name: newName,
      client_name: newClient,
      location: newLocation,
    });
    setShowNew(false);
    setNewName("");
    setNewClient("");
    setNewLocation("");
    onOpenEstimate(est.id);
  };

  const handleDuplicate = async (id: number) => {
    const est = await api.post<Estimate>(`/api/estimates/${id}/duplicate`);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovaj predmjer?")) return;
    await api.delete(`/api/estimates/${id}`);
    load();
  };

  const handleExportPdf = (id: number) => {
    window.open(`/api/estimates/${id}/export/pdf`, "_blank");
  };

  const handleExportExcel = (id: number) => {
    window.open(`/api/estimates/${id}/export/excel`, "_blank");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Predmjeri i predračuni</h1>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novi predmjer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novi predmjer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Naziv</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Naziv predmjera" autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Investitor</Label>
                <Input value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Naziv investitora" />
              </div>
              <div className="space-y-2">
                <Label>Lokacija</Label>
                <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Lokacija projekta" />
              </div>
              <Button onClick={handleCreate} className="w-full">Kreiraj</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pretraži predmjere..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naziv</TableHead>
              <TableHead>Investitor</TableHead>
              <TableHead>Lokacija</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kreirao</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {estimates.length === 0 ? "Nemate predmjera. Kreirajte prvi!" : "Nema rezultata pretrage."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((est) => (
                <TableRow
                  key={est.id}
                  className="cursor-pointer"
                  onClick={() => onOpenEstimate(est.id)}
                >
                  <TableCell className="font-medium">{est.name}</TableCell>
                  <TableCell>{est.client_name}</TableCell>
                  <TableCell>{est.location}</TableCell>
                  <TableCell>
                    <Badge variant={est.status === "finished" ? "default" : "secondary"}>
                      {est.status === "finished" ? "Završen" : "Nacrt"}
                    </Badge>
                  </TableCell>
                  <TableCell>{est.created_by_name}</TableCell>
                  <TableCell>{new Date(est.updated_at).toLocaleDateString("bs-BA")}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(est.id)} title="Kopiraj">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleExportPdf(est.id)} title="PDF">
                        <FileDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleExportExcel(est.id)} title="Excel">
                        <FileSpreadsheet className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(est.id)} title="Obriši">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```
feat: frontend router, layout, login, and dashboard pages
```

---

### Task 11: Frontend — Estimate Editor

**Files:**
- Create: `src/pages/estimate-editor.tsx`

- [ ] **Step 1: Create estimate editor page**

Create `src/pages/estimate-editor.tsx`:

```tsx
import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  ArrowLeft, ChevronDown, ChevronRight, Plus, Trash2, Library,
  FileDown, FileSpreadsheet, Lock, Unlock, GripVertical,
} from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type EstimateItem = {
  id: number;
  estimate_group_id: number;
  library_item_id: number | null;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  sort_order: number;
};

type EstimateGroup = {
  id: number;
  estimate_id: number;
  group_name: string;
  sort_order: number;
  items: EstimateItem[];
};

type Estimate = {
  id: number;
  name: string;
  client_name: string;
  location: string;
  status: "draft" | "finished";
  created_by: number;
  groups: EstimateGroup[];
};

type LibraryItem = {
  id: number;
  group_id: number;
  name: string;
  description: string;
  unit: string;
  unit_price: number;
};

type ItemGroup = {
  id: number;
  name: string;
};

function SortableGroupRow({
  group,
  isDraft,
  onToggle,
  isOpen,
  children,
}: {
  group: EstimateGroup;
  isDraft: boolean;
  onToggle: () => void;
  isOpen: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `group-${group.id}`,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const subtotal = group.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <div className="flex items-center gap-2 p-3 bg-secondary rounded-t-lg border border-border">
          {isDraft && (
            <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <CollapsibleTrigger className="flex items-center gap-2 flex-1">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-semibold">{group.group_name}</span>
            <span className="text-sm text-muted-foreground ml-auto">
              ({group.items.length} stavki) — {subtotal.toFixed(2)} KM
            </span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function EstimateEditor({ id, onBack }: { id: number; onBack: () => void }) {
  const { user } = useAuth();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set());
  const [showLibrary, setShowLibrary] = useState<{ groupId: number } | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Library state
  const [libraryGroups, setLibraryGroups] = useState<ItemGroup[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [libGroupFilter, setLibGroupFilter] = useState<string>("all");
  const [libSearch, setLibSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    const data = await api.get<Estimate>(`/api/estimates/${id}`);
    setEstimate(data);
    if (openGroups.size === 0 && data.groups.length > 0) {
      setOpenGroups(new Set(data.groups.map((g) => g.id)));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const loadLibrary = async () => {
    const [groups, items] = await Promise.all([
      api.get<ItemGroup[]>("/api/item-groups"),
      api.get<LibraryItem[]>("/api/library-items"),
    ]);
    setLibraryGroups(groups);
    setLibraryItems(items);
  };

  if (!estimate) return <div className="p-6 text-muted-foreground">Učitavanje...</div>;

  const isDraft = estimate.status === "draft";
  const grandTotal = estimate.groups.reduce(
    (sum, g) => sum + g.items.reduce((s, item) => s + item.quantity * item.unit_price, 0),
    0
  );

  const handleMetaUpdate = async (field: string, value: string) => {
    await api.put(`/api/estimates/${id}`, { [field]: value });
    load();
  };

  const handleStatusToggle = async () => {
    const newStatus = estimate.status === "draft" ? "finished" : "draft";
    await api.put(`/api/estimates/${id}/status`, { status: newStatus });
    load();
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    const maxOrder = Math.max(0, ...estimate.groups.map((g) => g.sort_order));
    await api.post(`/api/estimates/${id}/groups`, { group_name: newGroupName, sort_order: maxOrder + 1 });
    setNewGroupName("");
    setShowAddGroup(false);
    load();
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm("Obrisati grupu i sve stavke u njoj?")) return;
    await api.delete(`/api/estimate-groups/${groupId}`);
    load();
  };

  const handleAddManualItem = async (groupId: number) => {
    const maxOrder = estimate.groups
      .find((g) => g.id === groupId)
      ?.items.reduce((max, i) => Math.max(max, i.sort_order), 0) ?? 0;
    await api.post(`/api/estimate-groups/${groupId}/items`, {
      name: "Nova stavka",
      description: "",
      unit: "kom",
      quantity: 0,
      unit_price: 0,
      sort_order: maxOrder + 1,
    });
    load();
  };

  const handleAddFromLibrary = async (groupId: number, libItem: LibraryItem) => {
    const group = estimate.groups.find((g) => g.id === groupId);
    const maxOrder = group?.items.reduce((max, i) => Math.max(max, i.sort_order), 0) ?? 0;
    await api.post(`/api/estimate-groups/${groupId}/items`, {
      library_item_id: libItem.id,
      name: libItem.name,
      description: libItem.description,
      unit: libItem.unit,
      quantity: 0,
      unit_price: libItem.unit_price,
      sort_order: maxOrder + 1,
    });
    load();
  };

  const handleUpdateItem = async (itemId: number, field: string, value: string | number) => {
    await api.put(`/api/estimate-items/${itemId}`, { [field]: value });
    load();
  };

  const handleDeleteItem = async (itemId: number) => {
    await api.delete(`/api/estimate-items/${itemId}`);
    load();
  };

  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = estimate.groups.findIndex((g) => `group-${g.id}` === active.id);
    const newIndex = estimate.groups.findIndex((g) => `group-${g.id}` === over.id);
    const reordered = arrayMove(estimate.groups, oldIndex, newIndex);

    setEstimate({ ...estimate, groups: reordered });

    for (let i = 0; i < reordered.length; i++) {
      await api.put(`/api/estimate-groups/${reordered[i].id}`, { sort_order: i });
    }
  };

  const openLibraryDialog = (groupId: number) => {
    setShowLibrary({ groupId });
    loadLibrary();
    setLibGroupFilter("all");
    setLibSearch("");
  };

  const filteredLibItems = libraryItems.filter((item) => {
    const matchGroup = libGroupFilter === "all" || item.group_id === parseInt(libGroupFilter);
    const matchSearch = item.name.toLowerCase().includes(libSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(libSearch.toLowerCase());
    return matchGroup && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          {isDraft ? (
            <Input
              className="text-xl font-bold border-none bg-transparent px-0 focus-visible:ring-0"
              defaultValue={estimate.name}
              onBlur={(e) => handleMetaUpdate("name", e.target.value)}
            />
          ) : (
            <h1 className="text-xl font-bold">{estimate.name}</h1>
          )}
        </div>
        <Badge
          variant={isDraft ? "secondary" : "default"}
          className="cursor-pointer"
          onClick={handleStatusToggle}
        >
          {isDraft ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
          {isDraft ? "Nacrt" : "Završen"}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => window.open(`/api/estimates/${id}/export/pdf`, "_blank")}>
          <FileDown className="w-4 h-4 mr-1" /> PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.open(`/api/estimates/${id}/export/excel`, "_blank")}>
          <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
        </Button>
      </div>

      {/* Meta fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Investitor</Label>
          {isDraft ? (
            <Input
              defaultValue={estimate.client_name}
              onBlur={(e) => handleMetaUpdate("client_name", e.target.value)}
              placeholder="Naziv investitora"
            />
          ) : (
            <p className="text-sm">{estimate.client_name || "—"}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Lokacija</Label>
          {isDraft ? (
            <Input
              defaultValue={estimate.location}
              onBlur={(e) => handleMetaUpdate("location", e.target.value)}
              placeholder="Lokacija projekta"
            />
          ) : (
            <p className="text-sm">{estimate.location || "—"}</p>
          )}
        </div>
      </div>

      {/* Groups */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
        <SortableContext
          items={estimate.groups.map((g) => `group-${g.id}`)}
          strategy={verticalListSortingStrategy}
          disabled={!isDraft}
        >
          <div className="space-y-4">
            {estimate.groups.map((group) => (
              <SortableGroupRow
                key={group.id}
                group={group}
                isDraft={isDraft}
                isOpen={openGroups.has(group.id)}
                onToggle={() => {
                  const next = new Set(openGroups);
                  if (next.has(group.id)) next.delete(group.id);
                  else next.add(group.id);
                  setOpenGroups(next);
                }}
              >
                <div className="border border-t-0 border-border rounded-b-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">Naziv</TableHead>
                        <TableHead className="w-[25%]">Opis</TableHead>
                        <TableHead className="w-[8%]">Jed.</TableHead>
                        <TableHead className="w-[12%] text-right">Količina</TableHead>
                        <TableHead className="w-[12%] text-right">Jed. cijena</TableHead>
                        <TableHead className="w-[12%] text-right">Ukupno</TableHead>
                        {isDraft && <TableHead className="w-[5%]" />}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {isDraft ? (
                              <Input
                                className="h-8 text-sm"
                                defaultValue={item.name}
                                onBlur={(e) => handleUpdateItem(item.id, "name", e.target.value)}
                              />
                            ) : (
                              item.name
                            )}
                          </TableCell>
                          <TableCell>
                            {isDraft ? (
                              <Input
                                className="h-8 text-sm"
                                defaultValue={item.description}
                                onBlur={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                              />
                            ) : (
                              <span className="text-muted-foreground text-sm">{item.description}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isDraft ? (
                              <Input
                                className="h-8 text-sm w-16"
                                defaultValue={item.unit}
                                onBlur={(e) => handleUpdateItem(item.id, "unit", e.target.value)}
                              />
                            ) : (
                              item.unit
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isDraft ? (
                              <Input
                                className="h-8 text-sm text-right w-24"
                                type="number"
                                step="0.01"
                                defaultValue={item.quantity}
                                onBlur={(e) => handleUpdateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              item.quantity.toFixed(2)
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isDraft ? (
                              <Input
                                className="h-8 text-sm text-right w-24"
                                type="number"
                                step="0.01"
                                defaultValue={item.unit_price}
                                onBlur={(e) => handleUpdateItem(item.id, "unit_price", parseFloat(e.target.value) || 0)}
                              />
                            ) : (
                              item.unit_price.toFixed(2)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(item.quantity * item.unit_price).toFixed(2)}
                          </TableCell>
                          {isDraft && (
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {group.items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={isDraft ? 7 : 6} className="text-center text-muted-foreground py-4">
                            Nema stavki u ovoj grupi
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {isDraft && (
                    <div className="flex items-center gap-2 p-2 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={() => handleAddManualItem(group.id)}>
                        <Plus className="w-3 h-3 mr-1" /> Ručno dodaj
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openLibraryDialog(group.id)}>
                        <Library className="w-3 h-3 mr-1" /> Iz biblioteke
                      </Button>
                      <div className="flex-1" />
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteGroup(group.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Obriši grupu
                      </Button>
                    </div>
                  )}
                </div>
              </SortableGroupRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add group */}
      {isDraft && (
        <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" /> Dodaj grupu radova
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova grupa radova</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Naziv grupe</Label>
                <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="npr. Zidarski radovi" autoFocus />
              </div>
              <Button onClick={handleAddGroup} className="w-full">Dodaj</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Recapitulation */}
      {estimate.groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rekapitulacija</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupa radova</TableHead>
                  <TableHead className="text-right">Iznos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimate.groups.map((group) => {
                  const subtotal = group.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
                  return (
                    <TableRow key={group.id}>
                      <TableCell>{group.group_name}</TableCell>
                      <TableCell className="text-right">{subtotal.toFixed(2)} KM</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="font-bold text-lg">
                  <TableCell>UKUPNO</TableCell>
                  <TableCell className="text-right text-primary">{grandTotal.toFixed(2)} KM</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Library dialog */}
      <Dialog open={!!showLibrary} onOpenChange={(open) => !open && setShowLibrary(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Dodaj stavku iz biblioteke</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Pretraži stavke..."
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                className="flex-1"
              />
              <Select value={libGroupFilter} onValueChange={setLibGroupFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sve grupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Sve grupe</SelectItem>
                  {libraryGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              {filteredLibItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary cursor-pointer"
                  onClick={() => {
                    if (showLibrary) {
                      handleAddFromLibrary(showLibrary.groupId, item);
                      setShowLibrary(null);
                    }
                  }}
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{item.unit_price.toFixed(2)} KM/{item.unit}</div>
                  </div>
                </div>
              ))}
              {filteredLibItems.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nema stavki</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify estimate editor works**

Start dev server, login, create an estimate, verify:
- Can edit name, client, location
- Can add groups
- Can add items from library and manually
- Can edit quantities and prices
- Can drag-and-drop to reorder groups
- Subtotals and grand total calculate correctly
- Can change status to finished (locks editing)
- Export buttons work

- [ ] **Step 3: Commit**

```
feat: estimate editor page with groups, items, drag-and-drop, and inline editing
```

---

### Task 12: Frontend — Library Page

**Files:**
- Create: `src/pages/library.tsx`

- [ ] **Step 1: Create library page**

Create `src/pages/library.tsx`:

```tsx
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/utils";
import { Plus, Pencil, Trash2, Lock, FolderOpen } from "lucide-react";

type ItemGroup = {
  id: number;
  name: string;
  created_by: number | null;
  created_by_name: string | null;
};

type LibraryItem = {
  id: number;
  group_id: number;
  name: string;
  description: string;
  unit: string;
  unit_price: number;
  created_by: number | null;
  created_by_name: string | null;
};

export function Library() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<ItemGroup[]>([]);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ItemGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [itemForm, setItemForm] = useState({ name: "", description: "", unit: "", unit_price: 0 });

  const loadGroups = async () => {
    const data = await api.get<ItemGroup[]>("/api/item-groups");
    setGroups(data);
    if (!selectedGroup && data.length > 0) setSelectedGroup(data[0].id);
  };

  const loadItems = async (groupId: number) => {
    const data = await api.get<LibraryItem[]>(`/api/library-items?group_id=${groupId}`);
    setItems(data);
  };

  useEffect(() => { loadGroups(); }, []);
  useEffect(() => { if (selectedGroup) loadItems(selectedGroup); }, [selectedGroup]);

  const canEditGroup = (group: ItemGroup) => group.created_by === user?.id;
  const canEditItem = (item: LibraryItem) => item.created_by === user?.id;

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return;
    if (editingGroup) {
      await api.put(`/api/item-groups/${editingGroup.id}`, { name: groupName });
    } else {
      await api.post("/api/item-groups", { name: groupName });
    }
    setShowGroupDialog(false);
    setEditingGroup(null);
    setGroupName("");
    loadGroups();
  };

  const handleDeleteGroup = async (id: number) => {
    if (!confirm("Obrisati grupu i sve stavke u njoj?")) return;
    await api.delete(`/api/item-groups/${id}`);
    if (selectedGroup === id) setSelectedGroup(null);
    loadGroups();
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.unit.trim()) return;
    if (editingItem) {
      await api.put(`/api/library-items/${editingItem.id}`, itemForm);
    } else {
      await api.post("/api/library-items", { ...itemForm, group_id: selectedGroup });
    }
    setShowItemDialog(false);
    setEditingItem(null);
    setItemForm({ name: "", description: "", unit: "", unit_price: 0 });
    if (selectedGroup) loadItems(selectedGroup);
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Obrisati stavku?")) return;
    await api.delete(`/api/library-items/${id}`);
    if (selectedGroup) loadItems(selectedGroup);
  };

  const openEditGroup = (group: ItemGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setShowGroupDialog(true);
  };

  const openNewGroup = () => {
    setEditingGroup(null);
    setGroupName("");
    setShowGroupDialog(true);
  };

  const openEditItem = (item: LibraryItem) => {
    setEditingItem(item);
    setItemForm({ name: item.name, description: item.description, unit: item.unit, unit_price: item.unit_price });
    setShowItemDialog(true);
  };

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm({ name: "", description: "", unit: "", unit_price: 0 });
    setShowItemDialog(true);
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar — groups */}
      <div className="w-72 border-r border-border p-4 space-y-2 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Grupe stavki</h2>
          <Button variant="ghost" size="icon" onClick={openNewGroup}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {groups.map((group) => (
          <div
            key={group.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-secondary group",
              selectedGroup === group.id && "bg-secondary"
            )}
            onClick={() => setSelectedGroup(group.id)}
          >
            {group.created_by === null ? (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <FolderOpen className="w-3 h-3 text-primary flex-shrink-0" />
            )}
            <span className="flex-1 text-sm truncate">{group.name}</span>
            {canEditGroup(group) && (
              <div className="hidden group-hover:flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEditGroup(group); }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right panel — items */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedGroup ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {groups.find((g) => g.id === selectedGroup)?.name}
              </h2>
              <Button onClick={openNewItem}>
                <Plus className="w-4 h-4 mr-2" /> Nova stavka
              </Button>
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead>Jed. mjere</TableHead>
                    <TableHead className="text-right">Jed. cijena</TableHead>
                    <TableHead>Dodao</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{item.description}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right">{item.unit_price.toFixed(2)}</TableCell>
                      <TableCell>
                        {item.created_by === null ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Sistem
                          </span>
                        ) : (
                          <span className="text-xs">{item.created_by_name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canEditItem(item) && (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditItem(item)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nema stavki u ovoj grupi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Odaberi grupu sa lijeve strane
          </div>
        )}
      </div>

      {/* Group dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Uredi grupu" : "Nova grupa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naziv grupe</Label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus />
            </div>
            <Button onClick={handleSaveGroup} className="w-full">Sačuvaj</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Uredi stavku" : "Nova stavka"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naziv</Label>
              <Input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Opis</Label>
              <Textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jedinica mjere</Label>
                <Input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} placeholder="m², kg, kom..." />
              </div>
              <div className="space-y-2">
                <Label>Jedinična cijena</Label>
                <Input type="number" step="0.01" value={itemForm.unit_price} onChange={(e) => setItemForm({ ...itemForm, unit_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <Button onClick={handleSaveItem} className="w-full">Sačuvaj</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify library page works**

Test CRUD operations, verify system items cannot be edited/deleted.

- [ ] **Step 3: Commit**

```
feat: library management page with groups and items CRUD
```

---

### Task 13: Frontend — Admin Pages

**Files:**
- Create: `src/pages/admin-companies.tsx`
- Create: `src/pages/admin-users.tsx`

- [ ] **Step 1: Create admin companies page**

Create `src/pages/admin-companies.tsx`:

```tsx
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle } from "lucide-react";

type Company = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  subscription_expires_at: string | null;
  created_at: string;
};

export function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "", email: "", subscription_expires_at: "" });

  const load = async () => {
    const data = await api.get<Company[]>("/api/admin/companies");
    setCompanies(data);
  };

  useEffect(() => { load(); }, []);

  const isExpired = (date: string | null) => {
    if (!date) return true;
    return new Date(date) < new Date();
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", address: "", phone: "", email: "", subscription_expires_at: "" });
    setShowDialog(true);
  };

  const openEdit = (company: Company) => {
    setEditing(company);
    setForm({
      name: company.name,
      address: company.address,
      phone: company.phone,
      email: company.email,
      subscription_expires_at: company.subscription_expires_at?.split("T")[0] || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      subscription_expires_at: form.subscription_expires_at
        ? new Date(form.subscription_expires_at).toISOString()
        : null,
    };
    if (editing) {
      await api.put(`/api/admin/companies/${editing.id}`, payload);
    } else {
      await api.post("/api/admin/companies", payload);
    }
    setShowDialog(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni? Ovo će obrisati kompaniju i sve njene podatke.")) return;
    await api.delete(`/api/admin/companies/${id}`);
    load();
  };

  const handleLogoUpload = async (companyId: number, file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    await api.upload(`/api/admin/companies/${companyId}/logo`, formData);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kompanije</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Nova kompanija
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naziv</TableHead>
              <TableHead>Adresa</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Pretplata</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {company.logo_url && (
                      <img src={company.logo_url} alt="" className="w-6 h-6 rounded object-cover" />
                    )}
                    {company.name}
                  </div>
                </TableCell>
                <TableCell>{company.address}</TableCell>
                <TableCell>{company.phone}</TableCell>
                <TableCell>{company.email}</TableCell>
                <TableCell>
                  {company.subscription_expires_at ? (
                    isExpired(company.subscription_expires_at) ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" /> Istekla
                      </Badge>
                    ) : (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle className="w-3 h-3" />
                        {new Date(company.subscription_expires_at).toLocaleDateString("bs-BA")}
                      </Badge>
                    )
                  ) : (
                    <Badge variant="secondary">Nije postavljena</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(company)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nema kompanija
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi kompaniju" : "Nova kompanija"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Naziv</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Adresa</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pretplata ističe</Label>
              <Input
                type="date"
                value={form.subscription_expires_at}
                onChange={(e) => setForm({ ...form, subscription_expires_at: e.target.value })}
              />
            </div>
            {editing && (
              <div className="space-y-2">
                <Label>Logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && editing) handleLogoUpload(editing.id, file);
                  }}
                />
              </div>
            )}
            <Button onClick={handleSave} className="w-full">Sačuvaj</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Create admin users page**

Create `src/pages/admin-users.tsx`:

```tsx
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "../components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

type User = {
  id: number;
  username: string;
  display_name: string;
  role: string;
  company_id: number | null;
  company_name: string | null;
  created_at: string;
};

type Company = {
  id: number;
  name: string;
};

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    display_name: "",
    role: "user",
    company_id: "",
  });

  const load = async () => {
    const [usersData, companiesData] = await Promise.all([
      api.get<User[]>("/api/admin/users"),
      api.get<Company[]>("/api/admin/companies"),
    ]);
    setUsers(usersData);
    setCompanies(companiesData);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ username: "", password: "", display_name: "", role: "user", company_id: "" });
    setShowDialog(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setForm({
      username: user.username,
      password: "",
      display_name: user.display_name,
      role: user.role,
      company_id: user.company_id?.toString() || "",
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.display_name.trim()) return;
    const payload: any = {
      display_name: form.display_name,
      role: form.role,
      company_id: form.company_id ? parseInt(form.company_id) : null,
    };

    if (editing) {
      if (form.password) payload.password = form.password;
      await api.put(`/api/admin/users/${editing.id}`, payload);
    } else {
      if (!form.username.trim() || !form.password.trim()) return;
      payload.username = form.username;
      payload.password = form.password;
      await api.post("/api/admin/users", payload);
    }
    setShowDialog(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Da li ste sigurni da želite obrisati ovog korisnika?")) return;
    await api.delete(`/api/admin/users/${id}`);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Korisnici</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" /> Novi korisnik
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Korisničko ime</TableHead>
              <TableHead>Ime</TableHead>
              <TableHead>Uloga</TableHead>
              <TableHead>Kompanija</TableHead>
              <TableHead>Datum kreiranja</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>{user.display_name}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "super_admin" ? "default" : "secondary"}>
                    {user.role === "super_admin" ? "Admin" : "Korisnik"}
                  </Badge>
                </TableCell>
                <TableCell>{user.company_name || "—"}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString("bs-BA")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nema korisnika
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Uredi korisnika" : "Novi korisnik"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Korisničko ime</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={!!editing}
                autoFocus={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>{editing ? "Nova lozinka (ostavi prazno za bez promjene)" : "Lozinka"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ime i prezime</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Uloga</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Korisnik</SelectItem>
                    <SelectItem value="super_admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kompanija</Label>
                <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Odaberi..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Bez kompanije</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full">Sačuvaj</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 3: Verify admin pages work**

Login as admin, test all CRUD operations for companies and users.

- [ ] **Step 4: Commit**

```
feat: admin pages for companies and users management
```

---

### Task 14: Polish UI — Industrial Theme & Final Touches

**Files:**
- Modify: Various component files for styling refinement

- [ ] **Step 1: Apply industrial construction theme refinements**

Use the @superpowers:frontend-design skill for this task. Refine:
- Color palette: ensure orange accents stand out against dark zinc backgrounds
- Typography: ensure headings are bold and clear
- Table styling: striped rows, clear borders
- Button styles: primary buttons with orange, destructive with red
- Card shadows and borders
- Badge styling for statuses
- Icon consistency (lucide construction-related icons where appropriate)
- Responsive sidebar (collapse to icons on smaller screens)

- [ ] **Step 2: Add Toaster for notifications**

Add `sonner` Toaster component to App.tsx for success/error notifications on CRUD operations.

- [ ] **Step 3: Final testing**

Run through complete workflow:
1. Login as admin
2. Create company with subscription
3. Create user
4. Login as user
5. Browse library, add custom items
6. Create estimate, add groups and items
7. Edit quantities and prices
8. Export PDF and Excel
9. Finish estimate (locks editing)
10. Duplicate estimate
11. Test subscription expiry screen

- [ ] **Step 4: Commit**

```
feat: polish industrial construction theme and final touches
```

---

### Task 15: Production Build & Cleanup

**Files:**
- Modify: `build.ts` (if needed)
- Modify: `package.json` (if needed)

- [ ] **Step 1: Test production build**

Run:
```bash
cd predmjer-i-predracun && bun run build
```
Verify dist/ output is generated correctly.

- [ ] **Step 2: Test production server**

Run:
```bash
cd predmjer-i-predracun && bun run start
```
Verify app works in production mode.

- [ ] **Step 3: Run all tests**

Run:
```bash
cd predmjer-i-predracun && bun test
```
Expected: All tests PASS

- [ ] **Step 4: Commit**

```
chore: production build verification and cleanup
```
