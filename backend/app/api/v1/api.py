from fastapi import APIRouter

from app.api.v1.endpoints import (
    bom_template_rows,
    build_families,
    config_fields,
    config_values,
    formula,
    lookup_tables,
    manufacturing_departments,
    marketing_categories,
    model_codes,
    variables,
)

api_router = APIRouter()

api_router.include_router(build_families.router, tags=["Build Families"], prefix="/build-families")
api_router.include_router(model_codes.router, tags=["Model Codes"])
api_router.include_router(config_fields.router, tags=["Config Fields"])
api_router.include_router(config_values.router, tags=["Config Values"])
api_router.include_router(lookup_tables.router, tags=["Lookup Tables"])
api_router.include_router(variables.router, tags=["Variables"])
api_router.include_router(bom_template_rows.router, tags=["BOM Template Rows"])
api_router.include_router(formula.router, tags=["Formula"])
api_router.include_router(marketing_categories.router, tags=["Marketing Categories"])
api_router.include_router(manufacturing_departments.router, tags=["Manufacturing Departments"])
