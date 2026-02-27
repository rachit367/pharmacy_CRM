# Pharmacy CRM — Full-Stack EMR Pharmacy Module


## Tech Stack

| Layer     | Technology                             |
|-----------|----------------------------------------|
| Backend   | Python 3.10+, FastAPI, SQLAlchemy, PostgreSQL |
| Frontend  | React 18, TypeScript, Vite, Axios      |
| Styling   | Vanilla CSS (custom design system)     |
| Icons     | Lucide React                           |

---

## Repository Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry, CORS, startup seed
│   │   ├── database.py        # SQLAlchemy engine + session
│   │   ├── models.py          # Medicine, Sale, SaleItem, PurchaseOrder
│   │   ├── schemas.py         # Pydantic request/response models
│   │   ├── routes/
│   │   │   ├── dashboard.py   # GET /api/dashboard/*
│   │   │   ├── medicines.py   # CRUD /api/medicines/*
│   │   │   └── sales.py       # POST/GET /api/sales/*
│   │   └── services/
│   │       └── inventory.py   # Auto-status refresh logic
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   └── Inventory.tsx
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── SalesList.tsx
│   │   │   ├── InventoryTable.tsx
│   │   │   └── AddMedicineModal.tsx
│   │   ├── services/api.ts
│   │   └── types/index.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
└── README.md
```

---

## Database Schema

### Medicines
| Column       | Type         | Notes                                      |
|-------------|--------------|--------------------------------------------|
| id          | Integer (PK) | Auto-increment                             |
| name        | String(200)  | Medicine brand name                        |
| generic_name| String(200)  | Generic/chemical name                      |
| category    | String(100)  | e.g. Analgesic, Antibiotic                 |
| batch_no    | String(50)   | Unique batch number                        |
| expiry_date | Date         | Expiration date                            |
| quantity    | Integer      | Current stock count                        |
| cost_price  | Float        | Purchase price per unit                    |
| mrp         | Float        | Maximum retail price                       |
| supplier    | String(200)  | Supplier name                              |
| status      | String(20)   | active / low_stock / expired / out_of_stock|
| created_at  | DateTime     | Record creation timestamp                  |

### Sales
| Column       | Type         | Notes                    |
|-------------|--------------|--------------------------|
| id          | Integer (PK) | Auto-increment           |
| invoice_no  | String(50)   | Unique invoice number    |
| patient_name| String(200)  | Patient/customer name    |
| items_count | Integer      | Total items in sale      |
| total_amount| Float        | Total sale amount (₹)    |
| payment_mode| String(20)   | Cash / Card / UPI        |
| status      | String(20)   | Completed / Pending      |
| created_at  | DateTime     | Sale timestamp           |

### Purchase Orders
| Column       | Type         | Notes                    |
|-------------|--------------|--------------------------|
| id          | Integer (PK) | Auto-increment           |
| supplier    | String(200)  | Supplier name            |
| total_amount| Float        | Order total (₹)          |
| status      | String(20)   | Pending / Completed      |
| created_at  | DateTime     | Order creation timestamp |

---

## API Documentation

### Dashboard APIs

| Method | Endpoint                       | Description                           |
|--------|--------------------------------|---------------------------------------|
| GET    | `/api/dashboard/summary`       | Today's sales, items sold, low stock  |
| GET    | `/api/dashboard/recent-sales`  | Recent sales list (default limit=10)  |
| GET    | `/api/dashboard/low-stock`     | Medicines with low/out-of-stock       |
| GET    | `/api/dashboard/purchase-summary` | Recent purchase orders             |

### Medicines (Inventory) APIs

| Method | Endpoint                          | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | `/api/medicines`                  | List all medicines (filterable)  |
| GET    | `/api/medicines/overview`         | Inventory overview stats         |
| GET    | `/api/medicines/search?query=`    | Search by name/generic/batch     |
| GET    | `/api/medicines/{id}`             | Get single medicine              |
| POST   | `/api/medicines`                  | Create new medicine              |
| PUT    | `/api/medicines/{id}`             | Update medicine                  |
| PATCH  | `/api/medicines/{id}/status`      | Update status only               |
| DELETE | `/api/medicines/{id}`             | Delete medicine                  |

### Sales APIs

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| POST   | `/api/sales`               | Create a new sale (deducts inventory)|
| GET    | `/api/sales`               | List all sales                       |
| GET    | `/api/sales/{id}`          | Get single sale                      |
| GET    | `/api/sales/{id}/items`    | Get sale line items                  |

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate    # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Start the server (auto-creates DB + seeds data)
uvicorn app.main:app --reload --port 8000
```

The backend runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start dev server
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API calls to the backend.

---

## Technical Explanation

### REST API Design

The API follows a **resource-based REST architecture** with three main routers, each handling a distinct domain:

```
/api/dashboard/*    → Read-only endpoints for aggregated metrics
/api/medicines/*    → Full CRUD for inventory management
/api/sales/*        → Sale creation + read operations
```

**Why this structure?**

