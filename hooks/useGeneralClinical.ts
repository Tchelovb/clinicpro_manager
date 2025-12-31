import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface GeneralTreatment {
    id: string;
    procedure_name: string;
    tooth_number?: number;
    created_at: string;
    execution_date?: string;
    status: string;
}

export interface DentalChartItem {
    id: string;
    tooth_number: number;
    status_code: 'SOUND' | 'DECAYED' | 'FILLED' | 'MISSING' | 'IMPLANT' | 'CROWN' | 'VENEER' | 'ENDODONTIC' | 'FRACTURED' | 'EXTRACTED';
    existing_material?: string;
    condition_notes?: string;
}

export interface MedicalAlert {
    id: string;
    alert_type: string;
    description: string;
    severity: string;
    is_critical: boolean;
}

export const useGeneralClinical = (patientId: string) => {
    const [treatments, setTreatments] = useState<GeneralTreatment[]>([]);
    const [dentalChart, setDentalChart] = useState<DentalChartItem[]>([]);
    const [medicalAlerts, setMedicalAlerts] = useState<MedicalAlert[]>([]);
    const [anamnesis, setAnamnesis] = useState<any>(null);
    const [clinicalNotes, setClinicalNotes] = useState<any[]>([]); // Using any for now or define interface
    const [loading, setLoading] = useState(true);

    const loadGeneralData = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const [treatmentsRes, chartRes, alertsRes, anamnesisRes, notesRes] = await Promise.all([
                supabase
                    .from('treatment_items')
                    .select('*')
                    .eq('patient_id', patientId)
                    .eq('category', 'CLINICA_GERAL')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('dental_charting')
                    .select('*')
                    .eq('patient_id', patientId),
                supabase
                    .from('medical_alerts')
                    .select('*')
                    .eq('patient_id', patientId)
                    .eq('is_active', true),
                supabase
                    .from('patient_anamnesis')
                    .select('*')
                    .eq('patient_id', patientId)
                    .maybeSingle(),
                supabase
                    .from('clinical_notes')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('created_at', { ascending: false })
            ]);

            if (treatmentsRes.error) throw treatmentsRes.error;
            if (chartRes.error && chartRes.error.code !== 'PGRST116') throw chartRes.error;
            if (alertsRes.error) throw alertsRes.error;
            if (anamnesisRes.error && anamnesisRes.error.code !== 'PGRST116') throw anamnesisRes.error;
            if (notesRes.error) throw notesRes.error;

            setTreatments(treatmentsRes.data || []);
            setDentalChart(chartRes.data || []);
            setMedicalAlerts(alertsRes.data || []);
            setAnamnesis(anamnesisRes.data || null);
            setClinicalNotes(notesRes.data || []);
        } catch (error) {
            console.error('Error loading General Clinical data:', error);
            toast.error('Erro ao carregar dados clínicos');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        loadGeneralData();
    }, [loadGeneralData]);

    return {
        treatments,
        dentalChart,
        medicalAlerts,
        anamnesis,
        clinicalNotes,
        loading,
        refresh: loadGeneralData
    };
};
