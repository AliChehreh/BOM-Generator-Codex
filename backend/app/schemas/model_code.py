from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ModelCodeBase(BaseModel):
    model_code: str
    marketing_category_id: Optional[UUID] = None
    manufacturing_department_id: Optional[UUID] = None


class ModelCodeCreate(ModelCodeBase):
    pass


class ModelCodeUpdate(ModelCodeBase):
    pass


class ModelCodeOut(ModelCodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    build_family_id: UUID
    created_at: datetime
    updated_at: datetime
