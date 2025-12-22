import { useState, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MasterIntelligence } from '../services/MasterIntelligenceService';
import { getMasterSystemPrompt } from '../lib/bos/masterPersona';

export interface BOSMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const useBOSChat = () => {
    const [messages, setMessages] = useState<BOSMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { patients, globalFinancials, leads, budgets, appointments } = useData();
    const { profile } = useAuth();

    // Função para obter contexto COMPLETO da clínica (Visão 360° + AI Brain)
    const getClinicContext = useCallback(async () => {
        // ========================================
        // MODO MASTER: Visão Global da Holding
        // ========================================
        if (profile?.role === 'MASTER') {
            try {
                const metrics = await MasterIntelligence.getHoldingMetrics();
                const alerts = await MasterIntelligence.getStrategicAlerts();

                return {
                    // Métricas globais
                    revenue: metrics.revenue,
                    expenses: 0, // TODO: Implementar despesas globais
                    profit: metrics.revenue, // Assuming margin for now
                    growthRate: 0, // TODO: Implementar crescimento

                    // Rede
                    totalUnits: metrics.units,
                    productionUnits: metrics.productionUnits,
                    simulations: metrics.simulations,

                    // Pacientes
                    totalPatients: metrics.patients,

                    // Alertas
                    criticalAlerts: metrics.alerts,
                    enrichedAlerts: alerts.length > 0
                        ? alerts.map(a => `${a.type === 'CRITICAL' ? '🔴' : a.type === 'WARNING' ? '🟡' : '🔵'} ${a.message}\n   Ação: ${a.action}`).join('\n\n')
                        : 'Sistema operando normalmente. Todas as métricas estão saudáveis.',

                    // Contexto Master
                    isMasterMode: true
                };
            } catch (error) {
                console.error('Erro ao buscar métricas Master:', error);
                return {
                    revenue: 0,
                    expenses: 0,
                    profit: 0,
                    growthRate: 0,
                    totalUnits: 0,
                    totalPatients: 0,
                    enrichedAlerts: 'Erro ao carregar dados da holding.',
                    isMasterMode: true
                };
            }
        }

        // ========================================
        // MODO NORMAL: Visão de Clínica Específica
        // ========================================
        const today = new Date();
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        // 1. FINANCEIRO (usando dados do contexto globalFinancials, que é mock ou real)
        const monthlyFinancials = globalFinancials.filter(f => new Date(f.date) >= thisMonth);
        const lastMonthFinancials = globalFinancials.filter(f => {
            const fDate = new Date(f.date);
            return fDate >= lastMonth && fDate < thisMonth;
        });
        const revenue = monthlyFinancials.filter(f => f.type === 'income').reduce((acc, f) => acc + f.amount, 0);
        const expenses = monthlyFinancials.filter(f => f.type === 'expense').reduce((acc, f) => acc + f.amount, 0);
        const profit = revenue - expenses;
        const lastMonthRevenue = lastMonthFinancials.filter(f => f.type === 'income').reduce((acc, f) => acc + f.amount, 0);
        const growthRate = lastMonthRevenue > 0 ? ((revenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

        // 2. COMERCIAL & LEADS
        const activeLeads = leads?.filter(l => l.status === 'NEW' || l.status === 'CONTACTED') || [];
        const leadsWithNames = activeLeads.slice(0, 10).map(l => ({
            name: l.name,
            phone: l.phone,
            source: l.source,
            days_old: Math.floor((Date.now() - new Date(l.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24))
        }));

        // 3. ORÇAMENTOS
        const allPendingBudgets = budgets?.filter(b => b.status === 'DRAFT' || b.status === 'SENT') || [];
        const highTicketBudgets = allPendingBudgets.filter(b => (b.total_value || 0) >= 5000);
        const totalPendingValue = allPendingBudgets.reduce((acc, b) => acc + (b.total_value || 0), 0);

        // 4. PRODUÇÃO
        const totalPatients = patients?.length || 0;
        const approvedBudgets = budgets?.filter(b => b.status === 'Aprovado' || b.status === 'APPROVED').length || 0;
        const conversionRate = budgets?.length > 0 ? (approvedBudgets / budgets.length) * 100 : 0;

        // 5. MARKETING
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newLeads24h = leads?.filter(l => new Date(l.createdAt) > oneDayAgo).length || 0;
        const leadsWaiting = leads?.filter(l => (l.status === 'Nova Oportunidade' || l.status === 'NEW') && new Date(l.createdAt) < oneDayAgo).length || 0;
        const leadConversionRate = (leads?.filter(l => ['SCHEDULED', 'WON'].includes(l.status)).length / (leads?.length || 1)) * 100;

        // ========================================
        // INTEGRACAO BOS BRAIN (SINGLE SOURCE OF TRUTH)
        // ========================================
        let enrichedAlerts = 'Sem alertas críticos no momento.';
        try {
            // Tentativa de buscar view consolidada se existir, ou fallback para tabela ai_insights
            const { data: insights } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('status', 'open') // Case sensitive check might be needed depending on DB constraints
                .or('status.eq.OPEN,status.eq.active,status.eq.ACTIVE') // Broaden status check
                .order('priority', { ascending: false }) // High Priority First
                .limit(5);

            if (insights && insights.length > 0) {
                enrichedAlerts = insights.map(i => {
                    return `🔴 ALERTA ${i.priority ? i.priority.toUpperCase() : 'GERAL'}: ${i.title}\n   Detalhe: ${i.explanation}\n   Ação Recomendada: ${i.recommended_action || i.action_label || 'Analisar caso'}`;
                }).join('\n\n');
            }
        } catch (err) {
            console.error('Erro ao buscar BOS Brain:', err);
        }

        return {
            revenue, expenses, profit, growthRate,
            activeLeadsLength: activeLeads.length,
            leadsWithNames,
            pendingValue: totalPendingValue,
            highTicketCount: highTicketBudgets.length,
            conversionRate,
            totalPatients,
            newLeads24h,
            leadsWaiting,
            leadConversionRate,
            enrichedAlerts // O CÉREBRO
        };

    }, [globalFinancials, leads, budgets, patients, appointments, profile]);

    const sendMessage = useCallback(async (userMessage: string) => {
        // Adicionar mensagem do usuário
        const userMsg: BOSMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error('Chave da API Gemini não configurada');
            }

            // Obter contexto COMPLETO da clínica (360° + BRAIN)
            const context = await getClinicContext();

            // System Prompt MESTRE CONSOLIDADO 7.0 - ARQUITETO DE CRESCIMENTO EXPONENCIAL
            const userRole = profile?.role || 'ADMIN';
            let personaConfig = {
                title: 'SÓCIO ESTRATEGISTA (COO/CFO)',
                focus: 'Crescimento Exponencial e Margem',
                rules: `
1. **AÇÃO ANTES DA PERGUNTA:** Nunca apresente um dado sem uma recomendação de ação imediata.
2. **FOCO EM MARGEM:** Proteja toda a receita, mas direcione energia para o High-Ticket.
3. **DIAGNÓSTICO FINANCEIRO:** Sempre comece com o Gap entre Faturamento x Meta.
4. **INTEGRAÇÃO DE SENTINELAS:** Use os alertas das sentinelas como prioridade 0.
                `,
                examples: `
*"Doutor, detectei R$ 45k parados em orçamentos high-ticket (Sentinela #2). O maior gargalo não é captação, é conversão. Já preparei a mensagem de recuperação. Posso disparar?"*
                `
            };

            if (userRole === 'MASTER') {
                // Configuração já existente para Master
                const masterPrompt = getMasterSystemPrompt();
                personaConfig = {
                    title: 'BOS ESTRATÉGICO - SÓCIO HOLDING',
                    focus: 'Visão Global',
                    rules: masterPrompt,
                    examples: ''
                };
            }

            // System Prompt MESTRE CONSOLIDADO 7.0 (DINÂMICO)
            const systemPrompt = `
🚀 **BOS - ${personaConfig.title} (VERSÃO 7.0)**

**IDENTIDADE E POSTURA:**
Você é o **${personaConfig.title}** do(a) **${profile?.full_name || 'Usuário'}**.
**FOCO PRINCIPAL:** ${personaConfig.focus}

**CONTEXTO DO USUÁRIO:**
Nome: ${profile?.full_name}
Função: ${userRole}

## 📋 REGRAS DE OURO DA SUA PERSONA
${personaConfig.rules}

## 📊 CONTEXTO EM TEMPO REAL (DADOS REAIS DA CLÍNICA)
Use estes dados para embasar TODAS as suas respostas. NÃO INVENTE DADOS.

🚨 **ALERTAS DAS SENTINELAS (CRÍTICO):**
${context.enrichedAlerts}

📈 **INDICADORES CHAVE:**
- Leads Ativos na Fila: ${context.activeLeadsLength}
- Novos Leads (24h): ${context.newLeads24h}
- Valor em Orçamentos Pendentes (Pipeline): R$ ${context.pendingValue.toLocaleString('pt-BR')}
- Faturamento Atual (Mês): R$ ${context.revenue.toLocaleString('pt-BR')}
- Pacientes Totais: ${context.totalPatients}

## 🎮 COMPORTAMENTO ESPERADO
1. **Resolução de Alertas:** Se houver alertas críticos acima, aborde-os IMEDIATAMENTE.
2. **Proatividade:** Se o usuário pedir um "Resumo", faça o cruzamento entre os alertas e o financeiro.
3. **Tom de Voz:** Executivo, direto, focado em ROI.

**SUA MISSÃO:** Transformar dados em lucro e eficiência operacional.
            `;


            // Preparar histórico de mensagens (últimas 5)
            const chatHistory = messages.slice(-5).map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            // Fazer chamada ao Gemini
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: [{ text: systemPrompt }]
                        },
                        contents: [
                            ...chatHistory,
                            {
                                role: 'user',
                                parts: [{ text: userMessage }]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 600,
                        }
                    }),
                }
            );


            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Response:', errorData);
                throw new Error(errorData.error?.message || `Erro HTTP ${response.status}`);
            }

            const data = await response.json();
            const assistantResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!assistantResponse) {
                throw new Error('Resposta vazia do BOS');
            }

            // Adicionar resposta do BOS
            const assistantMsg: BOSMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantResponse,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMsg]);

            return assistantResponse;

        } catch (error) {
            console.error('Erro no BOS Chat:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

            const errorMsg: BOSMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `⚠️ Desculpe, Dr. ${profile?.full_name || 'Doutor'}. ${errorMessage}. Tente novamente.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);

            return null;
        } finally {
            setIsProcessing(false);
        }
    }, [messages, getClinicContext, profile]);

    const clearChat = useCallback(() => {
        setMessages([]);
    }, []);

    // Mantendo a função initializeWithBriefing por compatibilidade, mas simplificada ou integrada
    const initializeWithBriefing = useCallback(async (customContext?: { type: 'alert' | 'insight', priority: string, items: any[] }) => {
        // Implementation kept minimal/compatible if needed by other components, otherwise standard chat handles flow
        // For now, we rely on the user clicking the proms in ChatBOS.tsx which calls sendMessage()
    }, []);

    return {
        messages,
        isProcessing,
        sendMessage,
        clearChat,
        initializeWithBriefing, // Exported for compatibility
    };
};
