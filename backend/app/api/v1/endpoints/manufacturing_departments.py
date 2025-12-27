from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.manufacturing_department import ManufacturingDepartment
from app.schemas.manufacturing_department import ManufacturingDepartmentOut

router = APIRouter()


@router.get("/manufacturing-departments", response_model=list[ManufacturingDepartmentOut])
def list_manufacturing_departments(db: Session = Depends(get_db)):
    return (
        db.execute(select(ManufacturingDepartment).order_by(ManufacturingDepartment.name))
        .scalars()
        .all()
    )
