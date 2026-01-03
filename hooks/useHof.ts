import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../src/lib/supabase';
import toast from 'react-hot-toast';

export interface HofTreatment {
    id: string;
    procedure_name: string;
    region?: string;
    created_at: string;
    observations?: string;
}

export interface ClinicalImage {
    id: string;
    file_url: string;
    thumbnail_url?: string;
    region?: string;
    created_at: string;
    tags?: string[];
}

export const useHof = (patientId: string) => {
    const [treatments, setTreatments] = useState<HofTreatment[]>([]);
    const [images, setImages] = useState<ClinicalImage[]>([]);
    const [activeContract, setActiveContract] = useState<any>(null); // New state for Contract
    const [loading, setLoading] = useState(true);

    const loadHofData = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const [treatmentsRes, imagesRes, contractsRes] = await Promise.all([
                supabase
                    .from('treatment_items')
                    .select('*')
                    .eq('patient_id', patientId)
                    .eq('category', 'HOF')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('clinical_images')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('created_at', { ascending: false })
                    .limit(10),
                supabase // Fetch Active Contracts
                    .from('recurring_contracts')
                    .select('*')
                    .eq('patient_id', patientId)
                    .in('status', ['ACTIVE', 'SUSPENDED'])
                    .limit(1)
            ]);

            if (treatmentsRes.error) throw treatmentsRes.error;
            if (imagesRes.error) throw imagesRes.error;
            if (contractsRes.error && contractsRes.error.code !== 'PGRST116') throw contractsRes.error;

            setTreatments(treatmentsRes.data || []);
            setImages(imagesRes.data || []);
            setActiveContract(contractsRes.data?.[0] || null);
        } catch (error) {
            console.error('Error loading HOF data:', error);
            toast.error('Erro ao carregar dados de HOF');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        loadHofData();
    }, [loadHofData]);

    return {
        treatments,
        images,
        activeContract, // Expose active contract
        loading,
        refresh: loadHofData
    };
};
