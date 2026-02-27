from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class MedicineStatusEnum(str, Enum):
    active = "active"
    low_stock = "low_stock"
    expired = "expired"
    out_of_stock = "out_of_stock"


class PaymentModeEnum(str, Enum):
    cash = "Cash"
    card = "Card"
    upi = "UPI"


class MedicineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    generic_name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    batch_no: str = Field(..., min_length=1, max_length=50)
    expiry_date: date
    quantity: int = Field(..., ge=0)
    cost_price: float = Field(..., gt=0)
    mrp: float = Field(..., gt=0)
    supplier: str = Field(..., min_length=1, max_length=200)

    @validator("mrp")
    def mrp_must_be_gte_cost(cls, v, values):
        if "cost_price" in values and v < values["cost_price"]:
            raise ValueError("MRP must be greater than or equal to cost price")
        return v


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    generic_name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    batch_no: Optional[str] = Field(None, min_length=1, max_length=50)
    expiry_date: Optional[date] = None
    quantity: Optional[int] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, gt=0)
    mrp: Optional[float] = Field(None, gt=0)
    supplier: Optional[str] = Field(None, min_length=1, max_length=200)


class MedicineStatusUpdate(BaseModel):
    status: MedicineStatusEnum


class MedicineResponse(MedicineBase):
    id: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int = Field(..., gt=0)


class SaleCreate(BaseModel):
    patient_name: str = Field(..., min_length=1, max_length=200)
    payment_mode: PaymentModeEnum = PaymentModeEnum.cash
    items: List[SaleItemCreate] = Field(..., min_length=1)


class SaleItemResponse(BaseModel):
    id: int
    medicine_id: int
    medicine_name: str
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    invoice_no: str
    patient_name: str
    items_count: int
    total_amount: float
    payment_mode: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    todays_sales: float
    items_sold_today: int
    low_stock_count: int
    purchase_order_total: float
    pending_orders: int
    total_orders: int
    sales_growth: float


class PurchaseSummary(BaseModel):
    id: int
    supplier: str
    total_amount: float
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InventoryOverview(BaseModel):
    total_items: int
    active_stock: int
    low_stock: int
    total_value: float
