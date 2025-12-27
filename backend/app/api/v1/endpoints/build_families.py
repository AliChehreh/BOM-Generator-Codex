from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.build_family import BuildFamily
from app.schemas.build_family import BuildFamilyCreate, BuildFamilyOut, BuildFamilyUpdate

router = APIRouter()


@router.get("", response_model=list[BuildFamilyOut])
def list_build_families(db: Session = Depends(get_db)):
    return db.execute(select(BuildFamily).order_by(BuildFamily.name)).scalars().all()


@router.post("", response_model=BuildFamilyOut, status_code=status.HTTP_201_CREATED)
def create_build_family(payload: BuildFamilyCreate, db: Session = Depends(get_db)):
    build_family = BuildFamily(name=payload.name, description=payload.description)
    db.add(build_family)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Build family name already exists")
    db.refresh(build_family)
    return build_family


@router.get("/{build_family_id}", response_model=BuildFamilyOut)
def get_build_family(build_family_id: UUID, db: Session = Depends(get_db)):
    build_family = db.get(BuildFamily, build_family_id)
    if not build_family:
        raise HTTPException(status_code=404, detail="Build family not found")
    return build_family


@router.put("/{build_family_id}", response_model=BuildFamilyOut)
def update_build_family(
    build_family_id: UUID, payload: BuildFamilyUpdate, db: Session = Depends(get_db)
):
    build_family = db.get(BuildFamily, build_family_id)
    if not build_family:
        raise HTTPException(status_code=404, detail="Build family not found")
    build_family.name = payload.name
    build_family.description = payload.description
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Build family name already exists")
    db.refresh(build_family)
    return build_family


@router.delete("/{build_family_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_build_family(build_family_id: UUID, db: Session = Depends(get_db)):
    build_family = db.get(BuildFamily, build_family_id)
    if not build_family:
        raise HTTPException(status_code=404, detail="Build family not found")
    db.delete(build_family)
    db.commit()
    return None
