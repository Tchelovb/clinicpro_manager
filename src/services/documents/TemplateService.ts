import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateFinancialTableHTML } from '../../../components/documents/FinancialInvestmentTable';

export interface TemplateContext {
    patient?: {
        name: string;
        cpf: string;
        phone: string;
        email?: string;
        address?: string;
    };
    professional?: {
        name: string;
        cro: string;
        specialty: string;
        surgical?: {
            jejum_horas?: string;
            hora_chegada?: string;
            medicamentos_suspender?: string;
            cuidados_pos?: string;
        };
        financial_config?: {
            multa_atraso: string; // ex: '2%'
            juros_mensal: string; // ex: '1%'
        };
    };
    financial?: {
        total_value: number;
        installment_count?: number;
        installment_value?: number;
        due_list?: string[]; // Ex: "10/01/2026", "10/02/2026"
        installments_data?: { number: number; dueDate: string; value: number; method?: string }[];
    };
    clinical?: {
        procedure_name: string;
        surgical_date?: string;
        posology?: string; // HTML ou texto quebra de linha
        attestation_days?: string;
    };
    payment?: {
        amount: number;
        installment_index: number;
    };
    clinic?: {
        name: string;
        cnpj: string;
        address: string;
    };
}

/**
 * 🛡️ TemplateService (Engine de Variáveis)
 * 
 * Responsável por injetar dados reais nos templates coringa.
 * Opera como um "Mail Merge" de alta precisão.
 */
export class TemplateService {

    /**
     * Lista de Variáveis Disponíveis para o Editor
     */
    static getAvailableVariables() {
        return [
            // Paciente
            { id: 'paciente_nome', label: 'Nome do Paciente', category: 'Paciente' },
            { id: 'paciente_cpf', label: 'CPF do Paciente', category: 'Paciente' },
            { id: 'paciente_endereco', label: 'Endereço Completo', category: 'Paciente' },

            // Financeiro (Orçamento)
            { id: 'valor_total', label: 'Valor Total (R$)', category: 'Financeiro' },
            { id: 'valor_parcela', label: 'Valor Parcela', category: 'Financeiro' },
            { id: 'qtd_parcelas', label: 'Qtd. Parcelas', category: 'Financeiro' },
            { id: 'tabela_investimento', label: 'Tabela de Investimento (Extrato)', category: 'Financeiro' },
            { id: 'nota_promissoria', label: 'Texto Promissória', category: 'Financeiro' },
            { id: 'multa_atraso', label: 'Multa Atraso (%)', category: 'Financeiro' },
            { id: 'juros_mensal', label: 'Juros Mensal (%)', category: 'Financeiro' },

            // Financeiro (Recibo)
            { id: 'valor_pago', label: 'Valor Pago', category: 'Recibo' },
            { id: 'numero_parcela', label: 'Nº Parcela', category: 'Recibo' },

            // Clínico
            { id: 'procedimento_nome', label: 'Procedimento', category: 'Clínico' },
            { id: 'data_cirurgia', label: 'Data Cirurgia', category: 'Clínico' },
            { id: 'posologia', label: 'Posologia (Receita)', category: 'Receituário' },
            { id: 'dias_repouso', label: 'Dias de Repouso', category: 'Atestado' },

            // Cirurgia (Pré e Pós)
            { id: 'jejum_horas', label: 'Horas em Jejum', category: 'Cirurgia' },
            { id: 'hora_chegada', label: 'Hora de Chegada', category: 'Cirurgia' },
            { id: 'medicamentos_suspender', label: 'Meds. a Suspender', category: 'Cirurgia' },
            { id: 'cuidados_pos', label: 'Cuidados Pós-Op (HTML)', category: 'Cirurgia' },

            // Profissional
            { id: 'dr_nome', label: 'Nome Doutor(a)', category: 'Profissional' },
            { id: 'dr_cro', label: 'CRO', category: 'Profissional' },

            // Clínica
            { id: 'clinica_nome', label: 'Nome Clínica', category: 'Institucional' },
            { id: 'data_hoje', label: 'Data de Hoje', category: 'Geral' },
        ];
    }

    static process(content: string, context: TemplateContext): string {
        let processed = content;

        // 1. Variáveis Simples
        const replacements: Record<string, string> = {
            '{{paciente_nome}}': context.patient?.name || '[NOME_PACIENTE]',
            '{{paciente_cpf}}': context.patient?.cpf || '___.___.___-__',
            '{{paciente_endereco}}': context.patient?.address || '__________________________',

            '{{dr_nome}}': context.professional?.name || '[DR_NOME]',
            '{{dr_cro}}': context.professional?.cro || '[CRO]',

            '{{procedimento_nome}}': context.clinical?.procedure_name || 'Procedimento Odontológico',
            '{{dias_repouso}}': context.clinical?.attestation_days || '1 (um)',

            '{{valor_total}}': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.financial?.total_value || 0),
            '{{qtd_parcelas}}': (context.financial?.installment_count || 1).toString(),
            '{{valor_parcela}}': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((context.financial?.installment_value || (context.financial?.total_value || 0) / (context.financial?.installment_count || 1))),

            '{{data_hoje}}': new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
            '{{clinica_nome}}': context.clinic?.name || 'ClinicPro',

            // Cirurgia
            '{{jejum_horas}}': context.professional?.surgical?.jejum_horas || '8',
            '{{hora_chegada}}': context.professional?.surgical?.hora_chegada || '07:00 (1h antes)',
            '{{medicamentos_suspender}}': context.professional?.surgical?.medicamentos_suspender || 'N/A',

            // Financeiro Config
            '{{multa_atraso}}': context.professional?.financial_config?.multa_atraso || '2%',
            '{{juros_mensal}}': context.professional?.financial_config?.juros_mensal || '1%',

            // Recibo
            '{{valor_pago}}': context.payment?.amount
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.payment.amount)
                : '[VALOR_PAGO]',
            '{{numero_parcela}}': context.payment?.installment_index?.toString() || '[N]',

