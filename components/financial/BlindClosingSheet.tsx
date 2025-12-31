import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    Lock, DollarSign, CreditCard, Banknote,
    AlertTriangle, CheckCircle, Eye, EyeOff, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FinancialActionHandler } from './FinancialActionHandler';
import SecurityPinModal from '../SecurityPinModal';

interface BlindClosingSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cashRegisterId: string;
    onSuccess: () => void;
}

interface CashRegister {
    id: string;
    opening_balance: number;
    calculated_balance: number;
    opened_at: string;
}

interface FinancialSettings {
    blind_closing: boolean;
    max_difference_without_approval: number;
}

/**
 * BlindClosingSheet - Gaveta de Fechamento Cego
 * 
 * Implementa o padrão bancário de fechamento de caixa:
 * - Modo Cego: Operador não vê o saldo esperado
 * - Validação de Diferença: Exige PIN se gap > limite
 * - Registro Imutável: Salva em cash_registers.gap_found
 * - Auditoria: Registra quem fechou e quando
 * 
 * Fluxo:
 * 1. Operador conta dinheiro físico
 * 2. Operador conta transações de cartão (NSUs)
 * 3. Sistema calcula diferença
 * 4. Se diferença > limite: Exige PIN de supervisor
 * 5. Fecha caixa e registra gap
 */
