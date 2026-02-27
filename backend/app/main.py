from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import Medicine, Sale, SaleItem, PurchaseOrder
from .routes import dashboard, medicines, sales
from .services.inventory import refresh_medicine_statuses
from datetime import date, datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Pharmacy CRM API",
    description="Backend API for Pharmacy CRM",
    version="1.0.0"
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(medicines.router)
app.include_router(sales.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(Medicine).count() == 0:
            seed_data(db)

        refresh_medicine_statuses(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Pharmacy CRM API is running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


def seed_data(db):
    """Insert initial data into the database."""
    today = date.today()

    medicines_data = [
        Medicine(
            name="Paracetamol 650mg",
            generic_name="Acetaminophen",
            category="Analgesic",
            batch_no="PCM-2024-0892",
            expiry_date=date(2026, 8, 20),
            quantity=500,
            cost_price=15.00,
            mrp=25.00,
            supplier="MedSupply Co.",
            status="active"
        ),
        Medicine(
            name="Omeprazole 20mg Capsule",
            generic_name="Omeprazole",
            category="Gastric",
            batch_no="OMP-2024-5873",
            expiry_date=date(2025, 11, 10),
            quantity=45,
            cost_price=65.00,
            mrp=95.75,
            supplier="HealthCare Ltd.",
            status="low_stock"
        ),
        Medicine(
            name="Aspirin 75mg",
            generic_name="Aspirin",
            category="Anticoagulant",
            batch_no="ASP-2023-3401",
            expiry_date=date(2024, 9, 30),
            quantity=300,
            cost_price=28.00,
            mrp=45.00,
            supplier="GreenMed",
            status="expired"
        ),
        Medicine(
            name="Atorvastatin 10mg",
            generic_name="Atorvastatin Besylate",
            category="Cardiovascular",
            batch_no="AME-2024-0945",
            expiry_date=date(2025, 10, 15),
            quantity=0,
            cost_price=145.00,
            mrp=195.00,
            supplier="PharmaCorp",
            status="out_of_stock"
        ),
        Medicine(
            name="Amoxicillin 500mg",
            generic_name="Amoxicillin",
            category="Antibiotic",
            batch_no="AMX-2024-1122",
            expiry_date=date(2026, 3, 15),
            quantity=200,
            cost_price=35.00,
            mrp=55.00,
            supplier="MedSupply Co.",
            status="active"
        ),
        Medicine(
            name="Metformin 500mg",
            generic_name="Metformin HCl",
            category="Antidiabetic",
            batch_no="MET-2024-7890",
            expiry_date=date(2026, 6, 30),
            quantity=350,
            cost_price=12.00,
            mrp=22.00,
            supplier="HealthCare Ltd.",
            status="active"
        ),
        Medicine(
            name="Cetirizine 10mg",
            generic_name="Cetirizine Dihydrochloride",
            category="Antihistamine",
            batch_no="CET-2024-4521",
            expiry_date=date(2026, 1, 20),
            quantity=30,
            cost_price=8.00,
            mrp=15.00,
            supplier="GreenMed",
            status="low_stock"
        ),
        Medicine(
            name="Pantoprazole 40mg",
            generic_name="Pantoprazole Sodium",
            category="Gastric",
            batch_no="PAN-2024-6634",
            expiry_date=date(2026, 5, 10),
            quantity=180,
            cost_price=42.00,
            mrp=68.00,
            supplier="PharmaCorp",
            status="active"
        ),
        Medicine(
            name="Azithromycin 500mg",
            generic_name="Azithromycin",
            category="Antibiotic",
            batch_no="AZI-2024-2290",
            expiry_date=date(2026, 4, 25),
            quantity=15,
            cost_price=85.00,
            mrp=120.00,
            supplier="MedSupply Co.",
            status="low_stock"
        ),
        Medicine(
            name="Ibuprofen 400mg",
            generic_name="Ibuprofen",
            category="Analgesic",
            batch_no="IBU-2024-3378",
            expiry_date=date(2026, 7, 18),
            quantity=420,
            cost_price=10.00,
            mrp=18.00,
            supplier="HealthCare Ltd.",
            status="active"
        ),
    ]
    db.add_all(medicines_data)
    db.flush()

    sales_data = [
        Sale(
            invoice_no="INV-2024-1234",
            patient_name="Rajesh Kumar",
            items_count=3,
            total_amount=340.00,
            payment_mode="Card",
            status="Completed",
            created_at=datetime.now()
        ),
        Sale(
            invoice_no="INV-2024-1235",
            patient_name="Sarah Smith",
            items_count=2,
            total_amount=145.00,
            payment_mode="Cash",
            status="Completed",
            created_at=datetime.now() - timedelta(hours=1)
        ),
        Sale(
            invoice_no="INV-2024-1236",
            patient_name="Michael Johnson",
            items_count=5,
            total_amount=625.00,
            payment_mode="UPI",
            status="Completed",
            created_at=datetime.now() - timedelta(hours=2)
        ),
        Sale(
            invoice_no="INV-2024-1237",
            patient_name="Priya Sharma",
            items_count=1,
            total_amount=95.75,
            payment_mode="Cash",
            status="Completed",
            created_at=datetime.now() - timedelta(hours=3)
        ),
        Sale(
            invoice_no="INV-2024-1238",
            patient_name="Amit Patel",
            items_count=4,
            total_amount=520.00,
            payment_mode="UPI",
            status="Completed",
            created_at=datetime.now() - timedelta(hours=5)
        ),
    ]
    db.add_all(sales_data)
    db.flush()

    sale_items_data = [
        SaleItem(sale_id=1, medicine_id=1, medicine_name="Paracetamol 650mg", quantity=2, unit_price=25.00, total_price=50.00),
        SaleItem(sale_id=1, medicine_id=5, medicine_name="Amoxicillin 500mg", quantity=1, unit_price=55.00, total_price=55.00),
        SaleItem(sale_id=1, medicine_id=8, medicine_name="Pantoprazole 40mg", quantity=3, unit_price=68.00, total_price=204.00),
        SaleItem(sale_id=2, medicine_id=6, medicine_name="Metformin 500mg", quantity=2, unit_price=22.00, total_price=44.00),
        SaleItem(sale_id=2, medicine_id=7, medicine_name="Cetirizine 10mg", quantity=1, unit_price=15.00, total_price=15.00),
        SaleItem(sale_id=3, medicine_id=1, medicine_name="Paracetamol 650mg", quantity=5, unit_price=25.00, total_price=125.00),
        SaleItem(sale_id=3, medicine_id=10, medicine_name="Ibuprofen 400mg", quantity=3, unit_price=18.00, total_price=54.00),
        SaleItem(sale_id=4, medicine_id=2, medicine_name="Omeprazole 20mg Capsule", quantity=1, unit_price=95.75, total_price=95.75),
        SaleItem(sale_id=5, medicine_id=5, medicine_name="Amoxicillin 500mg", quantity=2, unit_price=55.00, total_price=110.00),
        SaleItem(sale_id=5, medicine_id=8, medicine_name="Pantoprazole 40mg", quantity=2, unit_price=68.00, total_price=136.00),
    ]
    db.add_all(sale_items_data)

    purchase_orders = [
        PurchaseOrder(
            supplier="MedSupply Co.",
            total_amount=45000.00,
            status="Pending",
            created_at=datetime.now() - timedelta(days=1)
        ),
        PurchaseOrder(
            supplier="HealthCare Ltd.",
            total_amount=28500.00,
            status="Completed",
            created_at=datetime.now() - timedelta(days=3)
        ),
        PurchaseOrder(
            supplier="GreenMed",
            total_amount=12750.00,
            status="Pending",
            created_at=datetime.now() - timedelta(days=2)
        ),
        PurchaseOrder(
            supplier="PharmaCorp",
            total_amount=10000.00,
            status="Pending",
            created_at=datetime.now() - timedelta(days=4)
        ),
        PurchaseOrder(
            supplier="MedSupply Co.",
            total_amount=0.00,
            status="Pending",
            created_at=datetime.now() - timedelta(days=5)
        ),
        PurchaseOrder(
            supplier="HealthCare Ltd.",
            total_amount=0.00,
            status="Pending",
            created_at=datetime.now() - timedelta(days=6)
        ),
    ]
    db.add_all(purchase_orders)

    db.commit()
