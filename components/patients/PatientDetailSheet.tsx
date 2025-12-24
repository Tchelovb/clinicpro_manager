import React, { useState } from 'react';
import { BaseSheet } from '../ui/BaseSheet';
import { PatientDetailContent } from '../PatientDetail';
import { NewPatientSheet } from './NewPatientSheet';
import { SecurityPinModal } from '../security/SecurityPinModal';
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
        // Mock deletion logic
        toast.success("Paciente arquivado com segurança!");
        onOpenChange(false);
    };

    return (
        <>
            <BaseSheet
                open={open}
                onOpenChange={onOpenChange}
                title="Dossiê do Paciente"
                size="full"
                hideHeader={true}
            >
                {open && patientId && (
                    <PatientDetailContent
                        key={refreshKey}
                        patientId={patientId}
                        onClose={() => onOpenChange(false)}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                    />
                )}
            </BaseSheet>

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
