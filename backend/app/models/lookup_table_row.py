import uuid

from sqlalchemy import ForeignKey, Numeric, UniqueConstraint
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, UpdatedAtMixin


class LookupTableRow(Base, IdMixin, UpdatedAtMixin):
    __tablename__ = "lookup_table_rows"
    __table_args__ = (
        UniqueConstraint("lookup_table_id", "list_size", name="uq_lookup_row_size"),
    )

    lookup_table_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("lookup_tables.id"), nullable=False
    )
    list_size: Mapped[float] = mapped_column(Numeric(18, 3), nullable=False)
    row_values_json: Mapped[object] = mapped_column(JSON, nullable=False)

    lookup_table: Mapped["LookupTable"] = relationship(
        "LookupTable", back_populates="rows"
    )
