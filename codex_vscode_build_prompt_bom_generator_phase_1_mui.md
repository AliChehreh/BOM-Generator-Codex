# Codex VSCode Build Prompt – BOM Generator Phase 1 (Foundation)

You are building an internal web app called **BOM Generator**. Implement **Phase 1 – Foundation** only.

## 0) High-level goal
Phase 1 builds the *definition/authoring foundation* needed for BOM generation later:
- Build Family management
- ModelCode (product) management + independent groupings
- ModelCode configuration schema + values (schema varies per Build Family)
- Lookup tables (XLOOKUP-like exact + nearest; multi-return; bundle return)
- Variables (typed + formulas)
- BOM Template Row authoring model (CRUD only; generation is Phase 2)
- Custom formula engine (parse/validate/evaluate) + endpoints for validate/test

**Do NOT implement actual BOM generation output yet.**

---

## 1) Tech stack (required)
### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy 2.x
- Alembic
- SQL Server via pyodbc
- Pydantic v2

### Frontend
- React + TypeScript
- Vite

### Component library (replace Ant Design)
Use **Material UI (MUI)** for the best UX match:
- MUI core components (forms, tabs, dialogs)
- **MUI X DataGrid** for Excel-like editable grids (critical for config values + lookup tables + template rows)

Rationale: This app is admin/data-entry heavy and needs robust tables, inline editing, validation, column management, and filtering. MUI + DataGrid is best suited for that.

Frontend supporting libs:
- React Router
- Axios
- @tanstack/react-query (recommended for API state)
- react-hook-form + zod (recommended for forms + validation)

---

## 2) Environment setup (Codex must create)
Create a monorepo structure:

```
BOM-Generator/
  backend/
  frontend/
  README.md
  .env.example
```

### Backend environment
- Use `python -m venv .venv`
- `requirements.txt` pinned versions
- Alembic initialized and working
- Run commands documented in README

### Frontend environment
- Vite React TS project
- Install MUI + MUI X DataGrid
- Add lint/format tooling (ESLint + Prettier)
- Provide `npm run dev` and build scripts

### Configuration
- Use `.env` for DB connection string and API base URL
- Provide `.env.example` for both backend and frontend

---

## 3) Core requirements (domain)

### 3.1 Independent groupings per product
Each ModelCode (product) can independently be assigned to:
1) Marketing Category (seed 10 values)
2) Manufacturing Department (seed current departments)
3) Build Family (defines how it is built)

These are **not coupled**.

### 3.2 Sales order line inputs (used in formula testing)
- `ModelCode`
- `LS_L` (List Size Length, inches, 3 decimals)
- `LS_H` (List Size Height, inches, 3 decimals)
- `Finish` (text/code)
- `Order_Qty` (int)

Phase 1 uses these inputs for formula test endpoint only.

---

## 4) Database schema (SQL Server) – Phase 1
Use GUID primary keys. Use timestamps. **Do not lock down JSON vs typed storage prematurely**; however, implement a pragmatic hybrid that keeps switching possible.

### 4.1 Tables
#### build_families
- id (PK)
- name (unique)
- description (nullable)
- created_at, updated_at

#### marketing_categories (seed)
- id (PK)
- name (unique)

Seed values:
Supply, Return, Curved Blade, Non-vision, Filter grille, Bar Linear, Slot Linear, Louvers, Industrial, Eggcrate, Accessories

#### manufacturing_departments (seed)
- id (PK)
- name (unique)

Seed values:
Supply & Return, Filter grille, Barlinear, Slot linear, Louver, Industrial

#### model_codes
- id (PK)
- build_family_id (FK)
- model_code (string) unique per build family
- marketing_category_id (FK, nullable)
- manufacturing_department_id (FK, nullable)
- created_at, updated_at

Constraint: UNIQUE(build_family_id, model_code)

#### model_code_config_fields (schema per build family)
User-defined fields; **all required**; no defaults; no constraints v1.
- id (PK)
- build_family_id (FK)
- field_name (string)
- field_type (enum: boolean, int, decimal, text, enum)
- enum_values (JSON nullable)
- is_required (bool default true)
- display_order (int)

Constraint: UNIQUE(build_family_id, field_name)

#### model_code_config_values
Stores values per ModelCode per field. Keep type fidelity.
- id (PK)
- model_code_id (FK)
- field_id (FK)
- value_json (nvarchar(max)) OR typed columns (either is acceptable, but keep repository abstraction)
- updated_at

Constraint: UNIQUE(model_code_id, field_id)

Validation rule: Missing required field blocks generation later; Phase 1 provides a validation endpoint.

#### lookup_tables
- id (PK)
- name
- scope (enum: global, build_family)
- build_family_id (FK nullable; required if scope=build_family)
- description
- created_at, updated_at

Constraint: UNIQUE(scope, build_family_id, name)

#### lookup_table_columns
- id (PK)
- lookup_table_id (FK)
- column_name
- column_type (enum: number, boolean, text, component_bundle_marker)
- display_order

Constraint: UNIQUE(lookup_table_id, column_name)

#### lookup_table_rows
- id (PK)
- lookup_table_id (FK)
- list_size decimal(18,3)
- row_values_json (nvarchar(max))
- updated_at

Constraint: UNIQUE(lookup_table_id, list_size)

Rules:
- list_size unique per table
- system returns rows sorted by list_size

#### variables
- id (PK)
- build_family_id (FK)
- name (unique per build family)
- type (enum: boolean, number, text)
- formula (text)
- display_order
- updated_at

Constraint: UNIQUE(build_family_id, name)

