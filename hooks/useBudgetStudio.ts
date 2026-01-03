import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import profitAnalysisService from '../services/profitAnalysisService';

export interface BudgetStudioItem {
    uniqueId: string; // ID temporário para o frontend
    id: string; // ID do procedimento no banco
    name: string;
    base_price: number;
    unit_value: number; // Preço editável
    quantity: number;
    category: string;
    estimated_cost: number; // Custo estimado (Lab + Materiais)
    region?: string;
    tooth_number?: number;
    showroom_image_url?: string;
    benefits_description?: string;
}

export interface BudgetFinancials {
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    status: 'excellent' | 'good' | 'warning' | 'danger';
}

export function useBudgetStudio(patientId: string, budgetId?: string) {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState<BudgetStudioItem[]>([]);
    const [procedures, setProcedures] = useState<BudgetStudioItem[]>([]);
    const [isShowroomMode, setIsShowroomMode] = useState(false);
    const [activeScenario, setActiveScenario] = useState('Plano Ideal');
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Carregar Paciente
    useEffect(() => {
        async function loadPatient() {
            if (!patientId) return;

            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', patientId)
                    .single();

                if (error) throw error;
                setPatient(data);
            } catch (err) {
                console.error('Erro ao carregar paciente:', err);
                toast.error('Erro ao carregar dados do paciente');
            }
        }
        loadPatient();
    }, [patientId]);

    // Carregar Catálogo de Procedimentos
    useEffect(() => {
        async function loadCatalog() {
            if (!user?.clinic_id) return;

            try {
                const { data, error } = await supabase
                    .from('procedure')
                    .select('*')
                    .eq('clinic_id', user.clinic_id)
                    .order('name');

                if (error) throw error;

                // Mapear procedimentos com custos estimados
                const mapped: BudgetStudioItem[] = data.map((p: any) => ({
                    id: p.id,
                    uniqueId: '',
                    name: p.name,
                    base_price: p.base_price || 0,
                    unit_value: p.base_price || 0,
                    quantity: 1,
                    category: p.category || 'CLINICA_GERAL',
                    estimated_cost: p.estimated_lab_cost || (p.base_price * 0.3), // Estimativa de 30% se não tiver custo
                    showroom_image_url: p.showroom_image_url,
                    benefits_description: p.benefits_description,
                }));

                setProcedures(mapped);
            } catch (err) {
                console.error('Erro ao carregar catálogo:', err);
                toast.error('Erro ao carregar catálogo de procedimentos');
            } finally {
                setLoading(false);
            }
        }
        loadCatalog();
    }, [user?.clinic_id]);

    const [budget, setBudget] = useState<any>(null); // Store full budget object

    // Carregar Orçamento Existente (se estiver editando)
    useEffect(() => {
        async function loadExistingBudget() {
            if (!budgetId) return;

            try {
                // 1. Fetch Budget Header (Status, Config)
                const { data: budgetData, error: budgetError } = await supabase
                    .from('budgets')
                    .select('*')
                    .eq('id', budgetId)
                    .single();

                if (budgetError) throw budgetError;
                setBudget(budgetData);

                // 2. Fetch Items
                const { data: budgetItems, error } = await supabase
                    .from('budget_items')
                    .select('*')
                    .eq('budget_id', budgetId);

                if (error) throw error;

                const loadedItems: BudgetStudioItem[] = budgetItems.map((item: any) => ({
                    uniqueId: Math.random().toString(36).substr(2, 9),
                    id: item.procedure_id || '',
                    name: item.procedure_name,
                    base_price: item.unit_value,
                    unit_value: item.unit_value,
                    quantity: item.quantity || 1,
                    category: 'CLINICA_GERAL', // Buscar da procedure se necessário
                    estimated_cost: item.unit_value * 0.3,
                    region: item.region,
                    tooth_number: item.tooth_number,
                }));

                setItems(loadedItems);
            } catch (err) {
                console.error('Erro ao carregar orçamento:', err);
                toast.error('Erro ao carregar orçamento existente');
            }
        }
        loadExistingBudget();
    }, [budgetId]);

    // Ações de Manipulação de Itens
    const addItem = (proc: BudgetStudioItem) => {
        const newItem: BudgetStudioItem = {
            ...proc,
            uniqueId: Math.random().toString(36).substr(2, 9),
            quantity: 1,
            unit_value: proc.base_price,
        };
        setItems((prev) => [...prev, newItem]);
        toast.success(`${proc.name} adicionado!`, { position: 'bottom-center', duration: 2000 });
    };

    const removeItem = (uniqueId: string) => {
        setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));
        toast.success('Item removido', { position: 'bottom-center', duration: 1500 });
    };

    const updateItem = (uniqueId: string, field: keyof BudgetStudioItem, value: any) => {
        setItems((prev) =>
            prev.map((i) => (i.uniqueId === uniqueId ? { ...i, [field]: value } : i))
        );
    };

    // Cálculos Financeiros (Memoizados para performance)
    const financials: BudgetFinancials = useMemo(() => {
        const revenue = items.reduce((acc, i) => acc + i.unit_value * i.quantity, 0);
        const costs = items.reduce((acc, i) => acc + i.estimated_cost * i.quantity, 0);
        const profit = revenue - costs;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        let status: 'excellent' | 'good' | 'warning' | 'danger';
        if (margin >= 30) status = 'excellent';
        else if (margin >= 20) status = 'good';
        else if (margin >= 15) status = 'warning';
        else status = 'danger';

        return { revenue, costs, profit, margin, status };
    }, [items]);

    // Salvar Orçamento
    const saveBudget = async (status: 'DRAFT' | 'PENDING' | 'APPROVED', overrides: any = {}) => {
        if (items.length === 0) {
            toast.error('O orçamento está vazio. Adicione procedimentos primeiro.');
            return null;
        }

        if (!user?.clinic_id || !patientId) {
            toast.error('Dados de sessão inválidos');
            return null;
        }

        try {
            // 1. Criar ou atualizar orçamento
            const budgetPayload = {
                patient_id: patientId,
                clinic_id: user.clinic_id,
                doctor_id: user.id,
                status: status,
                total_value: financials.revenue,
                final_value: financials.revenue,
                discount: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...overrides // Allow overriding defaults (e.g. for negotiated sales)
            };

            const { data: budget, error: budgetError } = budgetId
                ? await supabase.from('budgets').update(budgetPayload).eq('id', budgetId).select().single()
                : await supabase.from('budgets').insert(budgetPayload).select().single();

            if (budgetError) throw budgetError;

            // 2. Deletar itens antigos se estiver editando
            if (budgetId) {
                await supabase.from('budget_items').delete().eq('budget_id', budgetId);
            }

            // 3. Inserir novos itens
            const itemsPayload = items.map((i) => ({
                budget_id: budget.id,
                procedure_id: i.id || null, // Ensure ID is used if available (UUID)
                procedure_name: i.name,
                quantity: i.quantity,
                unit_value: i.unit_value,
                total_value: i.unit_value * i.quantity,
                region: i.region || null,
                tooth_number: i.tooth_number ? Number(i.tooth_number) : null,
            }));

            const { error: itemsError } = await supabase.from('budget_items').insert(itemsPayload);
            if (itemsError) throw itemsError;

            // 4. Feedback e navegação
            if (status === 'PENDING') {
                toast.success('✅ Orçamento enviado para a Recepção!', { duration: 3000 });
                setTimeout(() => navigate('/sales'), 1500);
            } else if (status === 'DRAFT') {
                toast.success('💾 Rascunho salvo com sucesso!');
            }

            return budget; // Return the saved budget object

        } catch (err: any) {
            console.error('Erro ao salvar orçamento:', err);
            toast.error('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
            throw err;
        }
    };

    // Duplicar Cenário
    const duplicateScenario = () => {
        toast('Funcionalidade de múltiplos cenários em desenvolvimento', { icon: 'ℹ️' });
    };

    return {
        // Estado
        items,
        procedures,
        patient,
        loading,
        isCalculating,
        isShowroomMode,
        activeScenario,

        // Ações
        addItem,
        removeItem,
        updateItem,
        saveBudget,
        duplicateScenario,
        setIsShowroomMode,
        setActiveScenario,

        // Cálculos
        financials,

        // Dados do Orçamento
        budget,
    };
}
