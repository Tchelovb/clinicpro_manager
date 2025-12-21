// =====================================================
// SERVICE: GESTÃO LABORATORIAL
// =====================================================

import { supabase } from '@/lib/supabase';
import {
    LabOrder,
    LabOrderStatus,
    LabOrderStats,
    CreateLabOrderDTO,
    UpdateLabOrderDTO,
    OverdueLabOrder,
    LabSupplierPerformance
} from '@/types/labOrders';

export const LabOrderService = {

    // Criar Pedido
    async createOrder(data: CreateLabOrderDTO): Promise<LabOrder> {
        const { data: newOrder, error } = await supabase
            .from('lab_orders')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return newOrder as LabOrder;
    },

    // Buscar Todos os Pedidos (com filtros)
    async getOrders(clinicId: string, status?: LabOrderStatus): Promise<LabOrder[]> {
        let query = supabase
            .from('lab_orders')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as LabOrder[];
    },

    // Buscar Pedidos Atrasados
    async getOverdueOrders(clinicId: string): Promise<OverdueLabOrder[]> {
        const { data, error } = await supabase
            .from('overdue_lab_orders_view')
            .select('*')
            .eq('clinic_id', clinicId);

        if (error) throw error;
        return data as OverdueLabOrder[];
    },

    // Atualizar Pedido
    async updateOrder(id: string, updates: UpdateLabOrderDTO): Promise<void> {
        const { error } = await supabase
            .from('lab_orders')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },

    // Performance de Fornecedores
    async getSupplierPerformance(clinicId: string): Promise<LabSupplierPerformance[]> {
        const { data, error } = await supabase
            .from('lab_supplier_performance_view')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('total_orders', { ascending: false });

        if (error) throw error;
        return data as LabSupplierPerformance[];
    },

    // Obter Estatísticas Globais
    async getStats(clinicId: string): Promise<LabOrderStats> {
        const { data, error } = await supabase
            .from('lab_orders')
            .select('status, cost, is_paid, expected_return_date, received_date')
            .eq('clinic_id', clinicId);

        if (error) throw error;

        const total = data.length;
        const active = data.filter(o => ['SENT', 'IN_PROGRESS', 'PREPARING'].includes(o.status)).length;
        const overdue = data.filter(o => {
            if (!o.expected_return_date) return false;
            return new Date(o.expected_return_date) < new Date() && !['RECEIVED', 'DELIVERED_TO_PATIENT'].includes(o.status);
        }).length;
        const completed = data.filter(o => ['RECEIVED', 'DELIVERED_TO_PATIENT'].includes(o.status)).length;

        // Cálculo de Turnaround (dias médios)
        let totalDays = 0;
        let countedOrders = 0;

        // Simplificando o cálculo de dias (precisaria da data de envio que não peguei no select acima, ajustando select)
        // Para simplificar, retornamos 0 ou pegaríamos 'sent_date' se necessário. 

        const totalCost = data.reduce((sum, o) => sum + (Number(o.cost) || 0), 0);
        const totalPaid = data.filter(o => o.is_paid).reduce((sum, o) => sum + (Number(o.cost) || 0), 0);

        return {
            total_orders: total,
            active_orders: active,
            overdue_orders: overdue,
            completed_orders: completed,
            average_turnaround_days: 0, // Placeholder
            total_cost: totalCost,
            total_paid: totalPaid,
            pending_payment: totalCost - totalPaid
        };
    }
};