            // Data Cirurgia
            '{{data_cirurgia}}': context.clinical?.surgical_date
                ? format(new Date(context.clinical.surgical_date), "dd/MM/yyyy")
                : '[DATA_CIRURGIA]',
        };

        // 2. Executar Substituição (Simples)
        Object.entries(replacements).forEach(([key, value]) => {
            processed = processed.split(key).join(value);
        });

        // 3. Cuidados Pós (HTML) - Fallback
        if (processed.includes('{{cuidados_pos}}')) {
            const defaultCare = context.professional?.surgical?.cuidados_pos || `<div class="grid grid-cols-1 gap-4 text-sm text-slate-700">
                <div class="flex gap-4 items-start p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span class="text-xl">🥗</span>
                    <div>
                        <strong class="text-blue-900 block mb-1">Alimentação</strong>
                        Dieta líquida/pastosa e fria nas primeiras 24h. Evitar alimentos quentes, duros ou ácidos.
                    </div>
                </div>
                <div class="flex gap-4 items-start p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                    <span class="text-xl">🛌</span>
                    <div>
                        <strong class="text-purple-900 block mb-1">Repouso & Posição</strong>
                        Manter a cabeça elevada (2 travesseiros) ao dormir por 3 noites. Evitar esforço físico por 15 dias.
                    </div>
                </div>
                <div class="flex gap-4 items-start p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                    <span class="text-xl">🧼</span>
                    <div>
                        <strong class="text-rose-900 block mb-1">Higiene & Curativo</strong>
                        Não molhar o curativo nas primeiras 48h. Realizar bochechos leves com clorexidina (se prescrito).
                    </div>
                </div>
                <div class="flex gap-4 items-start p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                    <span class="text-xl">⚠️</span>
                    <div>
                        <strong class="text-amber-900 block mb-1">Sinais de Alerta</strong>
                        Inchaço máximo ocorre em 48h. Em caso de febre (>38°C) ou sangramento intenso, contate a clínica.
                    </div>
                </div>
            </div>`;
            processed = processed.replace('{{cuidados_pos}}', defaultCare);
        }

        // 4. Posologia (HTML)
        if (processed.includes('{{posologia}}')) {
            processed = processed.replace('{{posologia}}', context.clinical?.posology || '<p>Uso conforme orientação.</p>');
        }

        // 5. Lógica Especial: Tabela de Investimento
        if (processed.includes('{{tabela_investimento}}')) {
            if (context.financial?.installments_data) {
                const tableHTML = generateFinancialTableHTML(context.financial.installments_data, context.financial.total_value || 0);
                processed = processed.split('{{tabela_investimento}}').join(tableHTML);
            } else {
                const fallback = `<div class="p-4 bg-yellow-50 text-yellow-600 text-xs border border-yellow-200 rounded">Dados de parcelamento insuficientes para gerar a tabela.</div>`;
                processed = processed.split('{{tabela_investimento}}').join(fallback);
            }
        }

        // 6. Lógica Especial: Nota Promissória Automática
        if (processed.includes('{{nota_promissoria}}')) {
            const firstDueDate = context.financial?.due_list?.[0] || format(new Date(), "dd/MM/yyyy");
            const installments = context.financial?.installment_count || 1;
            const installmentValue = replacements['{{valor_parcela}}'];
            const totalValue = replacements['{{valor_total}}'];

            const promissoriaTexto = `Reconheço(emos) dever e pagarei(emos) por esta ÚNICA VIA DE NOTA PROMISSÓRIA a ${context.clinic?.name || 'CLÍNICA'}, ou à sua ordem, a quantia de ${totalValue} dividida em ${installments} parcelas de ${installmentValue}, vencendo-se a primeira em ${firstDueDate}.`;
            processed = processed.split('{{nota_promissoria}}').join(promissoriaTexto);
        }

        return this.injectLegalFooter(processed);
    }

    private static injectLegalFooter(content: string): string {
        // Se já tiver rodapé, não duplica
        if (content.includes('id="legal-footer"')) return content;

        const footer = `
            <div id="legal-footer" style="margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; font-family: sans-serif; text-align: center; color: #666;">
                <p style="font-size: 10px; margin-bottom: 5px;">Documento gerado digitalmente pelo ClinicPro Elite em ${new Date().toLocaleString('pt-BR')}.</p>
                <div style="margin-top: 30px; display: inline-block; text-align: center;">
                     <p style="margin-bottom: 5px;">_________________________________________________</p>
                     <p style="font-weight: bold; font-size: 12px; margin: 0;">ASSINATURA DO PACIENTE / RESPONSÁVEL</p>
                     <p style="font-size: 9px; margin-top: 5px; color: #999;">
                        IP: <span style="font-family: monospace;">Wait for Signature...</span> | 
                        Hash: <span style="font-family: monospace;">${Math.random().toString(36).substring(7).toUpperCase()}</span>
                     </p>
                </div>
            </div>
        `;

        return content + footer;
    }
}
