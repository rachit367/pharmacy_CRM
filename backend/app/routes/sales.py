from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from ..database import get_db
from ..models import Sale, SaleItem, Medicine, MedicineStatus
from ..schemas import SaleCreate, SaleResponse, SaleItemResponse

router = APIRouter(prefix="/api/sales", tags=["Sales"])

LOW_STOCK_THRESHOLD = 50


def _generate_invoice_no(db: Session) -> str:
    """Generate a unique invoice number."""
    year = datetime.now().year
    last_sale = db.query(Sale).order_by(Sale.id.desc()).first()
    next_id = (last_sale.id + 1) if last_sale else 1
    return f"INV-{year}-{next_id:04d}"


@router.post("", response_model=SaleResponse, status_code=201)
def create_sale(sale: SaleCreate, db: Session = Depends(get_db)):
    """Creates a new sale and deducts inventory quantities."""
    total_amount = 0.0
    items_count = 0
    sale_items_data = []

    # Validate all items first before making any changes
    for item in sale.items:
        medicine = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
        if not medicine:
            raise HTTPException(
                status_code=404,
                detail=f"Medicine with id {item.medicine_id} not found"
            )
        if medicine.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {medicine.name}. Available: {medicine.quantity}"
            )
        if medicine.status == MedicineStatus.EXPIRED.value:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot sell expired medicine: {medicine.name}"
            )

        item_total = medicine.mrp * item.quantity
        total_amount += item_total
        items_count += item.quantity

        sale_items_data.append({
            "medicine": medicine,
            "quantity": item.quantity,
            "unit_price": medicine.mrp,
            "total_price": item_total
        })

    # Create the sale record
    invoice_no = _generate_invoice_no(db)
    db_sale = Sale(
        invoice_no=invoice_no,
        patient_name=sale.patient_name,
        items_count=items_count,
        total_amount=round(total_amount, 2),
        payment_mode=sale.payment_mode.value,
        status="Completed"
    )
    db.add(db_sale)
    db.flush()  # Get the sale ID

    # Create sale items and update inventory
    for item_data in sale_items_data:
        medicine = item_data["medicine"]

        # Create sale item
        db_sale_item = SaleItem(
            sale_id=db_sale.id,
            medicine_id=medicine.id,
            medicine_name=medicine.name,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            total_price=item_data["total_price"]
        )
        db.add(db_sale_item)

        # Deduct quantity from inventory
        medicine.quantity -= item_data["quantity"]

        # update status if stock changed
        if medicine.quantity == 0:
            medicine.status = MedicineStatus.OUT_OF_STOCK.value
        elif medicine.quantity <= LOW_STOCK_THRESHOLD:
            medicine.status = MedicineStatus.LOW_STOCK.value

    db.commit()
    db.refresh(db_sale)
    return db_sale


@router.get("", response_model=list[SaleResponse])
def get_sales(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Returns a list of all sales."""
    sales = db.query(Sale).order_by(Sale.created_at.desc()).offset(skip).limit(limit).all()
    return sales


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    """Returns a single sale by ID."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.get("/{sale_id}/items", response_model=list[SaleItemResponse])
def get_sale_items(sale_id: int, db: Session = Depends(get_db)):
    """Returns items for a specific sale."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    items = db.query(SaleItem).filter(SaleItem.sale_id == sale_id).all()
    return items
