// ── Medicine Types ─────────────────────────────────────────
export interface Medicine {
    id: number;
    name: string;
    generic_name: string;
    category: string;
    batch_no: string;
    expiry_date: string;
    quantity: number;
    cost_price: number;
    mrp: number;
    supplier: string;
    status: 'active' | 'low_stock' | 'expired' | 'out_of_stock';
    created_at: string;
}

export interface MedicineCreate {
    name: string;
    generic_name: string;
    category: string;
    batch_no: string;
    expiry_date: string;
    quantity: number;
    cost_price: number;
    mrp: number;
    supplier: string;
}

export interface MedicineUpdate {
    name?: string;
    generic_name?: string;
    category?: string;
    batch_no?: string;
    expiry_date?: string;
    quantity?: number;
    cost_price?: number;
    mrp?: number;
    supplier?: string;
}

// ── Sale Types ────────────────────────────────────────────
export interface Sale {
    id: number;
    invoice_no: string;
    patient_name: string;
    items_count: number;
    total_amount: number;
    payment_mode: string;
    status: string;
    created_at: string;
}

export interface SaleItemCreate {
    medicine_id: number;
    quantity: number;
}

export interface SaleCreate {
    patient_name: string;
    payment_mode: 'Cash' | 'Card' | 'UPI';
    items: SaleItemCreate[];
}

// ── Dashboard Types ───────────────────────────────────────
export interface DashboardSummary {
    todays_sales: number;
    items_sold_today: number;
    low_stock_count: number;
    purchase_order_total: number;
    pending_orders: number;
    total_orders: number;
    sales_growth: number;
}

export interface PurchaseSummary {
    id: number;
    supplier: string;
    total_amount: number;
    status: string;
    created_at: string;
}

// ── Inventory Overview ────────────────────────────────────
export interface InventoryOverview {
    total_items: number;
    active_stock: number;
    low_stock: number;
    total_value: number;
}
