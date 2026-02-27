from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Enum as SQLEnum
from sqlalchemy.sql import func
from .database import Base
import enum


class MedicineStatus(str, enum.Enum):
    ACTIVE = "active"
    LOW_STOCK = "low_stock"
    EXPIRED = "expired"
    OUT_OF_STOCK = "out_of_stock"


class PaymentMode(str, enum.Enum):
    CASH = "Cash"
    CARD = "Card"
    UPI = "UPI"


class OrderStatus(str, enum.Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False, index=True)
    generic_name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    batch_no = Column(String(50), nullable=False, unique=True)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    cost_price = Column(Float, nullable=False)
    mrp = Column(Float, nullable=False)
    supplier = Column(String(200), nullable=False)
    status = Column(String(20), nullable=False, default=MedicineStatus.ACTIVE.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    invoice_no = Column(String(50), nullable=False, unique=True, index=True)
    patient_name = Column(String(200), nullable=False)
    items_count = Column(Integer, nullable=False, default=0)
    total_amount = Column(Float, nullable=False, default=0.0)
    payment_mode = Column(String(20), nullable=False, default=PaymentMode.CASH.value)
    status = Column(String(20), nullable=False, default="Completed")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sale_id = Column(Integer, nullable=False)
    medicine_id = Column(Integer, nullable=False)
    medicine_name = Column(String(200), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    supplier = Column(String(200), nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(20), nullable=False, default=OrderStatus.PENDING.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
