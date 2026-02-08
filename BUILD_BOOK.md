# BOM Generator Codex - Application Build Book

## 1. Project Overview
The **BOM Generator** is a web-based application designed to manage complex Bill of Materials (BOM) templates, configure product families, and execute dynamic formula-based calculations. It mimics advanced Excel-like functionality (XLOOKUP, WBS nesting, custom formulas) within a structured, multi-user web environment.

## 2. Technology Stack

### Frontend
- **Framework**: React 18 (via Vite)
- **Language**: TypeScript
- **UI Component Library**: Material UI (MUI) v5
- **State Management & Fetching**: TanStack Query (React Query) v5
- **Routing**: React Router DOM v6
- **Data Grid**: MUI X Data Grid
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.10+
- **ORM**: SQLAlchemy 2.0+
- **Database Migrations**: Alembic
- **Data Validation**: Pydantic v2
- **Server**: Uvicorn
- **Excel Processing**: openpyxl (for imports)

## 3. Architecture & Data Model

The application is structured around the concept of a "Build Family" (a product line).

### Key Entities
1.  **Build Family**: The container for all configuration logic, variables, and BOM templates.
2.  **Model Codes**: Represents specific SKU variants. Links `Config Values` to `Config Fields`.
3.  **Config Fields**: Defines the input parameters (e.g., "Voltage", "Length", "Color") required for a product.
4.  **Variables**: Typed formulas (Number, Text, Boolean) reusable across the Build Family.
5.  **Lookup Tables**:
    *   Global or Family-scoped.
    *   Dynamic schema: Columns are user-defined (Text, Number, Boolean, Bundle Marker).
    *   Rows support a `list_size` parameter for scaling logic.
6.  **BOM Template Rows**:
    *   Hierarchical structure (Parent/Child relationships).
      - **WBS Auto-generation**: Row IDs (e.g., `1.2.1`) are calculated automatically based on nesting level.
    -   Contains multiple formula fields (`f_qty`, `f_unit_cost`, etc.) for dynamic evaluation.
7.  **Seed Data**:
    -   **Marketing Categories**: Supply, Return, Curved Blade, Non-vision, Filter grille, Bar Linear, Slot Linear, Louvers, Industrial, Eggcrate, Accessories.
    -   **Manufacturing Departments**: Supply & Return, Filter grille, Barlinear, Slot linear, Louver, Industrial.

## 4. Key Functionality & Assumptions

### BOM Template Management
- **Hierarchy**: The BOM supports indefinite nesting. The UI handles indentation (move right/left) and reordering (move up/down).
- **WBS & Sorting**: The `display_order` is maintained by the backend, but the `Row ID` is a visual WBS representation calculated on the frontend and persisted to the backend.
- **Formulas**: Integrated Formula Editor supports syntax highlighting and variable suggestions.
- **Static vs Dynamic**: `uom_code` is a static string field; key metrics (`Qty`, `Cost`, `Price`) are formula-driven.

### Lookup Tables
- **Dynamic Columns**: Users can add/remove columns on the fly.
- **Import**: Supports Excel (`.xlsx`) and CSV import for bulk data loading.
- **View**: Pagination is disabled for data rows to allow bulk viewing/scrolling.

### Assumptions
- **Single Tenant**: Currently designed for a single organization deployment.
- **Database**: Uses SQLAlchemy, compatible with SQLite (default dev), PostgreSQL, or SQL Server (`pyodbc` driver included).
- **Formulas**: Validated via a custom parser. Implementation mostly handles validation/parsing in Phase 1, with distinct "Generation" logic reserved for Phase 2.

## 5. Reconstruction Guide (How to Run)

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Git

### Backend Setup
1.  Navigate to the backend directory:
    ```powershell
    cd backend
    ```
2.  Create a virtual environment:
    ```powershell
    python -m venv .venv
    ```
3.  Activate the environment:
    ```powershell
    .\.venv\Scripts\Activate
    ```
