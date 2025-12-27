import uuid

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, UpdatedAtMixin
from app.models.enums import VariableType


class Variable(Base, IdMixin, UpdatedAtMixin):
    __tablename__ = "variables"
    __table_args__ = (
        UniqueConstraint("build_family_id", "name", name="uq_variable_family_name"),
    )

    build_family_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("build_families.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[VariableType] = mapped_column(nullable=False)
    formula: Mapped[str] = mapped_column(Text, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    build_family: Mapped["BuildFamily"] = relationship(
        "BuildFamily", back_populates="variables"
    )
