// =====================================================
// COMPONENTE: ConfirmationActions
// =====================================================

import React from 'react';
import { Check, X, MessageCircle, Phone, Calendar } from 'lucide-react';
import { ConfirmationService } from '@/services/confirmationService';
import { toast } from 'react-hot-toast';

interface Props {
    confirmationId: string;
    appointmentId: string;
    patientPhone: string;
    patientName: string;
    onUpdate: () => void;
}

export const ConfirmationActions: React.FC<Props> = ({
    confirmationId,
    appointmentId,
    patientPhone,
    patientName,
    onUpdate
}) => {

    const handleConfirm = async (method: 'WHATSAPP' | 'PHONE') => {
        try {
            await ConfirmationService.confirmAppointment(confirmationId, 'RECEPTIONIST', method);
            toast.success('Consulta confirmada com sucesso!');
            onUpdate();
        } catch (error) {
            toast.error('Erro ao confirmar consulta');
        }
    };

    const handleCancel = async () => {
        const reason = window.prompt('Motivo do cancelamento:');
        if (!reason) return;

        try {
            await ConfirmationService.cancelAppointment(confirmationId, reason);
            toast.success('Consulta cancelada');
            onUpdate();
        } catch (error) {
            toast.error('Erro ao cancelar consulta');
        }
    };

    const handleWhatsApp = () => {
        // Formatar telefone (assumindo apenas números)
        const cleanPhone = patientPhone.replace(/\D/g, '');
        const message = `Olá ${patientName}, gostaria de confirmar sua consulta na nossa clínica. Podemos confirmar?`;
        const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;

        // Log do envio (mock integration)
        ConfirmationService.sendReminder(appointmentId, 'WHATSAPP', message);

        window.open(url, '_blank');
    };

    return (
        <div className="flex space-x-2">
            <button
                onClick={() => handleWhatsApp()}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-full"
                title="Enviar WhatsApp"
            >
                <MessageCircle size={18} />
            </button>

            <button
                onClick={() => handleConfirm('PHONE')}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                title="Confirmar por Telefone"
            >
                <Phone size={18} />
            </button>

            <button
                onClick={() => handleConfirm('WHATSAPP')}
                className="p-1.5 text-green-700 hover:bg-green-50 rounded-full"
                title="Marcar como Confirmado"
            >
                <Check size={18} />
            </button>

            <button
                onClick={handleCancel}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                title="Cancelar Consulta"
            >
                <X size={18} />
            </button>

            <button
                onClick={() => toast('Funcionalidade de reagendamento em breve!')}
                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-full"
                title="Solicitar Reagendamento"
            >
                <Calendar size={18} />
            </button>
        </div>
    );
};
