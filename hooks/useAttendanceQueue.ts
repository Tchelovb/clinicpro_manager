import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface QueueItem {
    id: string;
    patient_id: string;
    patients?: {
        name: string;
        phone: string;
        profile_photo_url?: string;
    };
    professional_id?: string;
    professional?: {
        name: string;
    };
    status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'COMPLETED'; // Normalized statuses
    arrival_time: string;
    start_time?: string;
    end_time?: string;
    type: 'ORCAMENTO' | 'CLINICA' | 'EVALUATION' | 'TREATMENT' | 'RETURN' | 'URGENCY';
    risk_level?: 'A' | 'B' | 'C' | 'D';
    notes?: string;
    transaction_id?: string;
    billing_verified?: boolean;
    appointment_id?: string;
}

export const useAttendanceQueue = (clinicId: string | undefined) => {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadQueue = useCallback(async (background = false) => {
        if (!clinicId) return;

        try {
            if (!background) setLoading(true);

            const { data, error } = await supabase
                .from('attendance_queue')
                .select(`
                    *,
                    patients (name, phone, profile_photo_url, patient_score, bad_debtor),
                    professional: users!professional_id (name)
                `)
                .eq('clinic_id', clinicId)
                .in('status', ['WAITING', 'IN_PROGRESS', 'FINISHED', 'COMPLETED']) // Include FINISHED for checkout column
                .order('arrival_time', { ascending: true });

            if (error) throw error;

            const queueItems: QueueItem[] = (data || []).map((item: any) => ({
                id: item.id,
                patient_id: item.patient_id,
                patients: item.patients,
                professional_id: item.professional_id,
                professional: item.professional,
                status: item.status,
                arrival_time: item.arrival_time,
                start_time: item.start_time,
                end_time: item.end_time,
                type: item.type || 'CLINICA',
                risk_level: item.patients?.patient_score === 'diamond' ? 'A' : 'C', // Example mapping or use direct field
                notes: item.notes,
                transaction_id: item.transaction_id,
                billing_verified: item.billing_verified,
                appointment_id: item.appointment_id
            }));

            setQueue(queueItems);
        } catch (error) {
            console.error('Error loading queue:', error);
            if (!background) toast.error('Erro ao carregar fila de atendimento');
        } finally {
            if (!background) setLoading(false);
        }
    }, [clinicId]);

    // Initial load and Auto-refresh setup
    useEffect(() => {
        loadQueue();
        const interval = setInterval(() => loadQueue(true), 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, [loadQueue]);

    return {
        queue,
        loading,
        refresh: () => loadQueue(false),
        setQueue // Exposed for optimistic updates if needed
    };
};
