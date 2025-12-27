import uuid

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin
from app.models.enums import LookupColumnType


class LookupTableColumn(Base, IdMixin):
    __tablename__ = "lookup_table_columns"
    __table_args__ = (
        UniqueConstraint(
            "lookup_table_id", "column_name", name="uq_lookup_column_table_name"
        ),
    )

    lookup_table_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("lookup_tables.id"), nullable=False
    )
    column_name: Mapped[str] = mapped_column(String(200), nullable=False)
    column_type: Mapped[LookupColumnType] = mapped_column(nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    lookup_table: Mapped["LookupTable"] = relationship(
        "LookupTable", back_populates="columns"
    )
