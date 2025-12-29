import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Settings as SettingsIcon,
    Building2,
    Wallet,
    Briefcase,
    Package,
    ClipboardList,
    Zap,
    Users,
    UserCircle,
    ChevronLeft,
    Shield,
    CreditCard,
    FileText,
    Percent,
    ArrowRightLeft,
    Calculator,
    Landmark,
    Database,
    Calendar,
    Heart,
    GitBranch
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'; // Shadcn Tabs

// Settings Components
import ClinicSettings from '../components/settings/ClinicSettings';
import ProfessionalsSettings from '../components/settings/ProfessionalsSettings';
import SalesCommissionManager from './settings/SalesCommissionManager';
import ProfessionalPaymentPanel from '../components/settings/ProfessionalPaymentPanel';
import { CostWizardSheet } from '../components/settings/CostWizardSheet';

// Missing Imports (assuming these exist based on previous file)
import CategoriesManager from '../components/settings/CategoriesManager';
import BankAccountsManager from '../components/settings/BankAccountsManager';
import CardMachineConfig from '../components/settings/CardMachineConfig';
import TaxConfiguration from '../components/settings/TaxConfiguration';
import PriceTablesSettings from '../components/settings/PriceTablesSettings';
import ProceduresManager from '../components/settings/ProceduresManager';
import { AIIntegrationsSettings } from '../src/components/settings/AIIntegrationsSettings';
import FinancialRulesSettings from '../components/settings/financial-rules/FinancialRulesSettings';
import { Team } from './settings/Team';
import LeadSourcesManager from '../components/settings/LeadSourcesManager';
import AppointmentTypesManager from '../components/settings/AppointmentTypesManager';
import SecurityPINSettings from '../components/settings/SecurityPINSettings';
import SuppliersManager from '../components/settings/SuppliersManager';
import InsurancePlansSettings from '../components/settings/InsurancePlansSettings';
import AuditLogsViewer from '../components/settings/AuditLogsViewer';
import ClinicalTemplatesManager from '../components/settings/ClinicalTemplatesManager';
import CRMPipelineManager from '../components/settings/CRMPipelineManager';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    // UI States
    const [activeTab, setActiveTab] = useState('foundation'); // Tracks main tab for sub-state resets
    const [foundationView, setFoundationView] = useState<'menu' | 'clinic' | 'users' | 'professionals' | 'security' | 'audit'>('menu');
    const [financialView, setFinancialView] = useState('rules');
    const [commercialView, setCommercialView] = useState('pricetables');
    const [crmView, setCrmView] = useState('leadsources');
    const [clinicalView, setClinicalView] = useState('appointmenttypes');
    const [stockView, setStockView] = useState('suppliers');
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Reset inner states when changing main tabs
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (value === 'foundation') setFoundationView('menu');
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* 1. HEADER FIXO */}
            <header className="flex-none bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <SettingsIcon className="text-slate-800 dark:text-slate-200" size={26} />
                            Configurações do Sistema
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Painel de Controle • Gerencie todos os aspectos da sua clínica
                        </p>
                    </div>
                </div>
            </header>

            {/* 2. BARRA DE ABAS (TABS) */}
            <Tabs
                defaultValue="foundation"
                value={activeTab}
                onValueChange={handleTabChange}
                className="flex-1 flex flex-col overflow-hidden"
            >
                <div className="flex-none px-6 pt-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10 shadow-sm">
                    <TabsList className="w-full justify-start overflow-x-auto h-auto p-0 bg-transparent gap-6 hide-scrollbar">
                        <TabsTrigger
                            value="foundation"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-2 py-4 text-slate-500 hover:text-slate-700 font-medium transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Building2 size={18} />
                                Fundação & Equipe
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="financial"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-2 py-4 text-slate-500 hover:text-slate-700 font-medium transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Wallet size={18} />
                                Financeiro
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="commercial"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-2 py-4 text-slate-500 hover:text-slate-700 font-medium transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Briefcase size={18} />
                                Comercial
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="crm"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-2 py-4 text-slate-500 hover:text-slate-700 font-medium transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Users size={18} />
                                CRM
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="stock"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-2 py-4 text-slate-500 hover:text-slate-700 font-medium transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Package size={18} />
                                Estoque
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="clinical"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-2 py-4 text-slate-500 hover:text-slate-700 font-medium transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <ClipboardList size={18} />
                                Clínico
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="integrations"
                            className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-2 py-4 text-slate-500 hover:text-slate-700 font-medium transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Zap size={18} />
                                Integrações
                            </div>
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* 3. CONTEÚDO COM SCROLL INDEPENDENTE (BODY) */}
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6">
                    <div className="max-w-7xl mx-auto h-full">

                        {/* === ABA FUNDAÇÃO (NAVIGATION CARDS PATTERN) === */}
                        <TabsContent value="foundation" className="m-0 h-full focus-visible:ring-0 outline-none">

                            {foundationView === 'menu' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
                                    <ViewCard
                                        emoji="🏥"
                                        title="Minha Clínica"
                                        description="Dados cadastrais, endereço e logo da sua unidade."
                                        onClick={() => setFoundationView('clinic')}
                                        color="blue"
                                    />
                                    <ViewCard
                                        emoji="👥"
                                        title="Gestão de Equipe"
                                        description="Adicione usuários, defina papéis e gerencie acessos."
                                        onClick={() => setFoundationView('users')}
                                        color="violet"
                                    />
                                    <ViewCard
                                        emoji="👨‍⚕️"
                                        title="Profissionais de Saúde"
                                        description="Cadastro de dentistas, médicos e especialistas técnicos."
                                        onClick={() => setFoundationView('professionals')}
                                        color="green"
                                    />
                                    <ViewCard
                                        emoji="🛡️"
                                        title="Segurança & Auditoria"
                                        description="PIN de segurança e configurações de acesso."
                                        onClick={() => setFoundationView('security')}
                                        color="red"
                                    />
                                </div>
                            )}

                            {foundationView !== 'menu' && (
                                <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setFoundationView('menu')}
                                            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                            Voltar ao Menu
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {foundationView === 'clinic' && 'Dados da Clínica'}
                                            {foundationView === 'users' && 'Equipe e Acessos'}
                                            {foundationView === 'professionals' && 'Profissionais de Saúde'}
                                            {foundationView === 'security' && 'Segurança & Auditoria'}
                                            {foundationView === 'audit' && 'Logs de Auditoria'}
                                        </h2>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                        {foundationView === 'clinic' && <ClinicSettings />}
                                        {foundationView === 'users' && <Team />}
                                        {foundationView === 'professionals' && <ProfessionalsSettings />}
                                        {foundationView === 'security' && <SecurityPINSettings />}
                                        {foundationView === 'audit' && <AuditLogsViewer />}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* === ABA FINANCEIRO (PILL TABS PATTERN) === */}
                        <TabsContent value="financial" className="m-0 h-full focus-visible:ring-0 outline-none">
                            <div className="flex flex-col gap-6">
                                {/* Sub-navigation Pills */}
                                <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <PillTab active={financialView === 'rules'} onClick={() => setFinancialView('rules')} icon={Shield} label="Regras" />
                                    <PillTab active={financialView === 'categories'} onClick={() => setFinancialView('categories')} icon={Database} label="Planos de Contas" />
                                    <PillTab active={financialView === 'banks'} onClick={() => setFinancialView('banks')} icon={Landmark} label="Contas Bancárias" />
                                    <PillTab active={financialView === 'cards'} onClick={() => setFinancialView('cards')} icon={CreditCard} label="Maquininhas" />
                                    <PillTab active={financialView === 'taxes'} onClick={() => setFinancialView('taxes')} icon={FileText} label="Impostos & NFs" />
                                    <PillTab active={financialView === 'commissions'} onClick={() => setFinancialView('commissions')} icon={Percent} label="Comissões" />
                                    <PillTab active={financialView === 'payouts'} onClick={() => setFinancialView('payouts')} icon={ArrowRightLeft} label="Repasses" />
                                    <button
                                        onClick={() => setIsWizardOpen(true)}
                                        className="ml-auto px-4 py-2 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-full text-sm font-bold flex items-center gap-2 transition-colors"
                                    >
                                        <Calculator size={14} /> Wizard de Custos
                                    </button>
                                </div>

                                {/* Financial Content Area */}
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 min-h-[500px]">
                                    {financialView === 'rules' && <FinancialRulesSettings />}
                                    {financialView === 'categories' && <CategoriesManager />}
                                    {financialView === 'banks' && <BankAccountsManager />}
                                    {financialView === 'cards' && <CardMachineConfig />}
                                    {financialView === 'taxes' && <TaxConfiguration />}
                                    {financialView === 'commissions' && <SalesCommissionManager />}
                                    {financialView === 'payouts' && <ProfessionalPaymentPanel />}
                                </div>
                            </div>
                        </TabsContent>

                        {/* === ABA COMERCIAL === */}
                        <TabsContent value="commercial" className="m-0 h-full focus-visible:ring-0 outline-none">
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <PillTab active={commercialView === 'pricetables'} onClick={() => setCommercialView('pricetables')} icon={Database} label="Tabelas de Preço" />
                                    <PillTab active={commercialView === 'procedures'} onClick={() => setCommercialView('procedures')} icon={ClipboardList} label="Procedimentos" />
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 min-h-[500px]">
                                    {commercialView === 'pricetables' && <PriceTablesSettings />}
                                    {commercialView === 'procedures' && <ProceduresManager />}
                                </div>
                            </div>
                        </TabsContent>

                        {/* === ABA CRM === */}
                        <TabsContent value="crm" className="m-0 h-full focus-visible:ring-0 outline-none">
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <PillTab active={crmView === 'leadsources'} onClick={() => setCrmView('leadsources')} icon={Users} label="Origens de Lead" />
                                    <PillTab active={crmView === 'pipeline'} onClick={() => setCrmView('pipeline')} icon={GitBranch} label="Pipeline" />
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 min-h-[500px]">
                                    {crmView === 'leadsources' && <LeadSourcesManager />}
                                    {crmView === 'pipeline' && <CRMPipelineManager />}
                                </div>
                            </div>
                        </TabsContent>

                        {/* === ABA ESTOQUE === */}
                        <TabsContent value="stock" className="m-0 h-full focus-visible:ring-0 outline-none">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <SuppliersManager />
                            </div>
                        </TabsContent>

                        {/* === ABA CLÍNICO === */}
                        <TabsContent value="clinical" className="m-0 h-full focus-visible:ring-0 outline-none">
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                                    <PillTab active={clinicalView === 'appointmenttypes'} onClick={() => setClinicalView('appointmenttypes')} icon={Calendar} label="Tipos de Agendamento" />
                                    <PillTab active={clinicalView === 'insurance'} onClick={() => setClinicalView('insurance')} icon={Heart} label="Convênios" />
                                    <PillTab active={clinicalView === 'templates'} onClick={() => setClinicalView('templates')} icon={FileText} label="Templates Clínicos" />
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 min-h-[500px]">
                                    {clinicalView === 'appointmenttypes' && <AppointmentTypesManager />}
                                    {clinicalView === 'insurance' && <InsurancePlansSettings />}
                                    {clinicalView === 'templates' && <ClinicalTemplatesManager />}
                                </div>
                            </div>
                        </TabsContent>

                        {/* === ABA INTEGRAÇÕES === */}
                        <TabsContent value="integrations" className="m-0 h-full focus-visible:ring-0 outline-none animate-in fade-in duration-300">
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                                <AIIntegrationsSettings />
                            </div>
                        </TabsContent>

                    </div>
                </div>
            </Tabs>

            <CostWizardSheet
                open={isWizardOpen}
                onOpenChange={setIsWizardOpen}
                clinicId={profile?.clinic_id || ''}
            />
        </div>
    );
};

// UI Components Pattern
const ViewCard = ({ emoji, title, description, onClick, color }: any) => {
    const colorClasses: any = {
        blue: 'bg-blue-50 text-blue-600 hover:border-blue-300',
        violet: 'bg-violet-50 text-violet-600 hover:border-violet-300',
        green: 'bg-green-50 text-green-600 hover:border-green-300',
        slate: 'bg-slate-50 text-slate-600 hover:border-slate-300',
    };

    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-start text-left p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all group ${colorClasses[color]?.replace('bg-', 'hover:bg-opacity-50')}`}
        >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 ${colorClasses[color]}`}>
                {emoji}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </button>
    );
};

const PillTab = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${active
            ? 'bg-slate-900 text-white shadow-md transform scale-105'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
            }`}
    >
        <Icon size={14} />
        {label}
    </button>
);

export default Settings;
