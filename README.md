# Pharmacy CRM — Full-Stack EMR Pharmacy Module


## Tech Stack

| Layer     | Technology                             |
|-----------|----------------------------------------|
| Backend   | Python 3.10+, FastAPI, SQLAlchemy, SQLite |
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

## Business Logic

### Auto Status Detection
- **Active**: Quantity > 50 and not expired
- **Low Stock**: Quantity ≤ 50 and quantity > 0
- **Expired**: Expiry date ≤ today
- **Out of Stock**: Quantity = 0

### Data Consistency
- Sale creation validates stock availability before deducting
- Expired medicines cannot be sold
- Medicine status auto-updates after sales
- On startup, all medicine statuses are re-evaluated

---

## Architecture


- **Frontend** makes all data requests via Axios → Vite dev proxy → FastAPI.
- **Backend** uses SQLAlchemy ORM for all database operations with proper session management.
- **Seeding** happens automatically on first startup if tables are empty.



## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Connect repository on [vercel.com](https://vercel.com)
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add env variable: `VITE_API_URL=https://your-backend-url.onrender.com/api`

### Backend → Render

1. Push to GitHub
2. Create a new Web Service on [render.com](https://render.com)
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env variables:
   - `DATABASE_URL=sqlite:///./pharmacy.db`
   - `CORS_ORIGINS=https://your-frontend.vercel.app`

---

## License

This project was built as part of the SwasthiQ hiring assignment.
