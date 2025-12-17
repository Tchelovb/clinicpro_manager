import React, { useState } from "react";
import {
  Building,
  Users,
  Stethoscope,
  DollarSign,
  Heart,
  Settings as SettingsIcon,
} from "lucide-react";
import ClinicSettings from "./ClinicSettings";
import UsersSettings from "./UsersSettings";
import ProceduresSettings from "./ProceduresSettings";
import PriceTablesSettings from "./PriceTablesSettings";
import InsurancePlansSettings from "./InsurancePlansSettings";
import FinancialCRMSettings from "./FinancialCRMSettings";

type Section =
  | "clinic"
  | "professionals"
  | "procedure"
  | "price-tables"
  | "insurance-plans"
  | "financial-crm";

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>("clinic");

  const sections = [
    {
      key: "clinic" as Section,
      label: "Clínica",
      icon: Building,
      component: ClinicSettings,
    },
    {
      key: "professionals" as Section,
      label: "Usuários",
      icon: Users,
      component: UsersSettings,
    },
    {
      key: "procedure" as Section,
      label: "Procedimentos",
      icon: Stethoscope,
      component: ProceduresSettings,
    },
    {
      key: "price-tables" as Section,
      label: "Tabelas de Preço",
      icon: DollarSign,
      component: PriceTablesSettings,
    },
    {
      key: "insurance-plans" as Section,
      label: "Convênios",
      icon: Heart,
      component: InsurancePlansSettings,
    },
    {
      key: "financial-crm" as Section,
      label: "Financeiro & CRM",
      icon: SettingsIcon,
      component: FinancialCRMSettings,
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
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeSection === section.key
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
