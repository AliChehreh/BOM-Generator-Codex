from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.build_family import BuildFamily
from app.models.model_code_config_field import ModelCodeConfigField
from app.schemas.config_field import ConfigFieldCreate, ConfigFieldOut, ConfigFieldUpdate

router = APIRouter()


@router.post("/build-families/{build_family_id}/config-fields", response_model=ConfigFieldOut, status_code=status.HTTP_201_CREATED)
def create_config_field(
    build_family_id: UUID, payload: ConfigFieldCreate, db: Session = Depends(get_db)
):
    build_family = db.get(BuildFamily, build_family_id)
    if not build_family:
        raise HTTPException(status_code=404, detail="Build family not found")
    field = ModelCodeConfigField(
        build_family_id=build_family_id,
        field_name=payload.field_name,
        field_type=payload.field_type,
        enum_values=payload.enum_values,
        is_required=payload.is_required,
        display_order=payload.display_order,
    )
    db.add(field)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Field name already exists in this build family")
    db.refresh(field)
    return field


@router.get("/build-families/{build_family_id}/config-fields", response_model=list[ConfigFieldOut])
def list_config_fields(build_family_id: UUID, db: Session = Depends(get_db)):
    return (
        db.execute(
            select(ModelCodeConfigField)
            .where(ModelCodeConfigField.build_family_id == build_family_id)
            .order_by(ModelCodeConfigField.display_order, ModelCodeConfigField.field_name)
        )
        .scalars()
        .all()
    )


@router.put("/config-fields/{field_id}", response_model=ConfigFieldOut)
def update_config_field(
    field_id: UUID, payload: ConfigFieldUpdate, db: Session = Depends(get_db)
):
    field = db.get(ModelCodeConfigField, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Config field not found")
    field.field_name = payload.field_name
    field.field_type = payload.field_type
    field.enum_values = payload.enum_values
    field.is_required = payload.is_required
    field.display_order = payload.display_order
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Field name already exists in this build family")
    db.refresh(field)
    return field


@router.delete("/config-fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_config_field(field_id: UUID, db: Session = Depends(get_db)):
    field = db.get(ModelCodeConfigField, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Config field not found")
    db.delete(field)
    db.commit()
    return None
