import React, { useState } from 'react';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import { BaseSheet } from '../ui/BaseSheet'; // Assuming this exists from previous context

const CardMachineConfig: React.FC = () => {
    // Mock Data for "Sheet First" implementation
    const [profiles, setProfiles] = useState([
        { id: 1, name: 'Stone Principal', debit_rate: 1.49, active: true },
        { id: 2, name: 'Cielo Reserva', debit_rate: 1.99, active: false },
    ]);
    const [openSheet, setOpenSheet] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-slate-900">Taxas de Cartão</h3>
                    <p className="text-sm text-slate-500">Cadastre as taxas da sua maquininha para cálculo líquido.</p>
                </div>
                <button
                    onClick={() => setOpenSheet(true)}
                    className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition"
                >
                    <Plus size={16} />
                    Nova Maquininha
                </button>
            </div>

            <div className="grid gap-4">
                {profiles.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${p.active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-900">{p.name}</h4>
                                <p className="text-xs text-slate-500">Débito: {p.debit_rate}%</p>
                            </div>
                        </div>
                        <div className="text-sm text-slate-400">
                            {p.active ? 'Ativo' : 'Inativo'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Placeholder Sheet - In real impl, would be a separate component */}
            {openSheet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h4 className="text-lg font-bold mb-4">Nova Maquininha</h4>
                        <p className="text-sm text-slate-500 mb-4">Esta funcionalidade será implementada completamente com a integração do banco de dados.</p>
                        <button onClick={() => setOpenSheet(false)} className="w-full bg-slate-200 py-2 rounded-md">Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardMachineConfig;