4.  Install dependencies:
    ```powershell
    pip install -r requirements.txt
    ```
5.  Run Database Migrations:
    ```powershell
    alembic upgrade head
    ```
6.  Start the Server:
    ```powershell
    uvicorn app.main:app --reload --port 8000
    ```

### Frontend Setup
1.  Navigate to the frontend directory:
    ```powershell
    cd frontend
    ```
2.  Install dependencies:
    ```powershell
    npm install
    ```
3.  Start the Development Server:
    ```powershell
    npm run dev
    ```
4.  Access the app at `http://localhost:5173`.

## 6. Directory Structure Overview

```text
/
├── backend/
│   ├── alembic/            # Database migration scripts
│   ├── app/
│   │   ├── api/            # API Routes (Endpoints)
│   │   ├── models/         # SQLAlchemy Database Models
│   │   ├── schemas/        # Pydantic Schemas (Request/Response)
│   │   ├── services/       # Business Logic
│   │   └── main.py         # App Entry Point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client & React Query hooks
│   │   ├── components/     # Shared UI (FormulaEditor, etc.)
│   │   ├── layouts/        # MainLayout (Sidebar/Header)
│   │   ├── pages/          # Application Pages
│   │   │   ├── build-family/ # Tabs for BOM, Variables, Configs
│   │   │   └── ...
│   │   └── App.tsx         # Routing Logic
│   └── package.json
└── BUILD_BOOK.md           # This file
```

## 7. Configuration Details
- **Environment Variables**:
    - Backend: `.env` (DB Connection string, Secret keys).
    - Frontend: `.env` (`VITE_API_BASE_URL`).

## 8. Detailed Functional Requirements

### 8.1 Build Family Management
- **Create/Read/Update/Delete**: Manage product families (e.g., "Power Cords", "Wiring Harnesses").
- **Context Isolation**: All downstream data (Templates, Config Fields, Variables) is scoped to a specific Build Family.

### 8.2 Configuration Fields (Product Specs)
- **Field Types**: Support for `Text`, `Integer`, `Decimal`, `Boolean`, and `Enum` (Dropdown).
- **Ordering**: Fields must be reorderable via `display_order`.
- **Validation**: Fields can be marked as `Required` or `Optional`.
- **Input Association**:
    - **Model Codes**: Specific SKUs (e.g., `MC-101`) instantiate these fields.
    - **Validations**: Model Code inputs are validated against the field definition (e.g., Type safety, Enum constraints).

### 8.3 Variables (Global Formulas)
- **Purpose**: Store reusable calculations (e.g., `CopperWeight = Length * GaugeFactor`).
- **Types**: `Number`, `Text`, `Boolean`.
- **Editor**: Custom Formula Editor with syntax highlighting (blue for variables, purple for functions).
- **Syntax**: Variables are referenced as `VAR.<Name>` (though the UI may simplify this to `@Name` for display).

### 8.4 Lookup Tables (Data Sources)
- **Scope**:
    - `Global`: Available to all Build Families.
    - `Build Family`: Private to a specific family.
- **Structure**:
    - **Columns**: Dynamic user-defined columns (Name, Type). Types include `Number`, `Text`, `Boolean`, and `Bundle Marker`.
    - **Rows**: Keyed by `list_size` (Number) for scaling operations. Stores unstructured JSON data in `row_values_json`.
- **Import/Export**:
    - **Excel Import**: Drag-and-drop `.xlsx` or `.csv` files to populate table rows.
    - **Validation**: Columns in Excel must match defined Table Columns by name.

### 8.5 BOM Template Rows (The Core)
- **Hierarchy**:
    - **Recursive Nesting**: Indefinite parent/child depth.
    - **WBS Generation**: automatically generates WBS IDs (e.g., `1`, `1.1`, `1.1.1`) based on `nest_level` and list position.
- **Operations**:
    - **Indentation**: `Indent` (increase nest level) / `Outdent` (decrease nest level).
    - **Reordering**: `Move Up` / `Move Down` swaps display order.
    - **CRUD**: Add new rows with temporary IDs; backend persists permanent IDs.
