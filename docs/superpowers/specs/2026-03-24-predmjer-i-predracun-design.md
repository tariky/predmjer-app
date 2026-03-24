# Predmjer i Predračun - Design Spec

## Overview

Web application for creating construction cost estimates (predmjeri i predračuni) for construction companies. Built as a Bun fullstack monolith with React frontend, shadcn/ui components, and SQLite database.

## Users and Roles

- **Super admin**: single operator who manages companies and user accounts via admin panel
- **User**: belongs to a company, creates and manages estimates, sees all estimates within their company

## Architecture

Single Bun process serving both API and frontend.

- **`server/`** - Bun.serve() backend with REST API routes
- **`server/db/`** - SQLite database (bun:sqlite), migrations, seed data
- **`server/auth/`** - Session-based authentication, bcrypt password hashing, HTTP-only cookies
- **`src/`** - React frontend with shadcn/ui components
- **`index.html`** - Entry point via Bun HTML imports

## Data Model

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| username | TEXT UNIQUE | login identifier |
| password_hash | TEXT | bcrypt hashed |
| display_name | TEXT | shown in UI |
| role | TEXT | "super_admin" or "user" |
| company_id | INTEGER FK nullable | null for super_admin |
| created_at | TEXT | ISO 8601 |

### companies
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| name | TEXT | company name |
| address | TEXT | |
| phone | TEXT | |
| email | TEXT | |
| logo_url | TEXT nullable | path to uploaded logo |
| created_at | TEXT | ISO 8601 |

### item_groups
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| name | TEXT | e.g. "Zidarski radovi" |
| created_by | INTEGER FK nullable | null = system group |
| created_at | TEXT | ISO 8601 |

### library_items
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| group_id | INTEGER FK | references item_groups |
| name | TEXT | item name |
| description | TEXT | detailed description |
| unit | TEXT | m², m³, kom, kg, m¹, etc. |
| unit_price | REAL | default unit price |
| created_by | INTEGER FK nullable | null = system item |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

### estimates
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| company_id | INTEGER FK | owning company |
| name | TEXT | estimate name |
| client_name | TEXT | client/investor name |
| location | TEXT | project location |
| status | TEXT | "draft" or "finished" |
| created_by | INTEGER FK | user who created it |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

### estimate_groups
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| estimate_id | INTEGER FK | references estimates |
| group_name | TEXT | name of work group |
| sort_order | INTEGER | display order |

### estimate_items
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| estimate_group_id | INTEGER FK | references estimate_groups |
| library_item_id | INTEGER FK nullable | null for manually entered items |
| name | TEXT | item name (copied or manual) |
| description | TEXT | item description |
| unit | TEXT | unit of measurement |
| quantity | REAL | amount |
| unit_price | REAL | price per unit |
| sort_order | INTEGER | display order within group |

## API Routes

### Auth
- `POST /api/auth/login` - login with username/password, returns session cookie
- `POST /api/auth/logout` - destroy session
- `GET /api/auth/me` - current user info + company data

### Admin (super_admin only)
- `GET /api/admin/companies` - list all companies
- `POST /api/admin/companies` - create company
- `PUT /api/admin/companies/:id` - update company
- `DELETE /api/admin/companies/:id` - delete company
- `GET /api/admin/users` - list all users
- `POST /api/admin/users` - create user (assign to company)
- `PUT /api/admin/users/:id` - update user
- `DELETE /api/admin/users/:id` - delete user

### Library
- `GET /api/item-groups` - all item groups
- `POST /api/item-groups` - create group (created_by = current user)
- `PUT /api/item-groups/:id` - update group (only if created_by = current user)
- `DELETE /api/item-groups/:id` - delete group (only if created_by = current user)
- `GET /api/library-items?group_id=` - items filtered by group
- `POST /api/library-items` - create item
- `PUT /api/library-items/:id` - update item (only own)
- `DELETE /api/library-items/:id` - delete item (only own)

### Estimates
- `GET /api/estimates` - all estimates for current user's company
- `POST /api/estimates` - create estimate
- `GET /api/estimates/:id` - full estimate with groups and items
- `PUT /api/estimates/:id` - update estimate (only if status = draft)
- `DELETE /api/estimates/:id` - delete estimate
- `POST /api/estimates/:id/duplicate` - duplicate estimate
- `PUT /api/estimates/:id/status` - change status (draft/finished)

### Export
- `GET /api/estimates/:id/export/pdf` - generate A4 PDF
- `GET /api/estimates/:id/export/excel` - generate Excel file

## Authorization Rules

- All API routes require authentication (except login)
- Admin routes require `role = super_admin`
- Estimate routes are scoped to `company_id` of current user
- Library item/group edit/delete restricted to `created_by = current user`
- System library items/groups (`created_by = null`) are read-only
- Finished estimates are read-only (must change status back to draft to edit)

## Frontend Pages

### UI Style
Industrial construction theme: dark tones (slate/zinc palette), orange accents (construction signage), shadcn/ui components, clean tabular layouts, construction-related iconography.

### Login
Simple login form with industrial branding.

### Dashboard
- Table of company estimates: name, client, location, status badge, date, created by
- Search/filter
- "New estimate" button
- Quick actions: duplicate, export, delete

### Estimate Editor
Main working screen:
- **Header**: estimate name, client, location (editable meta fields)
- **Groups**: collapsible sections for each work group
- **Items table** within each group: name, description, unit, quantity, unit price, total
- **Add items**: from library (modal/drawer with search) or manual entry
- **Drag & drop**: reorder groups and items
- **Recapitulation**: subtotals per group + grand total at bottom
- **Status**: badge with toggle action (draft/finished)
- **Export**: PDF and Excel buttons

### Library
- Browse item groups and items
- Filter by group
- Visual distinction: system items vs. user-created items
- CRUD for user-created items/groups only

### Admin Panel (super_admin only)
- Companies management: CRUD, logo upload
- Users management: CRUD, assign to company

## Export Formats

### PDF (A4)
- **Header**: company logo, name, address, contact
- **Title**: estimate name, client, location, date
- **Table per group**: R.br. | Naziv stavke | Opis | Jed. mjere | Količina | Jed. cijena | Ukupno
- **Subtotal** for each group
- **Recapitulation**: list of groups with subtotals + grand total
- **Footer**: page X of Y
- Generated server-side with jsPDF

### Excel
- Same structure as PDF
- Groups separated with bold headers
- Formulas for subtotals and grand total (not hardcoded values)
- Formatted for A4 printing
- Generated server-side with ExcelJS

## Tech Stack

- **Runtime**: Bun
- **Backend**: Bun.serve() REST API
- **Database**: bun:sqlite (SQLite)
- **Auth**: session-based, bcrypt, HTTP-only cookies
- **Frontend**: React, shadcn/ui, Tailwind CSS
- **Bundling**: Bun HTML imports
- **PDF**: jsPDF
- **Excel**: ExcelJS
