import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Sale } from '../types';
import StatusBadge from './StatusBadge';

interface SalesListProps {
    sales: Sale[];
    loading?: boolean;
}

const SalesList: React.FC<SalesListProps> = ({ sales, loading }) => {
    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                Loading sales...
            </div>
        );
    }

    if (sales.length === 0) {
        return (
            <div className="empty-state">
                <p>No recent sales found</p>
            </div>
        );
    }

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toISOString().split('T')[0];
    };

    return (
        <div className="recent-sales">
            <h3>Recent Sales</h3>
            {sales.map((sale) => (
                <div key={sale.id} className="sale-item">
                    <div className="sale-item-icon">
                        <ShoppingCart size={16} />
                    </div>
                    <div className="sale-item-info">
                        <div className="sale-item-invoice">{sale.invoice_no}</div>
                        <div className="sale-item-details">
                            {sale.patient_name} • {sale.items_count} items • {sale.payment_mode}
                        </div>
                    </div>
                    <div className="sale-item-right">
                        <div className="sale-item-amount">₹{sale.total_amount.toLocaleString()}</div>
                        <div className="sale-item-date">{formatDate(sale.created_at)}</div>
                    </div>
                    <div className="sale-item-status">
                        <StatusBadge status={sale.status} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SalesList;
