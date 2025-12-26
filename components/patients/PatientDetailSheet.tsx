import React, { useState } from 'react';
import { PatientDetailSheet as NewPatientDetailSheet } from '../PatientDetail';
import { NewPatientSheet } from './NewPatientSheet';
import SecurityPinModal from '../SecurityPinModal';
import toast from 'react-hot-toast';

interface PatientDetailSheetProps {
    patientId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PatientDetailSheet({ patientId, open, onOpenChange }: PatientDetailSheetProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [showEditSheet, setShowEditSheet] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [showSecurityModal, setShowSecurityModal] = useState(false);

    const handleEdit = (patient: any) => {
        setEditData(patient);
        setShowEditSheet(true);
    };

    const handleEditSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleDeleteRequest = () => {
        setShowSecurityModal(true);
    }

    const handleSecuritySuccess = () => {
        toast.success("Paciente arquivado com segurança!");
        onOpenChange(false);
    };

    return (
        <>
            <NewPatientDetailSheet
                key={refreshKey}
                patientId={patientId || undefined}
                open={open}
                onClose={() => onOpenChange(false)}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
            />

            <NewPatientSheet
                open={showEditSheet}
                onOpenChange={setShowEditSheet}
                initialData={editData}
                onSuccess={handleEditSuccess}
            />

            <SecurityPinModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
                onSuccess={handleSecuritySuccess}
                title="Arquivar Paciente"
                description="Digite seu PIN para confirmar o arquivamento deste paciente."
            />
        </>
    );
}
