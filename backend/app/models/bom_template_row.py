import uuid
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin


class BomTemplateRow(Base, IdMixin):
    __tablename__ = "bom_template_rows"
    __table_args__ = (
        UniqueConstraint("build_family_id", "row_id", name="uq_bom_row_family"),
    )

    build_family_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("build_families.id"), nullable=False
    )
    row_id: Mapped[str] = mapped_column(String(100), nullable=False)
    level_type: Mapped[Optional[str]] = mapped_column(String(100))
    component_no: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(String(500))
    uom_code: Mapped[Optional[str]] = mapped_column(String(50))
    nest_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    f_qty_per_product: Mapped[Optional[str]] = mapped_column(Text)
    f_qty: Mapped[Optional[str]] = mapped_column(Text)
    f_size_per_unit: Mapped[Optional[str]] = mapped_column(Text)
    f_qty_per_assembly: Mapped[Optional[str]] = mapped_column(Text)
    f_unit_cost: Mapped[Optional[str]] = mapped_column(Text)
    f_price_per_product: Mapped[Optional[str]] = mapped_column(Text)
    f_extended_price: Mapped[Optional[str]] = mapped_column(Text)

    build_family: Mapped["BuildFamily"] = relationship(
        "BuildFamily", back_populates="bom_template_rows"
    )
