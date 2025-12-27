from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import VariableType


class FormulaErrorDetail(BaseModel):
    build_family_id: Optional[UUID] = None
    row_id: Optional[str] = None
    field_name: Optional[str] = None
    variable_name: Optional[str] = None
    formula: str
    position: Optional[int] = None
    message: str


class FormulaValidateRequest(BaseModel):
    build_family_id: Optional[UUID] = None
    formula: str
    row_id: Optional[str] = None
    field_name: Optional[str] = None
    variable_name: Optional[str] = None


class FormulaValidateResponse(BaseModel):
    valid: bool
    errors: list[FormulaErrorDetail] = []


class FormulaInputs(BaseModel):
    ModelCode: Optional[str] = None
    LS_L: Optional[float] = None
    LS_H: Optional[float] = None
    Finish: Optional[str] = None
    Order_Qty: Optional[int] = None


class VariableContext(BaseModel):
    name: str
    type: VariableType
    formula: Optional[str] = None
    value: Optional[Any] = None


class LookupColumnContext(BaseModel):
    name: str


class LookupRowContext(BaseModel):
    list_size: float
    values: dict[str, Any]


class LookupTableContext(BaseModel):
    name: str
    columns: list[LookupColumnContext]
    rows: list[LookupRowContext]


class FormulaContext(BaseModel):
    inputs: FormulaInputs
    config: dict[str, Any] = {}
    variables: list[VariableContext] = []
    rows: dict[str, dict[str, Any]] = {}
    lookup_tables: list[LookupTableContext] = []


class FormulaTestRequest(BaseModel):
    build_family_id: Optional[UUID] = None
    formula: str
    context: FormulaContext
    row_id: Optional[str] = None
    field_name: Optional[str] = None
    variable_name: Optional[str] = None


class FormulaTestResponse(BaseModel):
    value: Any
    value_type: str
    errors: list[FormulaErrorDetail] = []
