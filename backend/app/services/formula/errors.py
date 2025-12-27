from dataclasses import dataclass
from typing import Optional
from uuid import UUID


@dataclass
class FormulaError(Exception):
    message: str
    formula: str
    position: Optional[int] = None
    build_family_id: Optional[UUID] = None
    row_id: Optional[str] = None
    field_name: Optional[str] = None
    variable_name: Optional[str] = None

    def __str__(self) -> str:
        return self.message
