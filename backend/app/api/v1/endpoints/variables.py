from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.build_family import BuildFamily
from app.models.variable import Variable
from app.schemas.variable import VariableCreate, VariableOut, VariableUpdate

router = APIRouter()


@router.get("/build-families/{build_family_id}/variables", response_model=list[VariableOut])
def list_variables(build_family_id: UUID, db: Session = Depends(get_db)):
    return (
        db.execute(
            select(Variable)
            .where(Variable.build_family_id == build_family_id)
            .order_by(Variable.display_order, Variable.name)
        )
        .scalars()
        .all()
    )


@router.post("/build-families/{build_family_id}/variables", response_model=VariableOut, status_code=status.HTTP_201_CREATED)
def create_variable(
    build_family_id: UUID, payload: VariableCreate, db: Session = Depends(get_db)
):
    build_family = db.get(BuildFamily, build_family_id)
    if not build_family:
        raise HTTPException(status_code=404, detail="Build family not found")
    variable = Variable(
        build_family_id=build_family_id,
        name=payload.name,
        type=payload.type,
        formula=payload.formula,
        display_order=payload.display_order,
    )
    db.add(variable)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Variable name already exists in this build family")
    db.refresh(variable)
    return variable


@router.put("/variables/{variable_id}", response_model=VariableOut)
def update_variable(variable_id: UUID, payload: VariableUpdate, db: Session = Depends(get_db)):
    variable = db.get(Variable, variable_id)
    if not variable:
        raise HTTPException(status_code=404, detail="Variable not found")
    variable.name = payload.name
    variable.type = payload.type
    variable.formula = payload.formula
    variable.display_order = payload.display_order
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Variable name already exists in this build family")
    db.refresh(variable)
    return variable


@router.delete("/variables/{variable_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variable(variable_id: UUID, db: Session = Depends(get_db)):
    variable = db.get(Variable, variable_id)
    if not variable:
        raise HTTPException(status_code=404, detail="Variable not found")
    db.delete(variable)
    db.commit()
    return None
