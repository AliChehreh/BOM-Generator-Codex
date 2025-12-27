from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ConfigValueItem(BaseModel):
    field_id: UUID
    value_json: Optional[Any] = None


class ConfigValueBulkUpdate(BaseModel):
    values: list[ConfigValueItem]


class ConfigValueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    model_code_id: UUID
    field_id: UUID
    value_json: Optional[Any] = None
    updated_at: datetime
