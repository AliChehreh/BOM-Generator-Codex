from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BuildFamilyBase(BaseModel):
    name: str
    description: Optional[str] = None


class BuildFamilyCreate(BuildFamilyBase):
    pass


class BuildFamilyUpdate(BuildFamilyBase):
    pass


class BuildFamilyOut(BuildFamilyBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
