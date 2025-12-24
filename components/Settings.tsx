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
  Bell,
  Network,
  ShieldCheck,
  Lock
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
import { useAuth } from "../contexts/AuthContext";
import { MasterSettings } from "./MasterSettings";
import { ModernSettingsLayout } from "./settings/ModernSettingsLayout";

const Settings: React.FC = () => {
  const { profile } = useAuth();

  // MASTER gets platform control panel
  if (profile?.role === 'MASTER') {
    return <MasterSettings />;
  }

  // Other roles get clinic settings
  const [activeSection, setActiveSection] = useState<string>("clinic");

  // Configuration of all available setting components
  const componentsMap: Record<string, React.ComponentType<any>> = {
    clinic: ClinicSettings,
    branding: BrandingSettings,
    security: SecuritySettings,
    clinical: ClinicalSettings,
    automations: AutomationsSettings,
    integrations: IntegrationsSettings,
    goals: BusinessGoalsSettings,
    users: UsersSettings,
    "financial-rules": FinancialRulesSettings,
    "cash-rules": CashRulesSettings,
    professionals: ProfessionalsSettings,
    procedure: ProceduresSettings,
    "price-tables": PriceTablesSettings,
    "insurance-plans": InsurancePlansSettings,
    crm: CRMSettings,
  };

  const groups = [
    {
      title: "Workspace",
      items: [
        { key: "clinic", label: "Clínica", icon: Building },
        { key: "branding", label: "Identidade Visual", icon: Palette },
        { key: "automations", label: "Notificações & Automações", icon: Bell },
        { key: "integrations", label: "Integrações & Backup", icon: Network },
        { key: "security", label: "Segurança & Auditoria", icon: Shield },
      ]
    },
    {
      title: "Comercial & CRM",
      items: [
        { key: "crm", label: "Configuração CRM", icon: Users },
        { key: "goals", label: "Metas (10x50)", icon: Target },
        { key: "price-tables", label: "Tabelas de Preço", icon: DollarSign },
        { key: "insurance-plans", label: "Convênios", icon: Heart },
      ]
    },
    {
      title: "Operação Clínica",
      items: [
        { key: "procedure", label: "Procedimentos", icon: Stethoscope },
        { key: "professionals", label: "Profissionais", icon: Stethoscope },
        { key: "clinical", label: "Prontuário & Anamnese", icon: FileText },
      ]
    },
    {
      title: "Controle Financeiro",
      items: [
        { key: "financial-rules", label: "Regras Financeiras", icon: ShieldCheck },
        { key: "cash-rules", label: "Fort Knox (Caixa)", icon: Lock },
      ]
    },
    {
      title: "Acesso",
      items: [
        { key: "users", label: "Gerenciar Usuários", icon: Users },
      ]
    }
  ];

  const ActiveComponent = componentsMap[activeSection] || ClinicSettings;

  // Find label for active section
  const findLabel = () => {
    for (const group of groups) {
      const item = group.items.find(i => i.key === activeSection);
      if (item) return item.label;
    }
    return "Configurações";
  };

  return (
    <ModernSettingsLayout
      groups={groups}
      activeKey={activeSection}
      onSelect={setActiveSection}
      activeLabel={findLabel()}
    >
      <ActiveComponent />
    </ModernSettingsLayout>
  );
};

export default Settings;
