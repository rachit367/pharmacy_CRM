from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from ..database import get_db
from ..models import Medicine, Sale, SaleItem, PurchaseOrder, MedicineStatus
from ..schemas import DashboardSummary, SaleResponse, MedicineResponse, PurchaseSummary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Returns aggregated dashboard summary data."""
    today = date.today()

    # Today's sales total
    todays_sales = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0)).filter(
        func.date(Sale.created_at) == today
    ).scalar()

    # Items sold today
    today_sale_ids = db.query(Sale.id).filter(func.date(Sale.created_at) == today).subquery()
    items_sold = db.query(func.coalesce(func.sum(SaleItem.quantity), 0)).filter(
        SaleItem.sale_id.in_(db.query(today_sale_ids))
    ).scalar()

    # Low stock count
    low_stock_count = db.query(func.count(Medicine.id)).filter(
        Medicine.status == MedicineStatus.LOW_STOCK.value
    ).scalar()

    # Purchase order totals
    purchase_total = db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0.0)).scalar()
    pending_orders = db.query(func.count(PurchaseOrder.id)).filter(
        PurchaseOrder.status == "Pending"
    ).scalar()
    total_orders = db.query(func.count(PurchaseOrder.id)).scalar()

    # Sales growth (compare today vs yesterday – simple percentage)
    yesterday = date.today().replace(day=max(1, date.today().day - 1))
    yesterday_sales = db.query(func.coalesce(func.sum(Sale.total_amount), 0.0)).filter(
        func.date(Sale.created_at) == yesterday
    ).scalar()

    growth = 0.0
    if yesterday_sales and yesterday_sales > 0:
        growth = round(((todays_sales - yesterday_sales) / yesterday_sales) * 100, 1)

    return DashboardSummary(
        todays_sales=float(todays_sales),
        items_sold_today=int(items_sold),
        low_stock_count=int(low_stock_count),
        purchase_order_total=float(purchase_total),
        pending_orders=int(pending_orders),
        total_orders=int(total_orders),
        sales_growth=growth
    )


@router.get("/recent-sales", response_model=list[SaleResponse])
def get_recent_sales(limit: int = 10, db: Session = Depends(get_db)):
    """Returns the most recent sales."""
    sales = db.query(Sale).order_by(Sale.created_at.desc()).limit(limit).all()
    return sales


@router.get("/low-stock", response_model=list[MedicineResponse])
def get_low_stock_medicines(db: Session = Depends(get_db)):
    """Returns medicines with low stock status."""
    medicines = db.query(Medicine).filter(
        Medicine.status.in_([MedicineStatus.LOW_STOCK.value, MedicineStatus.OUT_OF_STOCK.value])
    ).all()
    return medicines


@router.get("/purchase-summary", response_model=list[PurchaseSummary])
def get_purchase_summary(limit: int = 10, db: Session = Depends(get_db)):
    """Returns recent purchase order summaries."""
    orders = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).limit(limit).all()
    return orders
