from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BomTemplateRowBase(BaseModel):
    row_id: str
    level_type: Optional[str] = None
    component_no: Optional[str] = None
    description: Optional[str] = None
    uom_code: Optional[str] = None
    nest_level: int = 0
    display_order: int = 0

    f_qty_per_product: Optional[str] = None
    f_qty: Optional[str] = None
    f_size_per_unit: Optional[str] = None
    f_qty_per_assembly: Optional[str] = None
    f_unit_cost: Optional[str] = None
    f_price_per_product: Optional[str] = None
    f_extended_price: Optional[str] = None


class BomTemplateRowCreate(BomTemplateRowBase):
    pass


class BomTemplateRowUpdate(BomTemplateRowBase):
    pass


class BomTemplateRowOut(BomTemplateRowBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    build_family_id: UUID
