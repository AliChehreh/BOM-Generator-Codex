from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin


class MarketingCategory(Base, IdMixin):
    __tablename__ = "marketing_categories"

    name: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)

    model_codes: Mapped[list["ModelCode"]] = relationship(
        "ModelCode", back_populates="marketing_category"
    )
