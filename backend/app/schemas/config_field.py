from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import ConfigFieldType


class ConfigFieldBase(BaseModel):
    field_name: str
    field_type: ConfigFieldType
    enum_values: Optional[list[str]] = None
    is_required: bool = True
    display_order: int = 0


class ConfigFieldCreate(ConfigFieldBase):
    pass


class ConfigFieldUpdate(ConfigFieldBase):
    pass


class ConfigFieldOut(ConfigFieldBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    build_family_id: UUID
