from fastapi import APIRouter

from app.schemas.formula import (
    FormulaErrorDetail,
    FormulaTestRequest,
    FormulaTestResponse,
    FormulaValidateRequest,
    FormulaValidateResponse,
)
from app.services.formula import evaluate_formula
from app.services.formula.errors import FormulaError
from app.services.formula.evaluator import EvaluationMeta
from app.services.formula.parser import Parser

router = APIRouter()


def _error_detail(error: FormulaError) -> FormulaErrorDetail:
    return FormulaErrorDetail(
        build_family_id=error.build_family_id,
        row_id=error.row_id,
        field_name=error.field_name,
        variable_name=error.variable_name,
        formula=error.formula,
        position=error.position,
        message=error.message,
    )


@router.post("/formula/validate", response_model=FormulaValidateResponse)
def validate_formula(payload: FormulaValidateRequest):
    try:
        Parser(payload.formula).parse()
    except FormulaError as exc:
        exc.build_family_id = payload.build_family_id
        exc.row_id = payload.row_id
        exc.field_name = payload.field_name
        exc.variable_name = payload.variable_name
        exc.formula = payload.formula
        return FormulaValidateResponse(valid=False, errors=[_error_detail(exc)])
    return FormulaValidateResponse(valid=True, errors=[])


@router.post("/formula/test", response_model=FormulaTestResponse)
def test_formula(payload: FormulaTestRequest):
    meta = EvaluationMeta(
        build_family_id=payload.build_family_id,
        row_id=payload.row_id,
        field_name=payload.field_name,
        variable_name=payload.variable_name,
    )
    try:
        value = evaluate_formula(payload.formula, payload.context, meta)
    except FormulaError as exc:
        return FormulaTestResponse(value=None, value_type="error", errors=[_error_detail(exc)])

    value_type = "text"
    if isinstance(value, bool):
        value_type = "boolean"
    elif isinstance(value, (int, float)):
        value_type = "number"
    elif isinstance(value, dict):
        value_type = "object"
    elif isinstance(value, list):
        value_type = "array"

    return FormulaTestResponse(value=value, value_type=value_type, errors=[])
