import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MedicineCreate } from '../types';

interface AddMedicineModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (medicine: MedicineCreate) => Promise<void>;
}

const CATEGORIES = [
    'Analgesic', 'Antibiotic', 'Antidiabetic', 'Antihistamine',
    'Anticoagulant', 'Cardiovascular', 'Gastric', 'Respiratory',
    'Dermatology', 'Other'
];

const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState<MedicineCreate>({
        name: '',
        generic_name: '',
        category: 'Analgesic',
        batch_no: '',
        expiry_date: '',
        quantity: 0,
        cost_price: 0,
        mrp: 0,
        supplier: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!formData.name || !formData.generic_name || !formData.batch_no || !formData.supplier) {
            setError('Please fill in all required fields');
            return;
        }
        if (!formData.expiry_date) {
            setError('Please set an expiry date');
            return;
        }
        if (formData.mrp < formData.cost_price) {
            setError('MRP must be greater than or equal to cost price');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(formData);
            // Reset form
            setFormData({
                name: '', generic_name: '', category: 'Analgesic', batch_no: '',
                expiry_date: '', quantity: 0, cost_price: 0, mrp: 0, supplier: '',
            });
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to add medicine');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Medicine</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div style={{
                                color: '#ef4444', background: '#fee2e2', padding: '10px 14px',
                                borderRadius: '6px', fontSize: '13px', marginBottom: '16px'
                            }}>
                                {error}
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label>Medicine Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Paracetamol 650mg"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Generic Name *</label>
                                <input
                                    type="text"
                                    name="generic_name"
                                    value={formData.generic_name}
                                    onChange={handleChange}
                                    placeholder="e.g. Acetaminophen"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Category *</label>
                                <select name="category" value={formData.category} onChange={handleChange}>
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Batch Number *</label>
                                <input
                                    type="text"
                                    name="batch_no"
                                    value={formData.batch_no}
                                    onChange={handleChange}
                                    placeholder="e.g. PCM-2024-0892"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Expiry Date *</label>
                                <input
                                    type="date"
                                    name="expiry_date"
                                    value={formData.expiry_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Quantity *</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Cost Price (₹) *</label>
                                <input
                                    type="number"
                                    name="cost_price"
                                    value={formData.cost_price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>MRP (₹) *</label>
                                <input
                                    type="number"
                                    name="mrp"
                                    value={formData.mrp}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Supplier *</label>
                            <input
                                type="text"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange}
                                placeholder="e.g. MedSupply Co."
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Adding...' : 'Add Medicine'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMedicineModal;
