import axios from 'axios';
import {
    Medicine,
    MedicineCreate,
    MedicineUpdate,
    Sale,
    SaleCreate,
    DashboardSummary,
    PurchaseSummary,
    InventoryOverview,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ── Dashboard APIs ────────────────────────────────────────

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
    const { data } = await api.get('/dashboard/summary');
    return data;
};

export const getRecentSales = async (limit = 10): Promise<Sale[]> => {
    const { data } = await api.get(`/dashboard/recent-sales?limit=${limit}`);
    return data;
};

export const getLowStockMedicines = async (): Promise<Medicine[]> => {
    const { data } = await api.get('/dashboard/low-stock');
    return data;
};

export const getPurchaseSummary = async (): Promise<PurchaseSummary[]> => {
    const { data } = await api.get('/dashboard/purchase-summary');
    return data;
};

// ── Medicines (Inventory) APIs ────────────────────────────

export const getInventoryOverview = async (): Promise<InventoryOverview> => {
    const { data } = await api.get('/medicines/overview');
    return data;
};

export const getMedicines = async (
    status?: string,
    category?: string
): Promise<Medicine[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (category) params.append('category', category);
    const { data } = await api.get(`/medicines?${params.toString()}`);
    return data;
};

export const searchMedicines = async (query: string): Promise<Medicine[]> => {
    const { data } = await api.get(`/medicines/search?query=${encodeURIComponent(query)}`);
    return data;
};

export const getMedicine = async (id: number): Promise<Medicine> => {
    const { data } = await api.get(`/medicines/${id}`);
    return data;
};

export const createMedicine = async (medicine: MedicineCreate): Promise<Medicine> => {
    const { data } = await api.post('/medicines', medicine);
    return data;
};

export const updateMedicine = async (
    id: number,
    medicine: MedicineUpdate
): Promise<Medicine> => {
    const { data } = await api.put(`/medicines/${id}`, medicine);
    return data;
};

export const updateMedicineStatus = async (
    id: number,
    status: string
): Promise<Medicine> => {
    const { data } = await api.patch(`/medicines/${id}/status`, { status });
    return data;
};

export const deleteMedicine = async (id: number): Promise<void> => {
    await api.delete(`/medicines/${id}`);
};

// ── Sales APIs ────────────────────────────────────────────

export const createSale = async (sale: SaleCreate): Promise<Sale> => {
    const { data } = await api.post('/sales', sale);
    return data;
};

export const getSales = async (): Promise<Sale[]> => {
    const { data } = await api.get('/sales');
    return data;
};

export default api;
