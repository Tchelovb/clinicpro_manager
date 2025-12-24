import React, { ReactNode } from 'react';
import { LucideIcon, ChevronRight, Search } from 'lucide-react';

interface SettingsItem {
    key: string;
    label: string;
    icon: LucideIcon;
}

interface SettingsGroup {
    title?: string;
    items: SettingsItem[];
}

interface ModernSettingsLayoutProps {
    groups: SettingsGroup[];
    activeKey: string;
    onSelect: (key: string) => void;
    children: ReactNode;
    activeLabel?: string;
}

export const ModernSettingsLayout: React.FC<ModernSettingsLayoutProps> = ({
    groups,
    activeKey,
    onSelect,
    children,
    activeLabel
}) => {
    return (
        <div className="flex h-screen bg-[#09090b] text-slate-200 overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-[260px] flex-shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col">
                {/* Header / Brand */}
                <div className="h-14 flex items-center px-4 border-b border-slate-800/50">
                    <div className="flex items-center gap-2 font-semibold text-slate-100">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold">CP</div>
                        <span>ClinicPro</span>
                    </div>
                </div>

                {/* Search (Visual Only for now) */}
                <div className="p-3">
                    <button className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-slate-500 text-sm hover:border-slate-700 hover:text-slate-400 transition-colors">
                        <Search size={14} />
                        <span>Buscar configurações...</span>
                        <span className="ml-auto text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">⌘K</span>
                    </button>
                </div>

                {/* Navigation Groups */}
                <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
                    {groups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {group.title && (
                                <div className="px-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    {group.title}
                                </div>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = activeKey === item.key;
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => onSelect(item.key)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group ${isActive
                                                    ? 'bg-blue-600/10 text-blue-400'
                                                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                                }`}
                                        >
                                            <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User / Footer */}
                <div className="p-4 border-t border-slate-800 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 border border-slate-700 shadow-inner"></div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-200">Dr. Marcelo</span>
                            <span className="text-xs text-slate-500">Admin</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
                {/* Breadcrumb Header */}
                <header className="h-14 flex items-center justify-between px-8 border-b border-slate-800/50 bg-[#09090b]/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="hover:text-slate-300 cursor-pointer transition-colors">Configurações</span>
                        <ChevronRight size={14} />
                        <span className="text-slate-200 font-medium">{activeLabel || 'Geral'}</span>
                    </div>
                </header>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-8">
                    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
