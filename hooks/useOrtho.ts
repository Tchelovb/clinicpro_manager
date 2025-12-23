import { useState, useEffect, useCallback } from 'react';
import { orthoService, OrthoContract, OrthoTreatmentPlan, OrthoAppointment } from '../services/orthoService';
import toast from 'react-hot-toast';

interface UseOrthoReturn {
    activeContract: OrthoContract | null;
    treatmentPlan: OrthoTreatmentPlan | null;
    appointments: OrthoAppointment[];
    loading: boolean;
    error: any;
    refresh: () => Promise<void>;
    createAppointment: (appointment: Partial<OrthoAppointment>) => Promise<void>;
    updatePlan: (updates: Partial<OrthoTreatmentPlan>) => Promise<void>;
}

export const useOrtho = (patientId: string, clinicId: string): UseOrthoReturn => {
    const [activeContract, setActiveContract] = useState<OrthoContract | null>(null);
    const [treatmentPlan, setTreatmentPlan] = useState<OrthoTreatmentPlan | null>(null);
    const [appointments, setAppointments] = useState<OrthoAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    const loadOrthoData = useCallback(async () => {
        if (!patientId || !clinicId) return;
        setLoading(true);
        try {
            // 1. Get Contracts for Patient
            const contracts = await orthoService.getContractsByPatient(patientId);
            const active = contracts.find(c => c.status === 'ACTIVE' || c.status === 'SUSPENDED');

            setActiveContract(active || null);

            if (active) {
                // 2. Get Treatment Plan
                const plan = await orthoService.getTreatmentPlanByContract(active.id);
                setTreatmentPlan(plan);

                // 3. Get Appointments
                if (plan) {
                    const appts = await orthoService.getAppointmentsByTreatmentPlan(plan.id);
                    setAppointments(appts);
                }
            } else {
                setTreatmentPlan(null);
                setAppointments([]);
            }
        } catch (err) {
            console.error('Error loading ortho data:', err);
            setError(err);
            toast.error('Erro ao carregar dados de ortodontia');
        } finally {
            setLoading(false);
        }
    }, [patientId, clinicId]);

    useEffect(() => {
        loadOrthoData();
    }, [loadOrthoData]);

    const createAppointment = async (appointment: Partial<OrthoAppointment>) => {
        // PROTECTION: If no plan exists but contract is active, create a default one
        let planId = treatmentPlan?.id;

        if (!planId) {
            if (!activeContract) {
                toast.error('Nenhum contrato ativo encontrado.');
                return;
            }

            console.warn('⚠️ No treatment plan found. Creating default plan for contract:', activeContract.id);
            try {
                const newPlan = await orthoService.createTreatmentPlan({
                    contract_id: activeContract.id,
                    current_phase: 'DIAGNOSIS',
                    change_frequency_days: 30,
                    total_aligners_upper: 0,
                    total_aligners_lower: 0,
                    current_aligner_upper: 0,
                    current_aligner_lower: 0
                });
                planId = newPlan.id;
                setTreatmentPlan(newPlan); // Optimistic update
            } catch (createPlanError) {
                console.error('Failed to create default treatment plan:', createPlanError);
                toast.error('Erro crítico: Falha ao inicializar plano de tratamento.');
                throw createPlanError;
            }
        }

        try {
            await orthoService.createOrthoAppointment({
                ...appointment,
                treatment_plan_id: planId,
                patient_id: patientId,
                clinic_id: clinicId
            });
            await loadOrthoData(); // Reload all data to ensure consistency
            toast.success('Evolução registrada com sucesso');
        } catch (err: any) {
            console.error('Error creating appt:', err);
            toast.error('Erro ao registrar evolução');
            throw err;
        }
    };

    const updatePlan = async (updates: Partial<OrthoTreatmentPlan>) => {
        if (!treatmentPlan) return;
        try {
            await orthoService.updateTreatmentPlan(treatmentPlan.id, updates);
            // Optimistic update or reload
            setTreatmentPlan(prev => prev ? { ...prev, ...updates } : null);
        } catch (err) {
            console.error('Error updating plan:', err);
            throw err;
        }
    };

    return {
        activeContract,
        treatmentPlan,
        appointments,
        loading,
        error,
        refresh: loadOrthoData,
        createAppointment,
        updatePlan
    };
};
