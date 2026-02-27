import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    iconClass: string;
    value: string;
    label: string;
    badge?: string;
    badgeClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    icon,
    iconClass,
    value,
    label,
    badge,
    badgeClass,
}) => {
    return (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className={`stat-card-icon ${iconClass}`}>{icon}</div>
                {badge && (
                    <span className={`stat-badge ${badgeClass || ''}`}>{badge}</span>
                )}
            </div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
        </div>
    );
};

export default StatCard;
