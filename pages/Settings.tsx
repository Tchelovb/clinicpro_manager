import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Settings as SettingsIcon,
    Building2,
    Wallet,
    Briefcase,
    Package,
    ClipboardList,
    Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Tabs Components
import ClinicSettings from '../components/settings/ClinicSettings';
import UsersSettings from '../components/settings/UsersSettings';
import ProfessionalsSettings from '../components/settings/ProfessionalsSettings';

import SalesCommissionManager from './settings/SalesCommissionManager';
import ProfessionalPaymentPanel from '../components/settings/ProfessionalPaymentPanel';
import SetupSecurityPin from '../components/SetupSecurityPin';

import { CostWizardSheet } from '../components/settings/CostWizardSheet';

// Missing Imports
import CategoriesManager from '../components/settings/CategoriesManager';
import BankAccountsManager from '../components/settings/BankAccountsManager';
import CardMachineConfig from '../components/settings/CardMachineConfig';
import TaxConfiguration from '../components/settings/TaxConfiguration';
import PriceTablesSettings from '../components/settings/PriceTablesSettings';
import ProceduresManager from '../components/settings/ProceduresManager';
import { AIIntegrationsSettings } from '../src/components/settings/AIIntegrationsSettings';
import FinancialRulesSettings from '../components/settings/financial-rules/FinancialRulesSettings';
import { TeamManagement } from '../components/TeamManagement';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'foundation' | 'financial' | 'commercial' | 'stock' | 'clinical' | 'integrations'>('foundation');
    const [subTab, setSubTab] = useState<string>('clinic');
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Reset subtab when main tab changes
    useEffect(() => {
        switch (activeTab) {
            case 'foundation': setSubTab('clinic'); break;
            case 'financial': setSubTab('rules'); break;
            case 'commercial': setSubTab('pricetables'); break;
            case 'stock': setSubTab('inventory'); break;
            case 'clinical': setSubTab('templates'); break;
            case 'integrations': setSubTab('api'); break;
        }
    }, [activeTab]);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <SettingsIcon className="text-violet-600" size={24} />
                        Configurações
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">Painel de Controle</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <NavItem
                        active={activeTab === 'foundation'}
                        onClick={() => setActiveTab('foundation')}
                        icon={Building2}
                        label="Fundação"
                        description="Clínica, Usuários e Profissionais"
                    />
                    <NavItem
                        active={activeTab === 'financial'}
                        onClick={() => setActiveTab('financial')}
                        icon={Wallet}
                        label="Financeiro"
                        description="Contas, Taxas e Impostos"
                    />
                    <NavItem
                        active={activeTab === 'commercial'}
                        onClick={() => setActiveTab('commercial')}
                        icon={Briefcase}
                        label="Comercial"
                        description="Tabelas de Preço e Procedimentos"
                    />
                    <NavItem
                        active={activeTab === 'stock'}
                        onClick={() => setActiveTab('stock')}
                        icon={Package}
                        label="Estoque"
                        description="Insumos e Movimentações"
                    />
                    <NavItem
                        active={activeTab === 'clinical'}
                        onClick={() => setActiveTab('clinical')}
                        icon={ClipboardList}
                        label="Clínico"
                        description="Prontuários e Documentos"
                    />
                    <NavItem
                        active={activeTab === 'integrations'}
                        onClick={() => setActiveTab('integrations')}
                        icon={Zap}
                        label="Integrações"
                        description="APIs e Webhooks"
                    />
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {/* Header with Subtabs */}
                <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-4">
                    <div className="flex items-center gap-4 overflow-x-auto pb-1 hide-scrollbar">
                        {activeTab === 'foundation' && (
                            <>
                                <SubTab active={subTab === 'clinic'} onClick={() => setSubTab('clinic')} label="Minha Clínica" />
                                <SubTab active={subTab === 'users'} onClick={() => setSubTab('users')} label="Usuários" />
                                <SubTab active={subTab === 'professionals'} onClick={() => setSubTab('professionals')} label="Profissionais" />
                                <SubTab active={subTab === 'security'} onClick={() => setSubTab('security')} label="Segurança & PIN" />
                            </>
                        )}
                        {activeTab === 'financial' && (
                            <>
                                <SubTab active={subTab === 'rules'} onClick={() => setSubTab('rules')} label="Regras Avançadas" />
                                <SubTab active={subTab === 'categories'} onClick={() => setSubTab('categories')} label="Planos de Contas" />
                                <SubTab active={subTab === 'banks'} onClick={() => setSubTab('banks')} label="Contas Bancárias" />
                                <SubTab active={subTab === 'cards'} onClick={() => setSubTab('cards')} label="Maquininhas & Taxas" />
                                <SubTab active={subTab === 'taxes'} onClick={() => setSubTab('taxes')} label="Impostos" />
                                <SubTab active={subTab === 'commissions'} onClick={() => setSubTab('commissions')} label="Comissões de Venda" />
                                <SubTab active={subTab === 'payouts'} onClick={() => setSubTab('payouts')} label="Repasses Clínicos" />
                                <SubTab active={isWizardOpen} onClick={() => setSubTab('wizard')} label="Wizard de Custos" highlight />
                            </>
                        )}
                        {activeTab === 'commercial' && (
                            <>
                                <SubTab active={subTab === 'pricetables'} onClick={() => setSubTab('pricetables')} label="Tabelas de Preço" />
                                <SubTab active={subTab === 'procedures'} onClick={() => setSubTab('procedures')} label="Procedimentos" />
                            </>
                        )}
                        {activeTab === 'stock' && (
                            <>
                                <SubTab active={subTab === 'inventory'} onClick={() => setSubTab('inventory')} label="Itens de Estoque" />
                                <SubTab active={subTab === 'suppliers'} onClick={() => setSubTab('suppliers')} label="Fornecedores" />
                            </>
                        )}
                        {activeTab === 'clinical' && (
                            <>
                                <SubTab active={subTab === 'templates'} onClick={() => setSubTab('templates')} label="Templates de Anamnese" />
                                <SubTab active={subTab === 'documents'} onClick={() => setSubTab('documents')} label="Modelos de Documentos" />
                            </>
                        )}
                    </div>
                </header>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-6xl mx-auto space-y-6">

                        {/* FOUNDATION TAB */}
                        {activeTab === 'foundation' && subTab === 'clinic' && <ClinicSettings />}
                        {activeTab === 'foundation' && subTab === 'users' && <TeamManagement />}
                        {activeTab === 'foundation' && subTab === 'professionals' && <ProfessionalsSettings />}
                        {activeTab === 'foundation' && subTab === 'security' && <SetupSecurityPin />}

                        {/* FINANCIAL TAB */}
                        {activeTab === 'financial' && subTab === 'rules' && <FinancialRulesSettings />}
                        {activeTab === 'financial' && subTab === 'categories' && <CategoriesManager />}
                        {activeTab === 'financial' && subTab === 'banks' && <BankAccountsManager />}
                        {activeTab === 'financial' && subTab === 'cards' && <CardMachineConfig />}
                        {activeTab === 'financial' && subTab === 'taxes' && <TaxConfiguration />}
                        {activeTab === 'financial' && subTab === 'commissions' && <SalesCommissionManager />}
                        {activeTab === 'financial' && subTab === 'payouts' && <ProfessionalPaymentPanel />}

                        {/* COMMERCIAL TAB */}
                        {activeTab === 'commercial' && subTab === 'pricetables' && <PriceTablesSettings />}
                        {activeTab === 'commercial' && subTab === 'procedures' && <ProceduresManager />}

                        {/* STOCK TAB */}
                        {activeTab === 'stock' && subTab === 'inventory' && (
                            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                                <Package size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">Gestão de Estoque</h3>
                                <p className="text-slate-500">O módulo de estoque está em desenvolvimento.</p>
                            </div>
                        )}
                        {activeTab === 'stock' && subTab === 'suppliers' && <div className="text-center py-12"><p className="text-slate-500">Gerenciamento de Fornecedores aqui.</p></div>}


                        {/* CLINICAL TAB */}
                        {activeTab === 'clinical' && (
                            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                                <ClipboardList size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">Configurações Clínicas</h3>
                                <p className="text-slate-500">Gerenciamento de templates e documentos em breve.</p>
                            </div>
                        )}

                        {/* INTEGRATIONS TAB */}
                        {activeTab === 'integrations' && (
                            <AIIntegrationsSettings />
                        )}

                    </div>
                </div>
            </main>

            <CostWizardSheet
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
                clinicId={profile?.clinic_id || ''}
            />
        </div>
    );
};

// Subcomponents for styling
const NavItem = ({ active, onClick, icon: Icon, label, description }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group ${active
            ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 shadow-sm ring-1 ring-violet-200 dark:ring-violet-700'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
    >
        <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-white dark:bg-slate-800 text-violet-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 group-hover:text-slate-700'}`}>
            <Icon size={20} />
        </div>
        <div>
            <span className="block font-semibold text-sm">{label}</span>
            <span className="block text-xs opacity-70 truncate max-w-[140px]">{description}</span>
        </div>
    </button>
);

const SubTab = ({ active, onClick, label, highlight }: any) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
            : highlight
                ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
    >
        {label}
    </button>
);

export default Settings;
