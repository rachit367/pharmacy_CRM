from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import Medicine
from .routes import dashboard, medicines, sales
from .services.inventory import refresh_medicine_statuses
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
        refresh_medicine_statuses(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Pharmacy CRM API is running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

