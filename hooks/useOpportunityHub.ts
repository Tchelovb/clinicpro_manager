import { useMemo } from 'react';
import { useLeads } from './useLeads';
import { useUnapprovedBudgets } from './useBudgets';
import { useDashboardData } from './useDashboardData'; // For appointments
import { LeadStatus } from '../types';

export type FunnelType = 'ATTRACTION' | 'CONVERSION' | 'LTV' | 'AGENDA';

export interface OpportunityItem {
    id: string;
    title: string; // Patient Name or Lead Name
    subtitle: string; // Source or Procedure
    value: number;
    status: string;
    date: string; // CreatedAt or LastInteraction
    score: number; // 0-100
    type: 'LEAD' | 'BUDGET' | 'PATIENT' | 'APPOINTMENT';
    actionUrl: string;
    tags: string[];
}

export const useOpportunityHub = (selectedFunnel: FunnelType) => {
    const { leads, isLoading: leadsLoading } = useLeads();
    const { budgets, isLoading: budgetsLoading } = useUnapprovedBudgets();
    const { appointments, isLoading: aptLoading } = useDashboardData(); // Reusing dashboard data for agenda/tasks

    const opportunities = useMemo(() => {
        let items: OpportunityItem[] = [];

        switch (selectedFunnel) {
            case 'ATTRACTION':
                items = leads
                    .filter(l => [LeadStatus.NEW, LeadStatus.CONTACT].includes(l.status as LeadStatus))
                    .map(l => ({
                        id: l.id,
                        title: l.name,
                        subtitle: l.source,
                        value: l.value || 0,
                        status: l.status,
                        date: l.lastInteraction,
                        score: (l as any).lead_score || 0,
                        type: 'LEAD',
                        actionUrl: `/crm/${l.id}`,
                        tags: [l.source]
                    }));
                break;

            case 'CONVERSION':
                // Budgets that are NOT approved/rejected yet (Pending)
                items = budgets
                    .filter(b => ['Em Aberto', 'Em Análise', 'Em Negociação', 'Pendente', 'DRAFT'].includes(b.status))
                    .map(b => ({
                        id: b.id,
                        title: b.patientName || 'Paciente sem nome',
                        subtitle: `Orçamento #${b.id.substring(0, 4)}`, // Ideally Procedure Name
                        value: b.totalValue,
                        status: b.status,
                        date: b.created_at, // Fixed: database column is created_at
                        score: b.totalValue > 5000 ? 90 : 50, // Simple Logic: High Ticket = High Score
                        type: 'BUDGET',
                        actionUrl: `/patients/${b.patientId}/budgets/${b.id}`, // Edit Budget Link
                        tags: ['Orçamento']
                    }));
                break;

            case 'AGENDA':
                items = appointments
                    .filter(a => a.status === 'Pendente')
                    .map(a => ({
                        id: a.id,
                        title: a.patientName,
                        subtitle: `${a.date} às ${a.time} - ${a.type}`,
                        value: 0, // Agenda value usually unknown unless linked to procedure
                        status: a.status,
                        date: `${a.date} ${a.time}`,
                        score: 0,
                        type: 'APPOINTMENT',
                        actionUrl: `/agenda`,
                        tags: [a.type]
                    }));
                break;

            case 'LTV':
                // Mock Logic for LTV since we don't have a 'Inative Patients' hook yet
                // We'll use Won Leads older than 6 months as a proxy or empty for now
                // In production, this would query generated_opportunities view
                items = leads
                    .filter(l => l.status === LeadStatus.WON)
                    .map(l => ({
                        id: l.id,
                        title: l.name,
                        subtitle: 'Paciente Inativo (Reativação)',
                        value: 0,
                        status: 'Reativar',
                        date: l.lastInteraction,
                        score: 30,
                        type: 'PATIENT',
                        actionUrl: `/crm/${l.id}`,
                        tags: ['LTV']
                    }));
                break;
        }

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedFunnel, leads, budgets, appointments]);

    const totalValue = opportunities.reduce((acc, item) => acc + item.value, 0);
    const isLoading = leadsLoading || budgetsLoading || aptLoading;

    return {
        opportunities,
        totalValue,
        isLoading
    };
};
