// =====================================================
// COMPONENTE: LabOrderForm
// =====================================================

import React, { useState } from 'react';
import { LabOrderService } from '@/services/labOrderService';
import { CreateLabOrderDTO, LabOrderWorkType } from '@/types/labOrders';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

interface Props {
    patientId?: string;
    patientName?: string;
    onClose: () => void;
    onSuccess: () => void;
}

const WORK_TYPES: { value: LabOrderWorkType; label: string }[] = [
    { value: 'CROWN', label: 'Coroa' },
    { value: 'BRIDGE', label: 'Ponte' },
    { value: 'DENTURE', label: 'Prótese Total' },
    { value: 'IMPLANT', label: 'Implante' },
    { value: 'VENEER', label: 'Faceta/Lente' },
    { value: 'ORTHODONTIC', label: 'Ortodôntico' },
    { value: 'OTHER', label: 'Outro' }
];

export const LabOrderForm: React.FC<Props> = ({ patientId, patientName, onClose, onSuccess }) => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<CreateLabOrderDTO>>({
        clinic_id: profile?.clinic_id || '',
        patient_id: patientId || '',
        professional_id: profile?.id || '',
        supplier_name: '',
        work_description: '',
        work_type: 'CROWN',
        quantity: 1,
        sent_date: new Date().toISOString().split('T')[0],
        expected_return_date: '',
        cost: 0,
        shade_guide: '',
        material: '',
        special_instructions: '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.supplier_name || !formData.work_description || !formData.expected_return_date) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);
        try {
            await LabOrderService.createOrder(formData as CreateLabOrderDTO);
            toast.success('Pedido de laboratório criado com sucesso!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating lab order:', error);
            toast.error('Erro ao criar pedido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Novo Pedido de Laboratório</h2>
                        {patientName && <p className="text-sm text-gray-500 mt-1">Paciente: {patientName}</p>}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Laboratório */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Laboratório *
                        </label>
                        <input
                            type="text"
                            value={formData.supplier_name}
                            onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nome do laboratório"
                            required
                        />
                    </div>

                    {/* Tipo de Trabalho */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Trabalho *
                            </label>
                            <select
                                value={formData.work_type}
                                onChange={(e) => setFormData({ ...formData, work_type: e.target.value as LabOrderWorkType })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {WORK_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantidade
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição do Trabalho *
                        </label>
                        <textarea
                            value={formData.work_description}
                            onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="Ex: Coroa em Zircônia - Dente 11"
                            required
                        />
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data de Envio
                            </label>
                            <input
                                type="date"
                                value={formData.sent_date}
                                onChange={(e) => setFormData({ ...formData, sent_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Previsão de Retorno *
                            </label>
                            <input
                                type="date"
                                value={formData.expected_return_date}
                                onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>
                    </div>

                    {/* Detalhes Técnicos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cor (Shade)
                            </label>
                            <input
                                type="text"
                                value={formData.shade_guide}
                                onChange={(e) => setFormData({ ...formData, shade_guide: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ex: A2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Material
                            </label>
                            <input
                                type="text"
                                value={formData.material}
                                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ex: Zircônia"
                            />
                        </div>
                    </div>

                    {/* Custo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Custo (R$)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.cost}
                            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Instruções Especiais */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instruções Especiais
                        </label>
                        <textarea
                            value={formData.special_instructions}
                            onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                            placeholder="Observações para o laboratório"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Criando...' : 'Criar Pedido'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
