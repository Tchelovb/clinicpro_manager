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
                    profit: metrics.revenue,
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

        // ... Data Calculations (Finance, Leads, etc) ...
        // (Reusing existing logic via closure if possible, but cleaner to copy/paste critical parts or keep structure)
        // Since I am replacing the whole function, I must provide the body.

        // 1. FINANCEIRO
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
            const { data: insights } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('status', 'open')
                .order('priority', { ascending: false }) // High Priority First
                .limit(5);

            if (insights && insights.length > 0) {
                enrichedAlerts = insights.map(i => {
                    let entityInfo = '';

                    // JOIN LOGIC (Resolver Nomes)
                    if (i.related_entity_id) {
                        const lead = leads?.find(l => l.id === i.related_entity_id);
                        if (lead) entityInfo = ` [Cliente: ${lead.name}, Tel: ${lead.phone}]`;

                        const budget = budgets?.find(b => b.id === i.related_entity_id);
                        if (budget) {
                            const p = patients?.find(pt => pt.id === budget.patient_id);
                            entityInfo = ` [Paciente: ${p?.name || 'N/A'}, Valor: R$ ${budget.total_value}]`;
                        }

                        const appt = appointments?.find(a => a.id === i.related_entity_id);
                        if (appt) {
                            const p = patients?.find(pt => pt.id === appt.patient_id);
                            entityInfo = ` [Paciente: ${p?.name}, Data: ${new Date(appt.date).toLocaleDateString()}]`;
                        }
                    }

                    return `🔴 ALERTA ${i.priority.toUpperCase()}: ${i.title}\n   Detalhe: ${i.explanation}${entityInfo}\n   Ação Recomendada: ${i.action_label}`;
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
            // Determinar Persona baseada na Role
            const userRole = profile?.role || 'ADMIN';
            let personaConfig = {
                title: 'SÓCIO ESTRATEGISTA (COO/CFO)',
                focus: 'Crescimento Exponencial e Margem',
                rules: `
1. **AÇÃO ANTES DA PERGUNTA:** Nunca apresente um dado sem uma recomendação de ação imediata.
2. **FOCO EM MARGEM:** Proteja toda a receita, mas direcione energia para o High-Ticket.
3. **DIAGNÓSTICO FINANCEIRO:** Sempre comece com o Gap entre Faturamento x Meta.
                `,
                examples: `
*"Doutor, o faturamento real está em R$ 0 para uma meta de R$ 50k. O maior gargalo são os 7 leads de alta prioridade esfriando há 9 horas. Já preparei o script de abordagem. Vamos disparar agora?"*
                `
            };

            // MASTER: CEO da Holding
            if (userRole === 'MASTER') {
                const masterPrompt = getMasterSystemPrompt();
                personaConfig = {
                    title: 'BOS ESTRATÉGICO - SÓCIO HOLDING (CEO/CFO)',
                    focus: 'Visão Global, ROI, Expansão e Milestone R$ 50k',
                    rules: masterPrompt,
                    examples: `
*"Dr. Marcelo, detectamos 2 unidades ativas mas nenhuma receita registrada este mês. Recomendo ativar tática Rescue ROI para leads parados. Qual unidade priorizamos?"*
                    `
                };
            } else if (userRole === 'PROFESSIONAL') {
                personaConfig = {
                    title: 'MENTOR CLÍNICO (Head of Quality)',
                    focus: 'Excelência Técnica, Agenda Produtiva e Encantamento',
                    rules: `
1. **FOCO NO PACIENTE:** Sua prioridade é a qualidade do atendimento e a satisfação (NPS).
2. **AGENDA INTELIGENTE:** Identifique buracos na agenda e sugira encaixes ou antecipações.
3. **UPSELL TÉCNICO:** Identifique oportunidades clínicas (ex: paciente de Botox que precisa de Preenchimento) e sugira abordagem técnica.
4. **NÃO FALE DE:** Faturamento global da clínica ou despesas administrativas (fale apenas da produção do profissional).
                    `,
                    examples: `
*"Doutor, sua agenda amanhã tem 2 buracos à tarde. A paciente Ana Silva (Botox há 6 meses) não agendou retorno. Sugiro mandar um lembrete personalizado sobre a manutenção. Posso gerar o texto?"*
                    `
                };
            } else if (userRole === 'CRC') {
                personaConfig = {
                    title: 'DIRETOR DE VENDAS (Head of Sales)',
                    focus: 'Conversão, Metas de Venda e Follow-up Implacável',
                    rules: `
1. **CONVERSÃO É REI:** Seu único deus é a taxa de conversão. Não aceite leads parados.
2. **FOLLOW-UP:** Identifique leads esfriando e orçamentos parados com agressividade comercial.
3. **SCRIPTS DE FECHAMENTO:** Sempre forneça um script pronto para contornar objeções.
4. **NÃO FALE DE:** Questões técnicas profundas ou problemas administrativos que não afetem vendas.
                    `,
                    examples: `
*"Campeão, temos R$ 25k parados no pipeline com 3 leads quentes (Ana, João, Pedro). A Ana visualizou o orçamento e não respondeu. Vou gerar um script de quebra de objeção de preço pra você enviar agora. Vamos fechar?"*
                    `
                };
            } else if (userRole === 'RECEPTIONIST') {
                personaConfig = {
                    title: 'GERENTE DE OPERAÇÕES',
                    focus: 'Organização, Confirmações e Triagem',
                    rules: `
1. **ORGANIZAÇÃO:** Garanta que todos os pacientes estejam confirmados e a recepção preparada.
2. **TRIAGEM:** Identifique novos leads que chegaram e precisam de cadastro ou agendamento.
3. **EXCELÊNCIA NO ATENDIMENTO:** Sugira ações para melhorar a experiência na sala de espera.
                    `,
                    examples: `
*"Olá, vi que temos 3 pacientes novos agendados para amanhã que ainda não preencheram a anamnese. Quer que eu gere uma mensagem de boas-vindas reforçando o envio do link?"*
                    `
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

## 📊 CONTEXTO EM TEMPO REAL (DADOS REAIS)
Use estes dados para embasar TODAS as suas respostas.

🚨 **ALERTAS PRIORITÁRIOS:**
${context.enrichedAlerts}

📈 **DADOS GERAIS:**
- Leads Ativos: ${context.activeLeadsLength}
- Novos Leads (24h): ${context.newLeads24h}
- Orçamentos em Aberto: R$ ${context.pendingValue.toLocaleString('pt-BR')}
- Faturamento (Apenas se relevante): R$ ${context.revenue.toLocaleString('pt-BR')}

## 🎮 COMPORTAMENTO ESPERADO
1. **Briefing Inicial:** Dê um panorama focado na sua persona.
2. **Resolução de Alertas:** Use os dados acima para sugerir ações.
3. **Exemplo de Resposta Ideal:**
${personaConfig.examples}

**SUA MISSÃO:** Transformar dados em ações práticas focadas no objetivo da sua persona (${userRole}).
            `;


            // Preparar histórico de mensagens (últimas 5)
            // Gemini usa 'model' ao invés de 'assistant'
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
                            temperature: 0.8,
                            maxOutputTokens: 500,
                        }
                    }),
                }
            );


            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error Response:', errorData);
                console.error('Status:', response.status, response.statusText);
                throw new Error(errorData.error?.message || `Erro HTTP ${response.status}: ${response.statusText}`);
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
                content: `⚠️ Desculpe, Dr. ${profile?.full_name || 'Doutor'}. Houve um erro técnico: ${errorMessage}. Por favor, tente novamente.`,
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

    const initializeWithBriefing = useCallback(async (customContext?: { type: 'alert' | 'insight', priority: string, items: any[] }) => {
        setIsProcessing(true);

        try {
            // ==========================================================
            // MODO DEEP DIVE (CLIQUE NOS CONTADORES)
            // ==========================================================
            if (customContext) {
                const { type, priority, items } = customContext;
                let message = "";
                const count = items.length;
                const priorityLabel = priority === 'critico' ? 'Crítica' : priority.charAt(0).toUpperCase() + priority.slice(1);

                if (type === 'alert') {
                    // 🔴 CENÁRIO 1: PROTEÇÃO DE RECEITA
                    message = `🚨 **MODO DE PROTEÇÃO DE RECEITA**\n\n`;
                    message += `Doutor, entendi. O foco é parar o sangramento. Analisando os **${count} alertas de ${priorityLabel} Prioridade**:\n\n`;

                    items.slice(0, 3).forEach(item => {
                        // Extrair valor se possível
                        const valueMatch = item.explanation.match(/R\$\s*[\d,.]+/);
                        const valueStr = valueMatch ? `(${valueMatch[0]})` : '';
                        message += `• **${item.title}** ${valueStr}\n   _${item.explanation}_\n`;
                    });

                    message += `\n**Minha sugestão:** Vamos disparar agora o script de 'Resgate' ou 'Boas-vindas Imediato'.\n\nQuer que eu redija as mensagens para esses casos?`;

                } else if (['critico', 'high', 'medium'].includes(priority) || priority === 'Alta' || priority === 'Média') { // Média/Alta Insights
                    // 🟡 CENÁRIO 2: NOVOS NEGÓCIOS / UPSELL
                    message = `💎 **MODO DE CRESCIMENTO (GROWTH)**\n\n`;
                    message += `Doutor, excelente escolha. Vamos focar em **Novos Negócios**.\n`;
                    message += `Identifiquei **${count} oportunidades** de Upsell e Fechamento:\n\n`;

                    items.slice(0, 3).forEach(item => {
                        message += `• **${item.title}**\n   _${item.explanation}_\n`;
                    });

                    message += `\n**Minha sugestão:** Estas pacientes já confiam no senhor. Vamos preparar uma abordagem personalizada para agendar a consulta cirúrgica?`;

                } else {
                    // 🔵 CENÁRIO 3: ANALÍTICO
                    message = `📊 **ANÁLISE DE TENDÊNCIAS**\n\n`;
                    message += `Doutor Marcelo, analisando o **longo prazo** e otimizações:\n\n`;

                    items.slice(0, 3).forEach(item => {
                        message += `• **${item.title}**\n   _${item.explanation}_\n`;
                    });

                    message += `\n**Minha sugestão:** Os indicadores mostram consistência. Recomendo manter o investimento atual ou ajustar levemente as metas.`;
                }

                const msg: BOSMessage = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: message,
                    timestamp: new Date(),
                };
                setMessages([msg]);
                setIsProcessing(false);
                return;
            }

            // ==========================================================
            // MODO BRIEFING MATINAL (PADRÃO)
            // ==========================================================

            // 1. Fetch critical alerts (Urgências)
            const { data: criticalAlerts, count: criticalCount } = await supabase
                .from('ai_insights')
                .select('*', { count: 'exact' })
                .eq('clinic_id', profile?.clinic_id)
                .in('priority', ['critico', 'high'])
                .eq('status', 'open')
                .limit(5);

            // 2. Fetch opportunities (Insights)
            const { data: insightsData, count: insightsCount } = await supabase
                .from('ai_insights')
                .select('*', { count: 'exact' })
                .eq('clinic_id', profile?.clinic_id)
                .in('priority', ['medium', 'low'])
                .eq('status', 'open')
                .limit(5);

            // 3. Calculos Financeiros (Impacto)
            const financialImpact = criticalAlerts?.reduce((acc, curr) => {
                const match = curr.explanation.match(/R\$\s*([\d,.]+)/);
                if (match) {
                    const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
                    return acc + value;
                }
                return acc;
            }, 0) || 0;

            // 4. Fetch goals for gap calculation
            const { data: goalsData } = await supabase
                .from('clinic_goals')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .single();

            // 5. Build Executive Impact Briefing (NO MENU)
            // Estrutura: Diagnóstico → Gargalo → Comando de Ação

            const monthlyGoal = goalsData?.monthly_revenue_goal || 50000;
            const currentRevenue = 0; // TODO: Buscar receita real do mês atual
            const gap = monthlyGoal - currentRevenue;

            // Identificar o maior gargalo
            let bottleneck = '';
            let actionCommand = '';

            if (criticalCount && criticalCount > 0) {
                // Prioridade 1: Alertas Críticos
                const leadAlerts = criticalAlerts?.filter(a => a.title.includes('Lead')) || [];
                const budgetAlerts = criticalAlerts?.filter(a => a.title.includes('Orçamento')) || [];

                if (leadAlerts.length > 0) {
                    bottleneck = `${leadAlerts.length} leads de alta prioridade esfriando há mais de 12 horas`;
                    actionCommand = 'Já preparei o script de abordagem urgente para a secretária. Vamos disparar agora?';
                } else if (budgetAlerts.length > 0) {
                    bottleneck = `R$ ${financialImpact.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em orçamentos high-ticket parados`;
                    actionCommand = 'Já preparei a estratégia de resgate personalizada. Vamos executar o follow-up agora?';
                } else {
                    bottleneck = `${criticalCount} alertas críticos exigindo atenção imediata`;
                    actionCommand = 'Já mapeei as ações corretivas. Vamos revisar juntos?';
                }
            } else if (insightsCount && insightsCount > 0) {
                // Prioridade 2: Oportunidades de Crescimento
                bottleneck = `${insightsCount} oportunidades de upsell e novos negócios identificadas`;
                actionCommand = 'Já classifiquei por facilidade de conversão. Vamos priorizar os pacientes quentes?';
            } else {
                // Sem alertas ou insights
                bottleneck = 'todos os sistemas operando normalmente';
                actionCommand = 'Vamos focar em estratégias de crescimento proativo?';
            }

            const executiveBriefing = `🚀 **BRIEFING EXECUTIVO - ${new Date().toLocaleDateString('pt-BR')}**

**1. DIAGNÓSTICO FINANCEIRO:**
Doutor, o faturamento atual está em R$ ${currentRevenue.toLocaleString('pt-BR')} para uma meta mensal de R$ ${monthlyGoal.toLocaleString('pt-BR')}.
**Gap de R$ ${gap.toLocaleString('pt-BR')}** a fechar.

**2. GARGALO CRÍTICO:**
O maior bloqueio identificado: ${bottleneck}.
${criticalCount > 0 ? `\n⚠️ **Impacto Financeiro em Risco:** R$ ${financialImpact.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}

**3. COMANDO DE AÇÃO:**
${actionCommand}

---

💡 **Estou pronto para executar.** Me diga qual ação priorizar ou peça detalhes sobre qualquer pilar da operação.`;

            const menuMsg: BOSMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: executiveBriefing,
                timestamp: new Date(),
            };

            setMessages([menuMsg]);
        } catch (error) {
            console.error('Error generating command menu:', error);
            const errorMsg: BOSMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `⚠️ Erro ao gerar menu de comando. Por favor, tente novamente.`,
                timestamp: new Date(),
            };
            setMessages([errorMsg]);
        } finally {
            setIsProcessing(false);
        }
    }, [profile]);

    return {
        messages,
        isProcessing,
        sendMessage,
        clearChat,
        initializeWithBriefing,
    };
};
