import React from 'react';
import { Medicine } from '../types';
import StatusBadge from './StatusBadge';

interface InventoryTableProps {
    medicines: Medicine[];
    loading?: boolean;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ medicines, loading }) => {
    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                Loading inventory...
            </div>
        );
    }

    if (medicines.length === 0) {
        return (
            <div className="empty-state">
                <p>No medicines found in inventory</p>
            </div>
        );
    }

    return (
        <table className="inventory-table">
            <thead>
                <tr>
                    <th>Medicine Name</th>
                    <th>Generic Name</th>
                    <th>Category</th>
                    <th>Batch No</th>
                    <th>Expiry Date</th>
                    <th>Quantity</th>
                    <th>Cost Price</th>
                    <th>MRP</th>
                    <th>Supplier</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {medicines.map((med) => (
                    <tr key={med.id}>
                        <td>{med.name}</td>
                        <td>{med.generic_name}</td>
                        <td>{med.category}</td>
                        <td>{med.batch_no}</td>
                        <td>{med.expiry_date}</td>
                        <td className={med.quantity <= 50 && med.quantity > 0 ? 'low-qty' : med.quantity === 0 ? 'low-qty' : ''}>
                            {med.quantity}
                        </td>
                        <td>₹{med.cost_price.toFixed(2)}</td>
                        <td>₹{med.mrp.toFixed(2)}</td>
                        <td>{med.supplier}</td>
                        <td>
                            <StatusBadge status={med.status} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default InventoryTable;
