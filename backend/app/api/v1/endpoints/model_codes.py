from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.build_family import BuildFamily
from app.models.model_code import ModelCode
from app.schemas.model_code import ModelCodeCreate, ModelCodeOut, ModelCodeUpdate

router = APIRouter()


@router.post("/build-families/{build_family_id}/model-codes", response_model=ModelCodeOut, status_code=status.HTTP_201_CREATED)
def create_model_code(
    build_family_id: UUID, payload: ModelCodeCreate, db: Session = Depends(get_db)
):
    build_family = db.get(BuildFamily, build_family_id)
    if not build_family:
        raise HTTPException(status_code=404, detail="Build family not found")
    model_code = ModelCode(
        build_family_id=build_family_id,
        model_code=payload.model_code,
        marketing_category_id=payload.marketing_category_id,
        manufacturing_department_id=payload.manufacturing_department_id,
    )
    db.add(model_code)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Model code already exists in this build family")
    db.refresh(model_code)
    return model_code


@router.get("/build-families/{build_family_id}/model-codes", response_model=list[ModelCodeOut])
def list_model_codes(build_family_id: UUID, db: Session = Depends(get_db)):
    return (
        db.execute(
            select(ModelCode)
            .where(ModelCode.build_family_id == build_family_id)
            .order_by(ModelCode.model_code)
        )
        .scalars()
        .all()
    )


@router.put("/model-codes/{model_code_id}", response_model=ModelCodeOut)
def update_model_code(
    model_code_id: UUID, payload: ModelCodeUpdate, db: Session = Depends(get_db)
):
    model_code = db.get(ModelCode, model_code_id)
    if not model_code:
        raise HTTPException(status_code=404, detail="Model code not found")
    model_code.model_code = payload.model_code
    model_code.marketing_category_id = payload.marketing_category_id
    model_code.manufacturing_department_id = payload.manufacturing_department_id
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Model code already exists in this build family")
    db.refresh(model_code)
    return model_code


@router.delete("/model-codes/{model_code_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model_code(model_code_id: UUID, db: Session = Depends(get_db)):
    model_code = db.get(ModelCode, model_code_id)
    if not model_code:
        raise HTTPException(status_code=404, detail="Model code not found")
    db.delete(model_code)
    db.commit()
    return None
