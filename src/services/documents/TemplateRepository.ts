
import { supabase } from '../../lib/supabase';

export interface DBTemplate {
    id: string;
    name: string;
    category: string;
    content: string;
    procedure_tag?: string;
    is_glamour_enabled: boolean;
}

export class TemplateRepository {

    static async getAllTemplates(clinicId: string): Promise<DBTemplate[]> {
        const { data, error } = await supabase
            .from('elite_document_templates')
            .select('*')
            .eq('clinic_id', clinicId);

        if (error) {
            console.error('Error fetching templates:', error);
            return [];
        }
        return data || [];
    }

    static async getTemplatesByProtocol(clinicId: string, procedureId: string): Promise<DBTemplate[]> {
        // Query complexa: Traz os templates que estão na tabela de join procedure_protocols
        const { data, error } = await supabase
            .from('procedure_protocols')
            .select(`
                template:template_id (*)
            `)
            .eq('procedure_id', procedureId);

        if (error) {
            console.error('Error fetching protocol:', error);
            return [];
        }

        // Flatten result
        return data.map((item: any) => item.template).filter(Boolean);
    }
}