Each router maps to a single resource type, keeping the codebase modular. The `dashboard` router doesn't own any data — it queries across `medicines`, `sales`, and `purchase_orders` to compute summary stats (today's sales total, items sold, low stock count, etc.). This separation means the dashboard logic can change independently without touching inventory or sales code.

The `medicines` router exposes the standard REST verbs:
- `GET /api/medicines` supports optional `status` and `category` query params for filtered listing
- `GET /api/medicines/search?query=` performs a case-insensitive search across `name`, `generic_name`, and `batch_no` using SQLAlchemy `ilike`
- `POST`, `PUT`, `DELETE` handle creation, full update, and deletion
- `PATCH /api/medicines/{id}/status` allows updating just the status field without sending the entire object

The `sales` router is intentionally write-heavy — the `POST /api/sales` endpoint does the most work (validation, inventory deduction, invoice generation), while `GET` endpoints are simple reads.

### Request/Response Validation (Pydantic)

Every incoming request passes through Pydantic schemas defined in `schemas.py`. Key validations include:

- **Field constraints**: `quantity >= 0`, `cost_price > 0`, `mrp > 0`, string lengths enforced
- **Business rule**: MRP must be ≥ cost price (custom `@validator` on `MedicineBase`)
- **Enum enforcement**: `payment_mode` only accepts `Cash`, `Card`, or `UPI`
- **Non-empty sales**: `items` list requires `min_length=1`, so empty sales are rejected at the schema level

This means invalid data never reaches the database layer — FastAPI returns a `422 Unprocessable Entity` with field-level error details automatically.

### How Data Consistency is Ensured

The most critical function is `create_sale()` in `routes/sales.py`. Here's how it maintains data integrity:

**1. Pre-validation before any writes**

```python
for item in sale.items:
    medicine = db.query(Medicine).filter(Medicine.id == item.medicine_id).first()
    if not medicine:
        raise HTTPException(404, f"Medicine with id {item.medicine_id} not found")
    if medicine.quantity < item.quantity:
        raise HTTPException(400, f"Insufficient stock for {medicine.name}")
    if medicine.status == "expired":
        raise HTTPException(400, f"Cannot sell expired medicine: {medicine.name}")
```

The function loops through **all** items first and validates stock availability and expiry status. If any single item fails, the entire request is rejected — no partial sales happen.

**2. Atomic transaction**

All database writes (sale record + sale items + inventory deductions) happen within a single SQLAlchemy session. The `db.commit()` at the end applies everything at once. If any error occurs mid-process, SQLAlchemy's session rollback ensures nothing is partially written.

**3. Status cascading after deduction**

After deducting quantities, the function immediately checks and updates each medicine's status:

```python
medicine.quantity -= item_data["quantity"]

if medicine.quantity == 0:
    medicine.status = "out_of_stock"
elif medicine.quantity <= LOW_STOCK_THRESHOLD:  # threshold = 50
    medicine.status = "low_stock"
```

This means the inventory status is always in sync with the actual stock count — there's no delay or separate cron job needed.

**4. Startup reconciliation**

On every server startup, `refresh_medicine_statuses()` in `services/inventory.py` scans all medicines and corrects any status inconsistencies based on current quantity and expiry date. This acts as a safety net in case the database was directly modified or if date-based expiry needs to be re-evaluated:

```python
for med in medicines:
    if med.quantity == 0:
        med.status = "out_of_stock"
    elif med.expiry_date <= today:
        med.status = "expired"
    elif med.quantity <= LOW_STOCK_THRESHOLD:
        med.status = "low_stock"
    else:
        med.status = "active"
```

### Status Detection Rules

| Status       | Condition                          |
|-------------|-------------------------------------|
| Active      | Quantity > 50 and not expired       |
| Low Stock   | 0 < Quantity ≤ 50                   |
| Expired     | Expiry date ≤ today                 |
| Out of Stock| Quantity = 0                        |

### Architecture Overview

- **Frontend** → Axios → Vite dev proxy → **FastAPI backend**
- **Backend** → SQLAlchemy ORM → **PostgreSQL** (managed via Render)
- **Seeding** happens automatically on first startup if tables are empty
- All API responses use Pydantic models with `from_attributes = True` for ORM compatibility
## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Connect repository on [vercel.com](https://vercel.com)
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add env variable: `VITE_API_URL=https://your-backend-url.onrender.com/api`

### Backend → Render

1. Push to GitHub
2. Create a **PostgreSQL** database on [render.com](https://render.com) (free tier available)
3. Copy the **Internal Database URL** from the Render PostgreSQL dashboard
4. Create a new **Web Service** on Render
5. Set build command: `pip install -r requirements.txt`
6. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add environment variables:
   - `DATABASE_URL` → paste the Internal Database URL from step 3
   - `CORS_ORIGINS=https://your-frontend.vercel.app`

> **Note:** Render provides the URL in `postgres://` format. The app automatically converts this to `postgresql://` for SQLAlchemy compatibility.

---

## License

This project was built as part of the SwasthiQ hiring assignment.
