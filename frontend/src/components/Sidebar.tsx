import React from 'react';
import {
    Search, LayoutGrid, Menu, Activity, Calendar,
    Users, Clock, Link2, Plus, Sparkles, Settings
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const topIcons = [
        { id: 'search', icon: <Search size={18} />, label: 'Search' },
        { id: 'dashboard', icon: <LayoutGrid size={18} />, label: 'Dashboard' },
        { id: 'menu', icon: <Menu size={18} />, label: 'Menu' },
        { id: 'activity', icon: <Activity size={18} />, label: 'Activity' },
        { id: 'calendar', icon: <Calendar size={18} />, label: 'Calendar' },
        { id: 'users', icon: <Users size={18} />, label: 'Users' },
        { id: 'clock', icon: <Clock size={18} />, label: 'Clock' },
        { id: 'link', icon: <Link2 size={18} />, label: 'Links' },
        { id: 'add', icon: <Plus size={18} />, label: 'Add' },
        { id: 'ai', icon: <Sparkles size={18} />, label: 'AI' },
    ];

    return (
        <nav className="sidebar">
            {topIcons.map((item) => (
                <button
                    key={item.id}
                    className={`sidebar-icon ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => onTabChange(item.id)}
                    title={item.label}
                >
                    {item.icon}
                </button>
            ))}
            <div className="sidebar-bottom">
                <button className="sidebar-icon" title="Settings">
                    <Settings size={18} />
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;
