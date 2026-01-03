
import { supabase } from '../../lib/supabase';

export interface AnamnesisQuestion {
    id: string;
    pergunta: string;
    tipo: 'texto' | 'booleano' | 'selecao_unica' | 'selecao_multipla' | 'escala';
    opcoes?: string[];
    min?: number;
    max?: number;
}

export interface AnamnesisSection {
    titulo: string;
    perguntas: AnamnesisQuestion[];
}

export interface AnamnesisTemplate {
    id: string;
    title: string;
    type: 'GERAL_ODONTO' | 'ESTETICA_FACIAL' | 'PREFERENCIAS_PESSOAIS' | 'POS_OPERATORIO';
    questions: {
        secoes: AnamnesisSection[];
    };
}

export interface AnamnesisResponse {
    id: string;
    template_id: string;
    patient_id: string;
    responses: Record<string, any>;
    created_at: string;
}

export class AnamnesisRepository {

    // Busca os modelos disponíveis para a clínica
    static async getTemplates(clinicId: string): Promise<AnamnesisTemplate[]> {
        const { data, error } = await supabase
            .from('anamnesis_templates')
            .select('*')
            // .eq('clinic_id', clinicId) // Assumindo que os templates foram inseridos globalmente ou com clinic_id
            .order('title');

        if (error) {
            console.error('Error fetching anamnesis templates:', error);
            return [];
        }
        return data || [];
    }

    // Salva as respostas do paciente
    static async saveResponse(patientId: string, templateId: string, responses: Record<string, any>) {
        const { data, error } = await supabase
            .from('patient_anamnesis_responses')
            .insert([{
                patient_id: patientId,
                template_id: templateId,
                responses: responses,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        return data[0];
    }

    // Busca o histórico de anamneses de um paciente
    static async getPatientHistory(patientId: string): Promise<AnamnesisResponse[]> {
        const { data, error } = await supabase
            .from('patient_anamnesis_responses')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching history:', error);
            return [];
        }
        return data || [];
    }
}
