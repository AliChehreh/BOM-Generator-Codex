from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.model_code import ModelCode
from app.models.model_code_config_field import ModelCodeConfigField
from app.models.model_code_config_value import ModelCodeConfigValue
from app.schemas.config_value import ConfigValueBulkUpdate, ConfigValueOut

router = APIRouter()


@router.get("/model-codes/{model_code_id}/config-values", response_model=list[ConfigValueOut])
def list_config_values(model_code_id: UUID, db: Session = Depends(get_db)):
    return (
        db.execute(
            select(ModelCodeConfigValue).where(ModelCodeConfigValue.model_code_id == model_code_id)
        )
        .scalars()
        .all()
    )


@router.put("/model-codes/{model_code_id}/config-values", response_model=list[ConfigValueOut])
def upsert_config_values(
    model_code_id: UUID, payload: ConfigValueBulkUpdate, db: Session = Depends(get_db)
):
    model_code = db.get(ModelCode, model_code_id)
    if not model_code:
        raise HTTPException(status_code=404, detail="Model code not found")

    fields = (
        db.execute(
            select(ModelCodeConfigField).where(
                ModelCodeConfigField.build_family_id == model_code.build_family_id
            )
        )
        .scalars()
        .all()
    )
    field_lookup = {field.id: field for field in fields}
    values = (
        db.execute(
            select(ModelCodeConfigValue).where(
                ModelCodeConfigValue.model_code_id == model_code_id
            )
        )
        .scalars()
        .all()
    )
    value_lookup = {value.field_id: value for value in values}

    for item in payload.values:
        if item.field_id not in field_lookup:
            raise HTTPException(status_code=400, detail="Field does not belong to build family")
        existing = value_lookup.get(item.field_id)
        if existing:
            existing.value_json = item.value_json
        else:
            db.add(
                ModelCodeConfigValue(
                    model_code_id=model_code_id,
                    field_id=item.field_id,
                    value_json=item.value_json,
                )
            )

    db.commit()
    return (
        db.execute(
            select(ModelCodeConfigValue).where(ModelCodeConfigValue.model_code_id == model_code_id)
        )
        .scalars()
        .all()
    )


@router.get("/model-codes/{model_code_id}/config-values/validate")
def validate_config_values(model_code_id: UUID, db: Session = Depends(get_db)):
    model_code = db.get(ModelCode, model_code_id)
    if not model_code:
        raise HTTPException(status_code=404, detail="Model code not found")

    fields = (
        db.execute(
            select(ModelCodeConfigField).where(
                ModelCodeConfigField.build_family_id == model_code.build_family_id
            )
        )
        .scalars()
        .all()
    )
    required_fields = [field for field in fields if field.is_required]
    values = (
        db.execute(
            select(ModelCodeConfigValue).where(
                ModelCodeConfigValue.model_code_id == model_code_id
            )
        )
        .scalars()
        .all()
    )
    value_lookup = {value.field_id: value for value in values}

    missing = []
    for field in required_fields:
        value = value_lookup.get(field.id)
        if value is None or value.value_json is None:
            missing.append({"field_id": field.id, "field_name": field.field_name})

    return {"missing_required_fields": missing}
