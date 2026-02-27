from sqlalchemy.orm import Session
from datetime import date
from ..models import Medicine, MedicineStatus


LOW_STOCK_THRESHOLD = 50


def refresh_medicine_statuses(db: Session):
    """Update medicine statuses based on quantity and expiry date."""
    medicines = db.query(Medicine).all()
    today = date.today()

    for med in medicines:
        if med.quantity == 0:
            med.status = MedicineStatus.OUT_OF_STOCK.value
        elif med.expiry_date and med.expiry_date <= today:
            med.status = MedicineStatus.EXPIRED.value
        elif med.quantity <= LOW_STOCK_THRESHOLD:
            med.status = MedicineStatus.LOW_STOCK.value
        else:
            med.status = MedicineStatus.ACTIVE.value

    db.commit()
