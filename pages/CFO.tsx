import React from 'react';
import { CFODashboard } from '../components/cfo/CFODashboard';
import { MobileTabBar } from '../components/ui/MobileTabBar';

const CFO: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <CFODashboard />
            <MobileTabBar />
        </div>
    );
};

export default CFO;
