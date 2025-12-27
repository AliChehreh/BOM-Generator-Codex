import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin
from app.models.enums import ConfigFieldType


class ModelCodeConfigField(Base, IdMixin):
    __tablename__ = "model_code_config_fields"
    __table_args__ = (
        UniqueConstraint("build_family_id", "field_name", name="uq_config_field_family"),
    )

    build_family_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("build_families.id"), nullable=False
    )
    field_name: Mapped[str] = mapped_column(String(200), nullable=False)
    field_type: Mapped[ConfigFieldType] = mapped_column(nullable=False)
    enum_values: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    build_family: Mapped["BuildFamily"] = relationship(
        "BuildFamily", back_populates="config_fields"
    )
    config_values: Mapped[list["ModelCodeConfigValue"]] = relationship(
        "ModelCodeConfigValue", back_populates="field", cascade="all, delete-orphan"
    )
