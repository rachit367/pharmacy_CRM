import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
    DollarSign, ShoppingCart, AlertTriangle, RefreshCw,
    TrendingUp, Plus, Search, X
} from 'lucide-react';
import StatCard from '../components/StatCard';
import SalesList from '../components/SalesList';
import {
    getDashboardSummary, getRecentSales, searchMedicines, createSale
} from '../services/api';
import { DashboardSummary, Sale, Medicine, SaleItemCreate } from '../types';
import StatusBadge from '../components/StatusBadge';

interface DashboardProps {
    onSwitchToInventory: () => void;
}

interface CartItem {
    medicine: Medicine;
    quantity: number;
}

const Dashboard = forwardRef<{ triggerExport: () => void }, DashboardProps>(({ onSwitchToInventory }, ref) => {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [recentSales, setRecentSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeSubTab, setActiveSubTab] = useState('sales');

    // Make a Sale state
    const [patientName, setPatientName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Medicine[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [saleLoading, setSaleLoading] = useState(false);
    const [saleMessage, setSaleMessage] = useState('');
    const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'UPI'>('Cash');
    const searchRef = useRef<HTMLDivElement>(null);
    const patientInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        setError('');
        try {
            const [summaryData, salesData] = await Promise.all([
                getDashboardSummary(),
                getRecentSales(),
            ]);
            setSummary(summaryData);
            setRecentSales(salesData);
        } catch (err) {
            setError('Failed to load dashboard data. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    // Export sales as CSV
    const handleExportSales = () => {
        if (recentSales.length === 0) return;
        const headers = ['Invoice No', 'Patient Name', 'Items Count', 'Total Amount', 'Payment Mode', 'Status', 'Date'];
        const rows = recentSales.map(s =>
            [s.invoice_no, s.patient_name, s.items_count, s.total_amount, s.payment_mode, s.status, s.created_at].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sales_report.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    useImperativeHandle(ref, () => ({
        triggerExport: handleExportSales,
    }));

    // Search medicines for sale
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            try {
                const results = await searchMedicines(query);
                setSearchResults(results.filter(m => m.status !== 'expired' && m.status !== 'out_of_stock'));
                setShowDropdown(true);
            } catch {
                setSearchResults([]);
            }
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    const addToCart = (medicine: Medicine) => {
        const existing = cart.find(item => item.medicine.id === medicine.id);
        if (existing) {
            setCart(cart.map(item =>
                item.medicine.id === medicine.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { medicine, quantity: 1 }]);
        }
        setSearchQuery('');
        setShowDropdown(false);
    };

    const removeFromCart = (medicineId: number) => {
        setCart(cart.filter(item => item.medicine.id !== medicineId));
    };

    const updateCartQty = (medicineId: number, qty: number) => {
        if (qty <= 0) {
            removeFromCart(medicineId);
            return;
        }
        setCart(cart.map(item =>
            item.medicine.id === medicineId ? { ...item, quantity: qty } : item
        ));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.medicine.mrp * item.quantity, 0);

    const handleBill = async () => {
        if (!patientName.trim()) {
            setSaleMessage('Please enter a patient name');
            return;
        }
        if (cart.length === 0) {
            setSaleMessage('Please add medicines to the cart');
            return;
        }

        setSaleLoading(true);
        setSaleMessage('');
        try {
            const items: SaleItemCreate[] = cart.map(item => ({
                medicine_id: item.medicine.id,
                quantity: item.quantity,
            }));

            await createSale({
                patient_name: patientName.trim(),
                payment_mode: paymentMode,
                items,
            });

            setSaleMessage('Sale completed successfully!');
            setPatientName('');
            setCart([]);
            setPaymentMode('Cash');
            // Refresh dashboard
            loadDashboard();
        } catch (err: any) {
            setSaleMessage(err.response?.data?.detail || 'Failed to create sale');
        } finally {
            setSaleLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <AlertTriangle size={24} />
                <p>{error}</p>
                <button onClick={loadDashboard}>Retry</button>
            </div>
        );
    }

    return (
        <>
            {/* Stat Cards */}
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

            {/* Tab Section */}
            <div className="tab-section">
                <div className="tab-header">
                    <div className="tab-nav">
                        <button
                            className={`tab-btn ${activeSubTab === 'sales' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('sales')}
                        >
                            <ShoppingCart size={14} /> Sales
                        </button>
                        <button
                            className={`tab-btn ${activeSubTab === 'purchase' ? 'active' : ''}`}
                            onClick={() => setActiveSubTab('purchase')}
                        >
                            <RefreshCw size={14} /> Purchase
                        </button>
                        <button
                            className={`tab-btn ${activeSubTab === 'inventory' ? 'active' : ''}`}
                            onClick={() => { setActiveSubTab('inventory'); onSwitchToInventory(); }}
                        >
                            <Search size={14} /> Inventory
                        </button>
                    </div>
                    <div className="tab-actions">
                        <button className="btn btn-success btn-sm" onClick={() => {
                            setActiveSubTab('sales');
                            setPatientName('');
                            setCart([]);
                            setSaleMessage('');
                            setSearchQuery('');
                            setTimeout(() => patientInputRef.current?.focus(), 100);
                        }}>
                            <Plus size={14} /> New Sale
                        </button>
                        <button className="btn btn-sm">
                            <Plus size={14} /> New Purchase
                        </button>
                    </div>
                </div>

                <div className="tab-body">
                    {activeSubTab === 'sales' && (
                        <>
                            {/* Make a Sale */}
                            <div className="sale-section">
                                <h3>Make a Sale</h3>
                                <p>Select medicines from inventory</p>

                                <div className="sale-form">
                                    <input
                                        type="text"
                                        className="patient-input"
                                        placeholder="Patient Id"
                                        value={patientName}
                                        onChange={(e) => setPatientName(e.target.value)}
                                        ref={patientInputRef}
                                    />
                                    <div className="search-input" ref={searchRef} style={{ flex: 1, position: 'relative' }}>
                                        <span className="search-icon"><Search size={14} /></span>
                                        <input
                                            type="text"
                                            placeholder="Search medicines..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            style={{ width: '100%', paddingLeft: '36px' }}
                                        />
                                        {showDropdown && searchResults.length > 0 && (
                                            <div className="search-dropdown">
                                                {searchResults.map((med) => (
                                                    <div
                                                        key={med.id}
                                                        className="search-dropdown-item"
                                                        onClick={() => addToCart(med)}
                                                    >
                                                        <span className="med-name">{med.name}</span>
                                                        <span className="med-info">₹{med.mrp} • Qty: {med.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <select
                                        className="payment-input"
                                        value={paymentMode}
                                        onChange={(e) => setPaymentMode(e.target.value as 'Cash' | 'Card' | 'UPI')}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                    <button
                                        className="btn btn-orange"
                                        onClick={handleBill}
                                        disabled={saleLoading}
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        {saleLoading ? 'Processing...' : 'Bill'}
                                    </button>
                                </div>

                                {saleMessage && (
                                    <div style={{
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        marginBottom: '12px',
                                        background: saleMessage.includes('success') ? '#dcfce7' : '#fee2e2',
                                        color: saleMessage.includes('success') ? '#16a34a' : '#ef4444',
                                    }}>
                                        {saleMessage}
                                    </div>
                                )}

                                {/* Cart Table */}
                                <table className="cart-table">
                                    <thead>
                                        <tr>
                                            <th>Medicine Name</th>
                                            <th>Generic Name</th>
                                            <th>Batch No</th>
                                            <th>Expiry Date</th>
                                            <th>Quantity</th>
                                            <th>MRP / Price</th>
                                            <th>Supplier</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="cart-empty">
                                                    Search and add medicines to create a sale
                                                </td>
                                            </tr>
                                        ) : (
                                            cart.map((item) => (
                                                <tr key={item.medicine.id}>
                                                    <td>{item.medicine.name}</td>
                                                    <td>{item.medicine.generic_name}</td>
                                                    <td>{item.medicine.batch_no}</td>
                                                    <td>{item.medicine.expiry_date}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.medicine.quantity}
                                                            value={item.quantity}
                                                            onChange={(e) => updateCartQty(item.medicine.id, parseInt(e.target.value) || 1)}
                                                            style={{ width: '60px', padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '13px' }}
                                                        />
                                                    </td>
                                                    <td>₹{(item.medicine.mrp * item.quantity).toFixed(2)}</td>
                                                    <td>{item.medicine.supplier}</td>
                                                    <td><StatusBadge status={item.medicine.status} /></td>
                                                    <td>
                                                        <button
                                                            className="remove-btn"
                                                            onClick={() => removeFromCart(item.medicine.id)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {cart.length > 0 && (
                                    <div style={{
                                        textAlign: 'right', paddingTop: '12px',
                                        fontWeight: 600, fontSize: '15px'
                                    }}>
                                        Total: ₹{cartTotal.toFixed(2)}
                                    </div>
                                )}
                            </div>

                            {/* Recent Sales */}
                            <SalesList sales={recentSales} />
                        </>
                    )}
                </div>
            </div>
        </>
    );
});

export default Dashboard;