#### bom_template_rows (CRUD only in Phase 1)
Row-based template, evaluated top-to-bottom in Phase 2.
- id (PK)
- build_family_id (FK)
- row_id (string, unique per build family) **used for formula references**
- level_type (string/enum)
- component_no (string; repeatable; e.g. RM-0001)
- description
- uom_code (string) **static (NOT formula-driven)**
- nest_level (int) **parent relationship by nesting**
- display_order (int)

Formula fields (text):
- f_qty_per_product
- f_qty
- f_size_per_unit
- f_qty_per_assembly
- f_unit_cost (Raw Material + Task rows only)
- f_price_per_product
- f_extended_price

Constraint: UNIQUE(build_family_id, row_id)

---

## 5) Formula engine requirements (Phase 1)
Implement a custom parser/evaluator (AST).

### 5.1 Return types
- number / boolean / text

### 5.2 Allowed references (standardize names)
Order inputs:
- `LS_L`, `LS_H`, `Finish`, `Order_Qty`, `ModelCode`

ModelCode config fields:
- `CFG.<FieldName>`

Variables:
- `VAR.<Name>`

Prior rows (Phase 1 used in formula test only, but must exist):
- `ROW(<RowID>).<FieldName>`

### 5.3 Operators & functions
Operators:
- + - * / ^
Comparisons:
- = <> < > <= >=
Logical:
- AND OR NOT

Functions:
- IF(condition, true_val, false_val)
- AND(a,b,...) OR(a,b,...) NOT(x)
- **XLOOKUP(value, table_name, return_field_or_fields, match_mode)**
  - match_mode supports EXACT and NEAREST
  - return can be scalar OR multi-field object/array OR a component bundle list

### 5.4 Determinism & errors
- deterministic evaluation
- no circular dependencies
- missing required config value ⇒ validation failure
- errors must include: build_family_id, row_id (if applicable), field/variable name, formula text, character position, message

---

## 6) Backend API (Phase 1)
Implement REST endpoints:

### Build Families
- GET /api/v1/build-families
- POST /api/v1/build-families
- GET /api/v1/build-families/{id}
- PUT /api/v1/build-families/{id}
- DELETE /api/v1/build-families/{id}

### ModelCodes
- POST /api/v1/build-families/{id}/model-codes
- GET /api/v1/build-families/{id}/model-codes
- PUT /api/v1/model-codes/{id}
- DELETE /api/v1/model-codes/{id}

### Config schema fields
- POST /api/v1/build-families/{id}/config-fields
- GET /api/v1/build-families/{id}/config-fields
- PUT /api/v1/config-fields/{field_id}
- DELETE /api/v1/config-fields/{field_id}

### Config values (bulk)
- GET /api/v1/model-codes/{id}/config-values
- PUT /api/v1/model-codes/{id}/config-values
- GET /api/v1/model-codes/{id}/config-values/validate (returns missing required fields)

### Lookup tables
- GET /api/v1/lookup-tables?scope=&build_family_id=
- POST /api/v1/lookup-tables
- GET /api/v1/lookup-tables/{id}
- PUT /api/v1/lookup-tables/{id}
- DELETE /api/v1/lookup-tables/{id}

Columns:
- PUT /api/v1/lookup-tables/{id}/columns

Rows:
- GET /api/v1/lookup-tables/{id}/rows
- PUT /api/v1/lookup-tables/{id}/rows (bulk upsert)
- POST /api/v1/lookup-tables/{id}/import (Excel/CSV upload)

### Variables
- GET /api/v1/build-families/{id}/variables
- POST /api/v1/build-families/{id}/variables
- PUT /api/v1/variables/{id}
- DELETE /api/v1/variables/{id}

### BOM Template Rows (CRUD only)
- GET /api/v1/build-families/{id}/bom-template-rows
- POST /api/v1/build-families/{id}/bom-template-rows
- PUT /api/v1/bom-template-rows/{id}
- DELETE /api/v1/bom-template-rows/{id}

### Formula
- POST /api/v1/formula/validate
- POST /api/v1/formula/test (accepts a sample context: inputs + config + variables + optional prior row results)

---

## 7) Frontend UX (Phase 1)
Use MUI (AppBar, Drawer, Tabs, Dialogs, Forms).

### Routes
- /build-families
- /build-families/:id (tabs)
  - ModelCodes
  - Config Fields
  - Config Values (bulk)
  - Variables
  - BOM Template Rows
- /lookup-tables
- /lookup-tables/:id

### Data entry screens (must)
1) Build Family list + create/edit
2) ModelCodes table with editable category/department assignment
3) Config Fields editor (type selection + enum values)
4) Config Values bulk editor: use **MUI DataGrid** with editable cells
5) Lookup Table editor:
   - define columns
   - editable rows (DataGrid)
   - uniqueness validation on list_size
   - auto-sort by list_size
   - import file upload
6) Variables editor:
   - formula editor text area
   - Validate button
   - Test panel (calls formula/test)
7) BOM Template Rows editor:
   - DataGrid for rows
   - nest_level editing (indent/outdent buttons or numeric)
   - static uom_code field
   - formula fields as editable text

---

## 8) Testing (Phase 1)
Backend:
- unit tests for lexer/parser/evaluator
- XLOOKUP exact + nearest tests
- CRUD tests for config/lookup/variables

Frontend:
- smoke tests for key pages

---

## 9) Phase 1 exit criteria
Phase 1 is complete when a user can:
1) Create a Build Family
2) Add ModelCodes and assign marketing category + manufacturing department
3) Define config fields and fill config values for a ModelCode
4) Create lookup tables, define columns, import/edit rows (list_size unique + sorted)
5) Define variables and validate/test formulas
6) Define BOM template rows with unique RowID + component_no + static UOM + formula fields

Note: Actual hierarchical BOM generation and rollups are Phase 2.

