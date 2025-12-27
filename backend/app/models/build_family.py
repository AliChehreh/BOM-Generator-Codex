from typing import Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin


class BuildFamily(Base, IdMixin, TimestampMixin):
    __tablename__ = "build_families"

    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500))

    model_codes: Mapped[list["ModelCode"]] = relationship(
        "ModelCode", back_populates="build_family", cascade="all, delete-orphan"
    )
    config_fields: Mapped[list["ModelCodeConfigField"]] = relationship(
        "ModelCodeConfigField",
        back_populates="build_family",
        cascade="all, delete-orphan",
    )
    lookup_tables: Mapped[list["LookupTable"]] = relationship(
        "LookupTable", back_populates="build_family", cascade="all, delete-orphan"
    )
    variables: Mapped[list["Variable"]] = relationship(
        "Variable", back_populates="build_family", cascade="all, delete-orphan"
    )
    bom_template_rows: Mapped[list["BomTemplateRow"]] = relationship(
        "BomTemplateRow", back_populates="build_family", cascade="all, delete-orphan"
    )
