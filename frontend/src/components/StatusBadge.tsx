import React from 'react';

interface StatusBadgeProps {
    status: string;
}

const STATUS_LABELS: Record<string, string> = {
    active: 'Active',
    low_stock: 'Low Stock',
    expired: 'Expired',
    out_of_stock: 'Out of Stock',
    Completed: 'Completed',
    Pending: 'Pending',
    Cancelled: 'Cancelled',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const label = STATUS_LABELS[status] || status;
    const className = status.toLowerCase().replace(' ', '_');

    return (
        <span className={`status-badge ${className}`}>
            {label}
        </span>
    );
};

export default StatusBadge;
