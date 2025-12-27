from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import LookupColumnType, LookupTableScope


class LookupTableBase(BaseModel):
    name: str
    scope: LookupTableScope
    build_family_id: Optional[UUID] = None
    description: Optional[str] = None


class LookupTableCreate(LookupTableBase):
    pass


class LookupTableUpdate(LookupTableBase):
    pass


class LookupTableOut(LookupTableBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class LookupTableColumnBase(BaseModel):
    column_name: str
    column_type: LookupColumnType
    display_order: int = 0


class LookupTableColumnUpdate(LookupTableColumnBase):
    id: Optional[UUID] = None


class LookupTableColumnOut(LookupTableColumnBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lookup_table_id: UUID


class LookupTableColumnsUpdate(BaseModel):
    columns: list[LookupTableColumnUpdate]


class LookupTableRowBase(BaseModel):
    list_size: float
    row_values_json: dict[str, Any]


class LookupTableRowBulkUpdate(BaseModel):
    rows: list[LookupTableRowBase]


class LookupTableRowOut(LookupTableRowBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    lookup_table_id: UUID
    updated_at: datetime
