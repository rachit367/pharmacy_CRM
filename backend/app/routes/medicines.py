from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import date
from ..database import get_db
from ..models import Medicine, MedicineStatus
from ..schemas import (
    MedicineCreate, MedicineUpdate, MedicineResponse,
    MedicineStatusUpdate, InventoryOverview
)

router = APIRouter(prefix="/api/medicines", tags=["Medicines"])

LOW_STOCK_THRESHOLD = 50


def _compute_status(medicine_data: dict) -> str:
    """Compute the status of a medicine based on quantity and expiry."""
    quantity = medicine_data.get("quantity", 0)
    expiry = medicine_data.get("expiry_date")

    if quantity == 0:
        return MedicineStatus.OUT_OF_STOCK.value
    if expiry and expiry <= date.today():
        return MedicineStatus.EXPIRED.value
    if quantity <= LOW_STOCK_THRESHOLD:
        return MedicineStatus.LOW_STOCK.value
    return MedicineStatus.ACTIVE.value


@router.get("/overview", response_model=InventoryOverview)
def get_inventory_overview(db: Session = Depends(get_db)):
    """Returns inventory overview stats."""
    all_meds = db.query(Medicine).all()

    total_items = len(all_meds)
    active_stock = sum(1 for m in all_meds if m.status == MedicineStatus.ACTIVE.value)
    low_stock = sum(1 for m in all_meds if m.status == MedicineStatus.LOW_STOCK.value)
    total_value = sum(m.mrp * m.quantity for m in all_meds)

    return InventoryOverview(
        total_items=total_items,
        active_stock=active_stock,
        low_stock=low_stock,
        total_value=round(total_value, 2)
    )


@router.get("", response_model=list[MedicineResponse])
def get_medicines(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Returns a list of all medicines with optional filtering."""
    query = db.query(Medicine)

    if status:
        query = query.filter(Medicine.status == status)
    if category:
        query = query.filter(Medicine.category == category)

    medicines = query.order_by(Medicine.created_at.desc()).offset(skip).limit(limit).all()
    return medicines


@router.get("/search", response_model=list[MedicineResponse])
def search_medicines(
    query: str = Query(..., min_length=1, description="Search term"),
    db: Session = Depends(get_db)
):
    """Search medicines by name, generic name, or batch number."""
    search_term = f"%{query}%"
    medicines = db.query(Medicine).filter(
        or_(
            Medicine.name.ilike(search_term),
            Medicine.generic_name.ilike(search_term),
            Medicine.batch_no.ilike(search_term),
            Medicine.category.ilike(search_term)
        )
    ).limit(20).all()
    return medicines


@router.get("/{medicine_id}", response_model=MedicineResponse)
def get_medicine(medicine_id: int, db: Session = Depends(get_db)):
    """Returns a single medicine by ID."""
    medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine


@router.post("", response_model=MedicineResponse, status_code=201)
def create_medicine(medicine: MedicineCreate, db: Session = Depends(get_db)):
    """Creates a new medicine record."""
    # Check if batch_no already exists
    existing = db.query(Medicine).filter(Medicine.batch_no == medicine.batch_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="Batch number already exists")

    medicine_data = medicine.model_dump()
    medicine_data["status"] = _compute_status(medicine_data)

    db_medicine = Medicine(**medicine_data)
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)
    return db_medicine


@router.put("/{medicine_id}", response_model=MedicineResponse)
def update_medicine(medicine_id: int, medicine: MedicineUpdate, db: Session = Depends(get_db)):
    """Updates an existing medicine record."""
    db_medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    update_data = medicine.model_dump(exclude_unset=True)

    # If batch_no is being changed, check uniqueness
    if "batch_no" in update_data and update_data["batch_no"] != db_medicine.batch_no:
        existing = db.query(Medicine).filter(Medicine.batch_no == update_data["batch_no"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Batch number already exists")

    for key, value in update_data.items():
        setattr(db_medicine, key, value)

    # Recompute status after update
    status_data = {
        "quantity": db_medicine.quantity,
        "expiry_date": db_medicine.expiry_date
    }
    db_medicine.status = _compute_status(status_data)

    db.commit()
    db.refresh(db_medicine)
    return db_medicine


@router.patch("/{medicine_id}/status", response_model=MedicineResponse)
def update_medicine_status(
    medicine_id: int,
    status_update: MedicineStatusUpdate,
    db: Session = Depends(get_db)
):
    """Manually updates the status of a medicine."""
    db_medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    db_medicine.status = status_update.status.value
    db.commit()
    db.refresh(db_medicine)
    return db_medicine


@router.delete("/{medicine_id}", status_code=204)
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    """Deletes a medicine record."""
    db_medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not db_medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    db.delete(db_medicine)
    db.commit()
    return None
