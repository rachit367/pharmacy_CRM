import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
    DollarSign, ShoppingCart, AlertTriangle, RefreshCw,
    Plus, Filter, Download, Package, CheckCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import InventoryTable from '../components/InventoryTable';
import {
    getDashboardSummary, getMedicines, getInventoryOverview
} from '../services/api';
import { DashboardSummary, Medicine, InventoryOverview } from '../types';

interface InventoryProps {
    onAddMedicine: () => void;
    onSwitchToDashboard: () => void;
}

const Inventory = forwardRef<{ triggerExport: () => void }, InventoryProps>(({ onAddMedicine, onSwitchToDashboard }, ref) => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [overview, setOverview] = useState<InventoryOverview | null>(null);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        loadInventory();
    }, [filterStatus]);

    const loadInventory = async () => {
        setLoading(true);
        setError('');
        try {
            const [summaryData, overviewData, medsData] = await Promise.all([
                getDashboardSummary(),
                getInventoryOverview(),
                getMedicines(filterStatus || undefined),
            ]);
            setSummary(summaryData);
            setOverview(overviewData);
            setMedicines(medsData);
        } catch (err) {
            setError('Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Build CSV from medicines data
        if (medicines.length === 0) return;
        const headers = ['Name', 'Generic Name', 'Category', 'Batch No', 'Expiry Date', 'Quantity', 'Cost Price', 'MRP', 'Supplier', 'Status'];
        const rows = medicines.map(m =>
            [m.name, m.generic_name, m.category, m.batch_no, m.expiry_date, m.quantity, m.cost_price, m.mrp, m.supplier, m.status].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'inventory.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    useImperativeHandle(ref, () => ({
        triggerExport: handleExport,
    }));

    if (error) {
        return (
            <div className="error-container">
                <AlertTriangle size={24} />
                <p>{error}</p>
                <button onClick={loadInventory}>Retry</button>
            </div>
        );
    }

    return (
        <>
            {/* Top stat cards - same as dashboard */}
            <div className="stat-cards">
                <StatCard
                    icon={<DollarSign size={20} />}
                    iconClass="sales"
                    value={`₹${(summary?.todays_sales || 0).toLocaleString('en-IN')}`}
                    label="Today's Sales"
                    badge={summary?.sales_growth ? `↗ +${summary.sales_growth}%` : undefined}
                    badgeClass="growth"
                />
                <StatCard
                    icon={<ShoppingCart size={20} />}
                    iconClass="items"
                    value={String(summary?.items_sold_today || 0)}
                    label="Items Sold Today"
                    badge={`${summary?.total_orders || 0} Orders`}
                    badgeClass="orders"
                />
                <StatCard
                    icon={<AlertTriangle size={20} />}
                    iconClass="low-stock"
                    value={String(summary?.low_stock_count || 0)}
                    label="Low Stock Items"
                    badge="Action Needed"
                    badgeClass="action"
                />
                <StatCard
                    icon={<RefreshCw size={20} />}
                    iconClass="purchase"
                    value={`₹${(summary?.purchase_order_total || 0).toLocaleString('en-IN')}`}
                    label="Purchase Orders"
                    badge={`${summary?.pending_orders || 0} Pending`}
                    badgeClass="pending"
                />
            </div>

            {/* Tab section with Inventory active */}
            <div className="tab-section">
                <div className="tab-header">
                    <div className="tab-nav">
                        <button className="tab-btn" onClick={onSwitchToDashboard}>
                            <ShoppingCart size={14} /> Sales
                        </button>
                        <button className="tab-btn" onClick={onSwitchToDashboard}>
                            <RefreshCw size={14} /> Purchase
                        </button>
                        <button className="tab-btn active">
                            <Package size={14} /> Inventory
                        </button>
                    </div>
                    <div className="tab-actions">
                        <button className="btn btn-sm">
                            <Plus size={14} /> New Sale
                        </button>
                        <button className="btn btn-sm">
                            <Plus size={14} /> New Purchase
                        </button>
                    </div>
                </div>

                <div className="tab-body">
                    {/* Inventory Overview Cards */}
                    <div style={{ marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                            Inventory Overview
                        </h3>
                    </div>
                    <div className="inventory-overview">
                        <div className="overview-card">
                            <div className="overview-card-header">
                                <span className="overview-card-label">Total Items</span>
                                <span className="overview-card-icon green"><Package size={16} /></span>
                            </div>
                            <div className="overview-card-value">{overview?.total_items || 0}</div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-card-header">
                                <span className="overview-card-label">Active Stock</span>
                                <span className="overview-card-icon green"><CheckCircle size={16} /></span>
                            </div>
                            <div className="overview-card-value">{overview?.active_stock || 0}</div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-card-header">
                                <span className="overview-card-label">Low Stock</span>
                                <span className="overview-card-icon yellow"><AlertTriangle size={16} /></span>
                            </div>
                            <div className="overview-card-value">{overview?.low_stock || 0}</div>
                        </div>
                        <div className="overview-card">
                            <div className="overview-card-header">
                                <span className="overview-card-label">Total Value</span>
                                <span className="overview-card-icon blue"><DollarSign size={16} /></span>
                            </div>
                            <div className="overview-card-value">₹{(overview?.total_value || 0).toLocaleString('en-IN')}</div>
                        </div>
                    </div>

                    {/* Complete Inventory */}
                    <div className="inventory-section-header">
                        <h3>Complete Inventory</h3>
                        <div className="inventory-actions">
                            <select
                                className="btn btn-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ cursor: 'pointer' }}
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="low_stock">Low Stock</option>
                                <option value="expired">Expired</option>
                                <option value="out_of_stock">Out of Stock</option>
                            </select>
                            <button className="btn btn-sm" onClick={handleExport}>
                                <Download size={14} /> Export
                            </button>
                        </div>
                    </div>

                    <InventoryTable medicines={medicines} loading={loading} />
                </div>
            </div>
        </>
    );
});

export default Inventory;
