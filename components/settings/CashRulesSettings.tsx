import React, { useState, useEffect } from "react";
import { SettingsService } from "../../services/settingsService";
import { ClinicFinancialSettings } from "../../types";
import { Loader2, Save, ShieldCheck, AlertTriangle, DollarSign } from "lucide-react";

const CashRulesSettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Partial<ClinicFinancialSettings>>({
        force_cash_opening: true,
        force_daily_closing: true,
        allow_negative_balance: false,
        blind_closing: true,
        default_change_fund: 100.0,
        max_difference_without_approval: 50.0,
    });
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error";
    } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await SettingsService.getFinancialSettings();
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error("Erro ao carregar configurações financeiras:", error);
            setToast({
                message: "Erro ao carregar configurações. Verifique sua conexão.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await SettingsService.updateFinancialSettings(settings);
            setToast({
                message: "Regras financeiras atualizadas com sucesso!",
                type: "success",
            });
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            setToast({
                message: "Erro ao salvar alterações.",
                type: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (key: keyof ClinicFinancialSettings) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key as keyof ClinicFinancialSettings],
        }));
    };

    const handleNumberChange = (key: keyof ClinicFinancialSettings, value: string) => {
        const num = parseFloat(value);
        setSettings((prev) => ({
            ...prev,
            [key]: isNaN(num) ? 0 : num,
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando regras...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-green-600" />
                        Regras de Caixa (Fort Knox)
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Configure as regras de segurança para movimentações financeiras e controle de caixa.
                    </p>
                </div>
            </div>

            {toast && (
                <div
                    className={`p-4 rounded-lg border ${toast.type === "success"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                >
                    {toast.message}
                    <button onClick={() => setToast(null)} className="float-right font-bold ml-2">
                        ×
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Controle de Sessão */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                        <DollarSign className="h-5 w-5 text-blue-500" />
                        Controle de Sessão
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="pt-1">
                                <input
                                    type="checkbox"
                                    id="force_cash_opening"
                                    checked={!!settings.force_cash_opening}
                                    onChange={() => handleToggle("force_cash_opening")}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="force_cash_opening" className="font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                                    Obrigar abertura de caixa
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Bloqueia qualquer movimentação financeira (recebimento/pagamento) se o usuário não tiver um caixa aberto.
                                </p>
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-700" />

                        <div className="flex items-start gap-3">
                            <div className="pt-1">
                                <input
                                    type="checkbox"
                                    id="force_daily_closing"
                                    checked={!!settings.force_daily_closing}
                                    onChange={() => handleToggle("force_daily_closing")}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="force_daily_closing" className="font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                                    Obrigar fechamento diário
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Impede que um caixa permaneça aberto por mais de 24 horas.
                                </p>
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-gray-700" />

                        <div className="flex items-start gap-3">
                            <div className="pt-1">
                                <input
                                    type="checkbox"
                                    id="allow_negative_balance"
                                    checked={!!settings.allow_negative_balance}
                                    onChange={() => handleToggle("allow_negative_balance")}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="allow_negative_balance" className="font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                                    Permitir saldo negativo
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Se desmarcado, impede saídas maiores que o saldo atual do caixa.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Auditoria e Segurança */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Auditoria e Fechamento
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="pt-1">
                                <input
                                    type="checkbox"
                                    id="blind_closing"
                                    checked={!!settings.blind_closing}
                                    onChange={() => handleToggle("blind_closing")}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="blind_closing" className="font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                                    Fechamento Cego
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    O operador deve contar e informar o valor físico sem ver o saldo calculado pelo sistema.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Limite para Quebra de Caixa (R$)
                                </label>
                                <input
                                    type="number"
                                    value={settings.max_difference_without_approval}
                                    onChange={(e) => handleNumberChange("max_difference_without_approval", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Diferenças acima deste valor exigirão justificativa obrigatória e notificarão o administrador.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Fundo de Troco Padrão (R$)
                                </label>
                                <input
                                    type="number"
                                    value={settings.default_change_fund}
                                    onChange={(e) => handleNumberChange("default_change_fund", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="100.00"
                                    step="0.01"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Valor sugerido ao abrir um novo caixa.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            Salvar Regras
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CashRulesSettings;