export const BlindClosingSheet: React.FC<BlindClosingSheetProps> = ({
    open,
    onOpenChange,
    cashRegisterId,
    onSuccess
}) => {
    const { profile } = useAuth();

    // Estados do formulário
    const [declaredCash, setDeclaredCash] = useState(0);
    const [declaredCardTotal, setDeclaredCardTotal] = useState(0);
    const [observations, setObservations] = useState('');

    // Estados de controle
    const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
    const [settings, setSettings] = useState<FinancialSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [showExpected, setShowExpected] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinValidated, setPinValidated] = useState(false);

    // Cálculos
    const totalDeclared = declaredCash + declaredCardTotal;
    const expectedBalance = cashRegister?.calculated_balance || 0;
    const difference = totalDeclared - expectedBalance;
    const absDifference = Math.abs(difference);
    const requiresApproval = settings
        ? absDifference > settings.max_difference_without_approval
        : false;

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open, cashRegisterId]);

    const loadData = async () => {
        setLoadingData(true);
        try {
            // Buscar caixa
            const { data: registerData } = await supabase
                .from('cash_registers')
                .select('*')
                .eq('id', cashRegisterId)
                .single();

            setCashRegister(registerData);

            // Buscar configurações
            const { data: settingsData } = await supabase
                .from('clinic_financial_settings')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .single();

            setSettings(settingsData);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados do caixa');
        } finally {
            setLoadingData(false);
        }
    };

    const validateForm = (): boolean => {
        if (declaredCash < 0) {
            toast.error('Valor de dinheiro não pode ser negativo');
            return false;
        }

        if (declaredCardTotal < 0) {
            toast.error('Valor de cartão não pode ser negativo');
            return false;
        }

        if (requiresApproval && !pinValidated) {
            toast.error('🔒 Diferença acima do limite! Aprovação de supervisor necessária.');
            setShowPinModal(true);
            return false;
        }

        return true;
    };

    const handleConfirm = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            // 1. Fechar caixa
            const { error: closeError } = await supabase
                .from('cash_registers')
                .update({
                    status: 'CLOSED',
                    closed_at: new Date().toISOString(),
                    declared_balance: totalDeclared,
                    closing_balance: totalDeclared,
                    gap_found: difference,
                    difference_reason: observations.trim() || null,
                    observations: observations.trim() || null
                })
                .eq('id', cashRegisterId);

            if (closeError) throw closeError;

            // 2. Registrar auditoria
            await supabase
                .from('financial_audit_trail')
                .insert({
                    table_name: 'cash_registers',
                    record_id: cashRegisterId,
                    action_type: 'UPDATE',
                    old_data: {
                        status: 'OPEN',
                        calculated_balance: expectedBalance
                    },
                    new_data: {
                        status: 'CLOSED',
                        declared_balance: totalDeclared,
                        gap_found: difference,
                        requires_approval: requiresApproval,
                        pin_validated: pinValidated
                    },
                    notes: `Fechamento de caixa ${settings?.blind_closing ? '(MODO CEGO)' : ''} - Gap: R$ ${difference.toFixed(2)}`,
                    user_id: profile?.id
                });

            // 3. Se houver diferença significativa, criar alerta
            if (requiresApproval) {
                await supabase
                    .from('system_audit_logs')
                    .insert({
                        clinic_id: profile?.clinic_id,
                        user_id: profile?.id,
                        user_name: profile?.name,
                        action_type: 'UPDATE',
                        entity_type: 'CASH_REGISTER',
                        entity_id: cashRegisterId,
                        changes_summary: `Fechamento com diferença de R$ ${absDifference.toFixed(2)} - Aprovado por supervisor`,
                        ip_address: null
                    });
            }

            toast.success(
                difference === 0
                    ? '✅ Caixa fechado! Valores conferem perfeitamente.'
                    : `⚠️ Caixa fechado com diferença de R$ ${absDifference.toFixed(2)}`
            );

            onSuccess();
            onOpenChange(false);

        } catch (error: any) {
            console.error('Erro ao fechar caixa:', error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePinValidated = () => {
        setPinValidated(true);
        setShowPinModal(false);
        toast.success('✅ PIN validado! Você pode prosseguir com o fechamento.');
    };

    return (
        <>
            <FinancialActionHandler
                open={open}
                onOpenChange={onOpenChange}
                title="🔒 Fechamento de Caixa"
                description={settings?.blind_closing ? "Modo Cego Ativado - Conte o dinheiro sem ver o saldo esperado" : "Confira os valores e feche o caixa"}
                maxWidth="2xl"
            >
                <div className="space-y-6">
                    {/* Alerta de Modo Cego */}
                    {settings?.blind_closing && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 flex items-start gap-3">
                            <Lock className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" size={20} />
                            <div>
                                <p className="font-bold text-amber-900 dark:text-amber-100">🔐 Modo Cego Ativado</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    O sistema não mostrará o saldo esperado. Conte o dinheiro físico e os comprovantes de cartão com atenção total.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Informações do Caixa */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Shield className="text-blue-600 dark:text-blue-400" size={20} />
                            <h3 className="font-bold text-blue-900 dark:text-blue-100">Informações do Caixa</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-blue-600 dark:text-blue-400 mb-1">Abertura</p>
                                <p className="font-bold text-blue-900 dark:text-blue-100">
                                    {cashRegister ? new Date(cashRegister.opened_at).toLocaleString('pt-BR') : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-blue-600 dark:text-blue-400 mb-1">Saldo Inicial</p>
                                <p className="font-bold text-blue-900 dark:text-blue-100">
                                    R$ {cashRegister?.opening_balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Etapa 1: Dinheiro Físico */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <Banknote size={16} className="text-green-600" />
                            Dinheiro Físico Contado *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">R$</span>
                            <input
                                type="number"
                                value={declaredCash}
                                onChange={(e) => setDeclaredCash(parseFloat(e.target.value) || 0)}
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white text-lg font-bold"
                                step="0.01"
                                placeholder="0,00"
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            💵 Conte todas as notas e moedas no caixa
                        </p>
                    </div>

                    {/* Etapa 2: Cartões */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <CreditCard size={16} className="text-blue-600" />
                            Total de Cartões (Soma dos NSUs) *
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">R$</span>
                            <input
                                type="number"
                                value={declaredCardTotal}
                                onChange={(e) => setDeclaredCardTotal(parseFloat(e.target.value) || 0)}
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white text-lg font-bold"
                                step="0.01"
                                placeholder="0,00"
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            💳 Some todos os comprovantes de cartão/Pix
                        </p>
                    </div>

                    {/* Total Declarado */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-green-900 dark:text-green-100">Total Declarado:</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                R$ {totalDeclared.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Botão para Revelar Saldo (Modo Cego) */}
                    {settings?.blind_closing && !showExpected && (
                        <button
                            onClick={() => setShowExpected(true)}
                            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Eye size={20} />
                            Revelar Saldo Esperado (Opcional)
                        </button>
                    )}

                    {/* Comparação (Visível se não for modo cego OU se usuário revelou) */}
                    {(!settings?.blind_closing || showExpected) && (
                        <div className={`border-2 rounded-lg p-4 ${difference === 0
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                            : difference > 0
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                            }`}>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Esperado:</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        R$ {expectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Declarado:</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        R$ {totalDeclared.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <span className="font-bold text-gray-900 dark:text-white">Diferença:</span>
                                    <span className={`text-2xl font-bold ${difference === 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : difference > 0
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {difference > 0 ? '+' : ''}{difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alerta de Aprovação Necessária */}
                    {requiresApproval && !pinValidated && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
                            <AlertTriangle className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" size={20} />
                            <div>
                                <p className="font-bold text-red-900 dark:text-red-100">🔒 Aprovação de Supervisor Necessária</p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    A diferença de R$ {absDifference.toFixed(2)} está acima do limite de R$ {settings?.max_difference_without_approval.toFixed(2)}.
                                    Será necessário validar com PIN de supervisor.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Observações {requiresApproval && '(Obrigatório)'}
                        </label>
                        <textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder={requiresApproval ? "Explique o motivo da diferença..." : "Adicione observações sobre o fechamento..."}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white h-20 resize-none"
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading || loadingData}
                            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                        >
                            {loading ? (
                                <>Processando...</>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Fechar Caixa
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </FinancialActionHandler>

            {/* Modal de PIN */}
            <SecurityPinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={handlePinValidated}
                title="Aprovação de Fechamento com Diferença"
                message={`Diferença de R$ ${absDifference.toFixed(2)} detectada. Insira o PIN de supervisor para aprovar.`}
            />
        </>
    );
};

export default BlindClosingSheet;
