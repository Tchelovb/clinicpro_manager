import React, { useState } from 'react';
import { getCurrentClinicId, supabase } from '../../src/lib/supabase';
import { Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TaxConfiguration: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [taxConfig, setTaxConfig] = useState({
        tax_regime: 'SIMPLES_NACIONAL',
        federal_tax_rate: 6.00,
        state_tax_rate: 0.00,
        municipal_tax_rate: 0.00,
        iss_retained: false
    });

    // TODO: Load from DB (clinics table)

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        // Simulate save
        setTimeout(() => {
            setSaving(false);
            toast.success("Configurações fiscais salvas (Simulação)");
        }, 1000);
    };

    return (
        <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg border border-slate-200">
            <div>
                <h3 className="text-lg font-medium text-slate-900">Configuração Fiscal</h3>
                <p className="text-sm text-slate-500">Defina as alíquotas para cálculo automático de impostos no Profit Engine.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Regime Tributário</label>
                    <select
                        value={taxConfig.tax_regime}
                        onChange={e => setTaxConfig({ ...taxConfig, tax_regime: e.target.value })}
                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    >
                        <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                        <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                        <option value="LUCRO_REAL">Lucro Real</option>
                        <option value="AUTONOMO">Pessoa Física / Autônomo</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alíquota Federal Total (%)</label>
                    <div className="relative rounded-md shadow-sm">
                        <input
                            type="number"
                            step="0.01"
                            value={taxConfig.federal_tax_rate}
                            onChange={e => setTaxConfig({ ...taxConfig, federal_tax_rate: parseFloat(e.target.value) })}
                            className="block w-full rounded-md border-slate-300 pl-3 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Ex: 6.00% para primeira faixa do Simples</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ISS (Municipal) (%)</label>
                    <div className="relative rounded-md shadow-sm">
                        <input
                            type="number"
                            step="0.01"
                            value={taxConfig.municipal_tax_rate}
                            onChange={e => setTaxConfig({ ...taxConfig, municipal_tax_rate: parseFloat(e.target.value) })}
                            className="block w-full rounded-md border-slate-300 pl-3 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        id="iss_retained"
                        type="checkbox"
                        checked={taxConfig.iss_retained}
                        onChange={e => setTaxConfig({ ...taxConfig, iss_retained: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="iss_retained" className="ml-2 block text-sm text-gray-900">
                        ISS Retido na Fonte (Nota Fiscal de Serviço)
                    </label>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Configuração Fiscal
                </button>
            </div>
        </form>
    );
};

export default TaxConfiguration;
