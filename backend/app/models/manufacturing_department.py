from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin


class ManufacturingDepartment(Base, IdMixin):
    __tablename__ = "manufacturing_departments"

    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)

    model_codes: Mapped[list["ModelCode"]] = relationship(
        "ModelCode", back_populates="manufacturing_department"
    )
