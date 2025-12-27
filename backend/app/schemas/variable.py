from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import VariableType


class VariableBase(BaseModel):
    name: str
    type: VariableType
    formula: str
    display_order: int = 0


class VariableCreate(VariableBase):
    pass


class VariableUpdate(VariableBase):
    pass


class VariableOut(VariableBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    build_family_id: UUID
    updated_at: datetime
