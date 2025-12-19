import React, { useState } from 'react';
import { Shield, FileText, Lock } from 'lucide-react';
import AuditLogViewer from './AuditLogViewer';
import SessionSettings from './SessionSettings';

const SecuritySettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'audit' | 'session'>('session');

    const tabs = [
        { key: 'session' as const, label: 'Sessão & Segurança', icon: Lock },
        { key: 'audit' as const, label: 'Registro de Auditoria', icon: FileText },
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-2 px-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'session' && <SessionSettings />}
                {activeTab === 'audit' && <AuditLogViewer />}
            </div>
        </div>
    );
};

export default SecuritySettings;
