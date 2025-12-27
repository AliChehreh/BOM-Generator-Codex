from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.bom_template_row import BomTemplateRow
from app.models.build_family import BuildFamily
from app.schemas.bom_template_row import (
    BomTemplateRowCreate,
    BomTemplateRowOut,
    BomTemplateRowUpdate,
)

router = APIRouter()


@router.get("/build-families/{build_family_id}/bom-template-rows", response_model=list[BomTemplateRowOut])
def list_bom_template_rows(build_family_id: UUID, db: Session = Depends(get_db)):
    return (
        db.execute(
            select(BomTemplateRow)
            .where(BomTemplateRow.build_family_id == build_family_id)
            .order_by(BomTemplateRow.display_order, BomTemplateRow.row_id)
        )
        .scalars()
        .all()
    )


@router.post("/build-families/{build_family_id}/bom-template-rows", response_model=BomTemplateRowOut, status_code=status.HTTP_201_CREATED)
def create_bom_template_row(
    build_family_id: UUID, payload: BomTemplateRowCreate, db: Session = Depends(get_db)
):
    build_family = db.get(BuildFamily, build_family_id)
    if not build_family:
        raise HTTPException(status_code=404, detail="Build family not found")
    row = BomTemplateRow(
        build_family_id=build_family_id,
        row_id=payload.row_id,
        level_type=payload.level_type,
        component_no=payload.component_no,
        description=payload.description,
        uom_code=payload.uom_code,
        nest_level=payload.nest_level,
        display_order=payload.display_order,
        f_qty_per_product=payload.f_qty_per_product,
        f_qty=payload.f_qty,
        f_size_per_unit=payload.f_size_per_unit,
        f_qty_per_assembly=payload.f_qty_per_assembly,
        f_unit_cost=payload.f_unit_cost,
        f_price_per_product=payload.f_price_per_product,
        f_extended_price=payload.f_extended_price,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Row ID already exists in this build family")
    db.refresh(row)
    return row


@router.put("/bom-template-rows/{row_id}", response_model=BomTemplateRowOut)
def update_bom_template_row(
    row_id: UUID, payload: BomTemplateRowUpdate, db: Session = Depends(get_db)
):
    row = db.get(BomTemplateRow, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="BOM template row not found")
    row.row_id = payload.row_id
    row.level_type = payload.level_type
    row.component_no = payload.component_no
    row.description = payload.description
    row.uom_code = payload.uom_code
    row.nest_level = payload.nest_level
    row.display_order = payload.display_order
    row.f_qty_per_product = payload.f_qty_per_product
    row.f_qty = payload.f_qty
    row.f_size_per_unit = payload.f_size_per_unit
    row.f_qty_per_assembly = payload.f_qty_per_assembly
    row.f_unit_cost = payload.f_unit_cost
    row.f_price_per_product = payload.f_price_per_product
    row.f_extended_price = payload.f_extended_price
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Row ID already exists in this build family")
    db.refresh(row)
    return row


@router.delete("/bom-template-rows/{row_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bom_template_row(row_id: UUID, db: Session = Depends(get_db)):
    row = db.get(BomTemplateRow, row_id)
    if not row:
        raise HTTPException(status_code=404, detail="BOM template row not found")
    db.delete(row)
    db.commit()
    return None
