import React, { useState } from "react";
import {
  Building,
  Users,
  Stethoscope,
  DollarSign,
  Heart,
  Palette,
  Shield,
  FileText,
  Target,
  Settings as SettingsIcon,
} from "lucide-react";
import ClinicSettings from "./settings/ClinicSettings";
import UsersSettings from "./settings/UsersSettings";
import ProceduresSettings from "./settings/ProceduresSettings";
import PriceTablesSettings from "./settings/PriceTablesSettings";
import InsurancePlansSettings from "./settings/InsurancePlansSettings";
import CRMSettings from "./settings/CRMSettings";
import ProfessionalsSettings from "./settings/ProfessionalsSettings";
import FinancialRulesSettings from "./settings/financial-rules/FinancialRulesSettings";
import CashRulesSettings from "./settings/CashRulesSettings";
import BrandingSettings from "./settings/branding/BrandingSettings";
import SecuritySettings from "./settings/security/SecuritySettings";
import ClinicalSettings from "./settings/clinical/ClinicalSettings";
import AutomationsSettings from "./settings/automations/AutomationsSettings";
import IntegrationsSettings from "./settings/integrations/IntegrationsSettings";
import BusinessGoalsSettings from "./settings/goals/BusinessGoalsSettings";
import { ShieldCheck, Bell, Network } from "lucide-react";

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    | "clinic"
    | "branding"
    | "security"
    | "clinical"
    | "automations"
    | "integrations"
    | "goals"
    | "crm"
    | "Users"
    | "professionals"
    | "procedure"
    | "price-tables"
    | "insurance-plans"
    | "cash-rules"
    | "financial-rules"
  >("clinic");

  const sections = [
    {
      key: "clinic" as const,
      label: "Clínica",
      icon: Building,
      component: ClinicSettings,
    },
    {
      key: "branding" as const,
      label: "Identidade Visual",
      icon: Palette,
      component: BrandingSettings,
    },
    {
      key: "security" as const,
      label: "Segurança & Auditoria",
      icon: Shield,
      component: SecuritySettings,
    },
    {
      key: "clinical" as const,
      label: "Formulários Clínicos",
      icon: FileText,
      component: ClinicalSettings,
    },
    {
      key: "automations" as const,
      label: "Notificações & Automações",
      icon: Bell,
      component: AutomationsSettings,
    },
    {
      key: "integrations" as const,
      label: "Integrações & Backup",
      icon: Network,
      component: IntegrationsSettings,
    },
    {
      key: "goals" as const,
      label: "Metas de Negócio",
      icon: Target,
      component: BusinessGoalsSettings,
    },
    {
      key: "Users" as const,
      label: "Usuários",
      icon: Users,
      component: UsersSettings,
    },
    {
      key: "financial-rules" as const,
      label: "Regras Financeiras",
      icon: ShieldCheck,
      component: FinancialRulesSettings,
    },
    {
      key: "cash-rules" as const,
      label: "Regras de Caixa (Fort Knox)",
      icon: DollarSign,
      component: CashRulesSettings,
    },
    {
      key: "professionals" as const,
      label: "Profissionais",
      icon: Stethoscope,
      component: ProfessionalsSettings,
    },
    {
      key: "procedure" as const,
      label: "Procedimentos",
      icon: Stethoscope,
      component: ProceduresSettings,
    },
    {
      key: "price-tables" as const,
      label: "Tabelas de Preço",
      icon: DollarSign,
      component: PriceTablesSettings,
    },
    {
      key: "insurance-plans" as const,
      label: "Convênios",
      icon: Heart,
      component: InsurancePlansSettings,
    },
    {
      key: "crm" as const,
      label: "CRM",
      icon: Users,
      component: CRMSettings,
    },
  ];

  const ActiveComponent =
    sections.find((s) => s.key === activeSection)?.component || ClinicSettings;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <SettingsIcon size={20} />
            Configurações
          </h1>
        </div>

        <nav className="px-4 space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === section.key
                  ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Icon size={18} />
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default Settings;