- **Formula Fields**:
    - Key columns (`Qty`, `Unit Cost`, `Extended Price`, etc.) accept formulas starting with `=`.
    - Formulas can reference `Variables`, `Config Fields`, and `Lookup Tables`.
    - `uom_code` is explicitly **static** and does not support formulas.

### 8.6 Formula Syntax & Features
- **Operators**: `+`, `-`, `*`, `/`, `^`.
- **Comparisons**: `=`, `<>`, `<`, `>`, `<=`, `>=`.
- **Logical**: `AND`, `OR`, `NOT`.
- **Functions**:
    - `IF(condition, true_val, false_val)`
    - `XLOOKUP(value, table_name, return_field, match_mode)`
        - **Match Modes**: `EXACT`, `NEAREST`
        - **Returns**: Scalar values, Multi-field objects, or Component Bundles.
- **References**:
    - Config Fields: `CFG.<FieldName>`
    - Variables: `VAR.<Name>`
    - Prior Rows: `ROW(<RowID>).<FieldName>`

### 8.7 Testing Context (Formula Tester)
The "Test" functionality in the Formula Workbench provides the following inputs for validation:
- `ModelCode` (String)
- `LS_L` (List Size Length, inches)
- `LS_H` (List Size Height, inches)
- `Finish` (Text/Code)
- `Order_Qty` (Integer)

## 9. Database Schema Reference

The database uses a relational model with JSON extensions for dynamic data.

### `build_families`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | Unique Name |
| `description` | String | Optional description |

### `model_codes`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `build_family_id` | UUID | FK -> `build_families.id` |
| `model_code` | String | The SKU string |
| `marketing_category_id` | UUID | FK (Optional) |
| `manufacturing_department_id` | UUID | FK (Optional) |

### `model_code_config_fields`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `build_family_id` | UUID | FK' -> `build_families.id` |
| `field_name` | String | Display name |
| `field_type` | Enum | `boolean`, `int`, `decimal`, `text`, `enum` |
| `enum_values` | JSON | List of valid options if type is Enum |
| `is_required` | Boolean | |
| `display_order` | Integer | UI sorting |

### `model_code_config_values`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `model_code_id` | UUID | FK -> `model_codes.id` |
| `field_id` | UUID | FK -> `model_code_config_fields.id` |
| `value_json` | JSON | The actual value (typed in JSON) |

### `lookup_tables`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | Table Name |
| `scope` | Enum | `global` or `build_family` |
| `build_family_id` | UUID | FK (Nullable) |

### `lookup_table_columns`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `lookup_table_id` | UUID | FK -> `lookup_tables.id` |
| `column_name` | String | Header name |
| `column_type` | Enum | `text`, `number`, `boolean`, `component_bundle_marker` |
| `display_order` | Integer | |

### `lookup_table_rows`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `lookup_table_id` | UUID | FK -> `lookup_tables.id` |
| `list_size` | Decimal | The lookup key (sortable) |
| `row_values_json` | JSON | Dictionary of `{column_name: value}` |

### `bom_template_rows`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `build_family_id` | UUID | FK -> `build_families.id` |
| `row_id` | String | WBS ID (e.g. "1.2.1") |
| `nest_level` | Integer | Depth (0-n) |
| `display_order` | Integer | Sorting index |
| `component_no` | String | Part Number |
| `level_type` | String | e.g. "Assembly" |
| `f_qty_per_product` | Text | Formula string |
| `f_unit_cost` | Text | Formula string |
| ... | ... | Other formula columns exist |

### `variables`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `build_family_id` | UUID | FK -> `build_families.id` |
| `name` | String | Variable Name |
| `type` | Enum | `number`, `text`, `boolean` |
| `formula` | String | Calculation expression |
| `display_order` | Integer | |

---
*Generated by Antigravity Codex - 2025*
