import React, { useState, useRef } from 'react';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AddMedicineModal from './components/AddMedicineModal';
import { createMedicine, getMedicines } from './services/api';
import { MedicineCreate, Medicine } from './types';

const App: React.FC = () => {
    const [activePage, setActivePage] = useState<'dashboard' | 'inventory'>('dashboard');
    const [showAddModal, setShowAddModal] = useState(false);
    const inventoryRef = useRef<{ triggerExport: () => void }>(null);
    const dashboardRef = useRef<{ triggerExport: () => void }>(null);

    const handleAddMedicine = async (medicine: MedicineCreate) => {
        await createMedicine(medicine);
    };

    const handleExport = () => {
        if (activePage === 'dashboard') {
            dashboardRef.current?.triggerExport();
        } else {
            inventoryRef.current?.triggerExport();
        }
    };

    const switchToInventory = () => {
        setActivePage('inventory');
    };

    const switchToDashboard = () => {
        setActivePage('dashboard');
    };

    return (
        <div className="app-layout">
            <div className="main-content">
                <Header
                    onAddMedicine={() => setShowAddModal(true)}
                    onExport={handleExport}
                />

                {activePage === 'dashboard' ? (
                    <Dashboard ref={dashboardRef} onSwitchToInventory={switchToInventory} />
                ) : (
                    <Inventory
                        ref={inventoryRef}
                        onAddMedicine={() => setShowAddModal(true)}
                        onSwitchToDashboard={switchToDashboard}
                    />
                )}
            </div>

            <AddMedicineModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleAddMedicine}
            />
        </div>
    );
};

export default App;
