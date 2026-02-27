import React from 'react';
import { Download, Plus } from 'lucide-react';

interface HeaderProps {
    onAddMedicine: () => void;
    onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddMedicine, onExport }) => {
    return (
        <div className="page-header">
            <div>
                <h1>Pharmacy CRM</h1>
                <p>Manage inventory, sales, and purchase orders</p>
            </div>
            <div className="header-actions">
                <button className="btn" onClick={onExport}>
                    <Download size={14} />
                    Export
                </button>
                <button className="btn btn-primary" onClick={onAddMedicine}>
                    <Plus size={14} />
                    Add Medicine
                </button>
            </div>
        </div>
    );
};

export default Header;
