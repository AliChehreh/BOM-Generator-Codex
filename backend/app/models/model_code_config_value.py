import uuid

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, UpdatedAtMixin


class ModelCodeConfigValue(Base, IdMixin, UpdatedAtMixin):
    __tablename__ = "model_code_config_values"
    __table_args__ = (
        UniqueConstraint("model_code_id", "field_id", name="uq_config_value_model_field"),
    )

    model_code_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("model_codes.id"), nullable=False
    )
    field_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("model_code_config_fields.id"), nullable=False
    )
    value_json: Mapped[object] = mapped_column(JSON, nullable=True)

    model_code: Mapped["ModelCode"] = relationship(
        "ModelCode", back_populates="config_values"
    )
    field: Mapped["ModelCodeConfigField"] = relationship(
        "ModelCodeConfigField", back_populates="config_values"
    )
