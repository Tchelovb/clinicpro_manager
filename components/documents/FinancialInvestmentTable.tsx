import React from 'react';

interface Installment {
    number: number;
    dueDate: string;
    value: number;
    method?: string; // 'PIX', 'CARTÃO', 'BOLETO'
}

interface FinancialTableProps {
    installments: Installment[];
    totalValue: number;
}

/**
 * 🔒 TABELA DE INVESTIMENTO ELITE (PRIVATE BANKING STANDARD)
 * Renderiza uma tabela financeira com estética de alta precisão.
 */
export const FinancialInvestmentTable: React.FC<FinancialTableProps> = ({ installments, totalValue }) => {
    return (
        <div className="w-full border border-slate-200 rounded-xl overflow-hidden font-inter my-6">
            {/* Cabeçalho */}
            <div className="bg-slate-50 border-b border-slate-200 grid grid-cols-12 px-4 py-2">
                <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parcela</div>
                <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vencimento</div>
                <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Valor</div>
                <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Método</div>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-slate-100">
                {installments.map((inst) => (
                    <div key={inst.number} className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors">
                        <div className="col-span-2 text-xs font-medium text-slate-600">
                            {inst.number.toString().padStart(2, '0')}
                        </div>
                        <div className="col-span-4 text-xs font-mono text-slate-600">
                            {inst.dueDate}
                        </div>
                        <div className="col-span-3 text-sm font-mono font-semibold text-slate-900 text-right">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.value)}
                        </div>
                        <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">
                            {inst.method || 'BOLETO'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Rodapé Totalizador */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-4 flex justify-between items-end">
                <div className="text-[10px] text-slate-400 max-w-[60%] leading-relaxed">
                    * O atraso no pagamento implicará multa de 2% e juros moratórios de 1% ao mês.
                    Condições válidas por 15 dias.
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total do Investimento</div>
                    <div className="text-xl font-bold text-slate-900 font-mono tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Helper para gerar HTML Estático (Simulação de SSR para o TipTap)
 * Como não temos ReactDOMServer no contexto do browser puro sem config extra fácil,
 * vamos gerar a string HTML manualmente com a mesma estrutura de classes Tailwind.
 */
export const generateFinancialTableHTML = (installments: Installment[], totalValue: number) => {
    const rows = installments.map(inst => `
        <div style="display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); padding: 0.75rem 1rem; align-items: center; border-bottom: 1px solid #f1f5f9;">
            <div style="grid-column: span 2 / span 2; font-size: 0.75rem; font-weight: 500; color: #475569;">${inst.number.toString().padStart(2, '0')}</div>
            <div style="grid-column: span 4 / span 4; font-size: 0.75rem; font-family: monospace; color: #475569;">${inst.dueDate}</div>
            <div style="grid-column: span 3 / span 3; font-size: 0.875rem; font-family: monospace; font-weight: 600; color: #0f172a; text-align: right;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.value)}</div>
            <div style="grid-column: span 3 / span 3; font-size: 0.625rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.025em; text-align: right;">${inst.method || 'BOLETO'}</div>
        </div>
    `).join('');

    const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue);

    // Retorna HTML com estilos inline para garantir compatibilidade com e-mail/print se CSS falhar, 
    // mas mantendo classes Tailwind para o preview.
    return `
        <div class="financial-table" style="width: 100%; border: 1px solid #e2e8f0; border-radius: 0.75rem; overflow: hidden; margin: 1.5rem 0; font-family: sans-serif;">
            <!-- Header -->
            <div style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); padding: 0.5rem 1rem;">
                <div style="grid-column: span 2; font-size: 0.625rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Parcela</div>
                <div style="grid-column: span 4; font-size: 0.625rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Vencimento</div>
                <div style="grid-column: span 3; font-size: 0.625rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; text-align: right;">Valor</div>
                <div style="grid-column: span 3; font-size: 0.625rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; text-align: right;">Método</div>
            </div>
            
            <!-- Rows -->
            <div style="background-color: white;">
                ${rows}
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 1rem; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="font-size: 0.625rem; color: #94a3b8; max-width: 60%; line-height: 1.5;">
                    * O atraso no pagamento implicará multa de 2% e juros moratórios de 1% ao mês. Condições válidas por 15 dias.
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.625rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem;">Total do Investimento</div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #0f172a; font-family: monospace;">${totalFormatted}</div>
                </div>
            </div>
        </div>
    `;
};
