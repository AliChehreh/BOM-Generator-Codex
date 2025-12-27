# BOM Generator (Phase 1 Foundation)

This monorepo contains the Phase 1 foundation for BOM Generator.

## Structure

```
backend/   FastAPI + SQLAlchemy + Alembic
frontend/  React + Vite + MUI + DataGrid
```

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Update `DATABASE_URL` in `backend/.env` with your SQL Server connection string:

```
mssql+pyodbc://username:password@localhost:1433/bom_generator?driver=ODBC+Driver+17+for+SQL+Server
```

Run migrations:

```bash
alembic upgrade head
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Run tests:

```bash
pytest
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend expects the API at `VITE_API_BASE_URL` (default `http://localhost:8000/api/v1`).

Run frontend tests:

```bash
npm run test
```

## Phase 1 Notes

- CRUD for Build Families, ModelCodes, Config Fields/Values, Lookup Tables, Variables, and BOM Template Rows.
- Custom formula engine with validate/test endpoints.
- Actual BOM generation is not implemented until Phase 2.
