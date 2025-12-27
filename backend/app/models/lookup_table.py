import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TimestampMixin
from app.models.enums import LookupTableScope


class LookupTable(Base, IdMixin, TimestampMixin):
    __tablename__ = "lookup_tables"
    __table_args__ = (
        UniqueConstraint(
            "scope", "build_family_id", "name", name="uq_lookup_table_scope_name"
        ),
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    scope: Mapped[LookupTableScope] = mapped_column(nullable=False)
    build_family_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("build_families.id"), nullable=True
    )
    description: Mapped[Optional[str]] = mapped_column(String(500))

    build_family: Mapped[Optional["BuildFamily"]] = relationship(
        "BuildFamily", back_populates="lookup_tables"
    )
    columns: Mapped[list["LookupTableColumn"]] = relationship(
        "LookupTableColumn", back_populates="lookup_table", cascade="all, delete-orphan"
    )
    rows: Mapped[list["LookupTableRow"]] = relationship(
        "LookupTableRow", back_populates="lookup_table", cascade="all, delete-orphan"
    )
