import React from 'react';
import { ReceivablesKanban } from '../components/receivables/ReceivablesKanban';

const Receivables: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            <ReceivablesKanban />
        </div>
    );
};

export default Receivables;
