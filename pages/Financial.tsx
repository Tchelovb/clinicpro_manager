import React from 'react';
import { FinancialAppShell } from '../components/financial/FinancialAppShell';

/**
 * Financial Page
 * 
 * Página principal do módulo financeiro
 * Usa o FinancialAppShell com navegação híbrida Desktop/Mobile
 * 
 * Funcionalidades:
 * - Dashboard BI
 * - Fluxo de Caixa
 * - Contas a Receber
 * - Contas a Pagar
 * - DRE Operacional
 * - Auditoria
 */
const Financial: React.FC = () => {
    return <FinancialAppShell defaultTab="dashboard" />;
};

export default Financial;
