import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin


class ModelCode(Base, IdMixin, TimestampMixin):
    __tablename__ = "model_codes"
    __table_args__ = (
        UniqueConstraint("build_family_id", "model_code", name="uq_model_code_family"),
    )

    build_family_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("build_families.id"), nullable=False
    )
    model_code: Mapped[str] = mapped_column(String(100), nullable=False)
    marketing_category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("marketing_categories.id"), nullable=True
    )
    manufacturing_department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("manufacturing_departments.id"), nullable=True
    )

    build_family: Mapped["BuildFamily"] = relationship(
        "BuildFamily", back_populates="model_codes"
    )
    marketing_category: Mapped[Optional["MarketingCategory"]] = relationship(
        "MarketingCategory", back_populates="model_codes"
    )
    manufacturing_department: Mapped[Optional["ManufacturingDepartment"]] = relationship(
        "ManufacturingDepartment", back_populates="model_codes"
    )
    config_values: Mapped[list["ModelCodeConfigValue"]] = relationship(
        "ModelCodeConfigValue", back_populates="model_code", cascade="all, delete-orphan"
    )
