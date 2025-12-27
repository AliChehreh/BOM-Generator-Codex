from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.marketing_category import MarketingCategory
from app.schemas.marketing_category import MarketingCategoryOut

router = APIRouter()


@router.get("/marketing-categories", response_model=list[MarketingCategoryOut])
def list_marketing_categories(db: Session = Depends(get_db)):
    return db.execute(select(MarketingCategory).order_by(MarketingCategory.name)).scalars().all()
