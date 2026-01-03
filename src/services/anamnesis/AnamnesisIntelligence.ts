
import { AnamnesisResponse } from './AnamnesisRepository';

export interface MedicalAlert {
    type: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'INFO';
    title: string;
    message: string;
    sourceQuestion: string;
}

export interface SalesOpportunity {
    procedure: string;
    reason: string;
    probability: 'HIGH' | 'MEDIUM';
}

export class AnamnesisIntelligence {

    static analyze(responses: Record<string, any>): { alerts: MedicalAlert[], opportunities: SalesOpportunity[] } {
        const alerts: MedicalAlert[] = [];
        const opportunities: SalesOpportunity[] = [];

        // --- 1. Análise de Risco Médico (Blindagem) ---

        // Alergias (h_1)
        const alergia = responses['h_1'];
        if (alergia && typeof alergia === 'string' && alergia.length > 2 && !alergia.toLowerCase().includes('não') && !alergia.toLowerCase().includes('nao') && !alergia.toLowerCase().includes('nennhuma')) {
            alerts.push({
                type: 'CRITICAL',
                title: 'ALERGIA MEDICAMENTOSA',
                message: `Paciente relatou alergia: "${alergia}". Atenção redobrada na prescrição.`,
                sourceQuestion: 'Alergia (h_1)'
            });
        }

        // Comorbidades (h_2 - Multi Select)
        const comorbidades = responses['h_2'];
        if (Array.isArray(comorbidades)) {
            if (comorbidades.includes('Hipertensão')) {
                alerts.push({ type: 'HIGH', title: 'HIPERTENSÃO', message: 'Monitorar PA pré-operatória. Evitar vasoconstritores em excesso.', sourceQuestion: 'h_2' });
            }
            if (comorbidades.includes('Diabetes')) {
                alerts.push({ type: 'HIGH', title: 'DIABETES', message: 'Atenção à cicatrização e glicemia. Cuidado com infecções.', sourceQuestion: 'h_2' });
            }
            if (comorbidades.includes('Cardiopatia')) {
                alerts.push({ type: 'CRITICAL', title: 'CARDIOPATIA', message: 'Solicitar avaliação cardiológica/risco cirúrgico se necessário.', sourceQuestion: 'h_2' });
            }
        }

        // Anticoagulantes (h_3 - Boolean)
        if (responses['h_3'] === true) {
            alerts.push({
                type: 'CRITICAL',
                title: 'USO DE ANTICOAGULANTES',
                message: 'Risco de hemorragia. Verificar necessidade de suspensão com médico assistente.',
                sourceQuestion: 'h_3'
            });
        }

        // Queloides (e_2)
        if (responses['e_2'] === true) {
            alerts.push({ type: 'MODERATE', title: 'RISCO DE QUELOIDE', message: 'Histórico de má cicatrização. Avaliar técnica de sutura.', sourceQuestion: 'e_2' });
        }


        // --- 2. Perfil Psicológico (Luxo) ---

        // Medo de Agulha (p_3)
        const medo = responses['p_3'];
        if (medo === 'Muito receoso(a)' || medo === 'Ansioso(a)') {
            alerts.push({
                type: 'INFO',
                title: 'PACIENTE ANSIOSO',
                message: 'Prepare sedação oral ou óxido nitroso. Use abordagem calmante.',
                sourceQuestion: 'p_3' // Preferências Pessoais
            });
        }


        // --- 3. Oportunidades de Venda (High Ticket) ---

        // Pescoço / Mandíbula (e_3 - Escala 1-10)
        const satisfacaoPescoço = responses['e_3'];
        if (typeof satisfacaoPescoço === 'number' && satisfacaoPescoço <= 6) {
            opportunities.push({
                procedure: 'Cervicoplastia / Lipo de Papada',
                reason: `Paciente avaliou pescoço/mandíbula como nota ${satisfacaoPescoço}/10.`,
                probability: 'HIGH'
            });
        }

        // Região que incomoda (e_4 - Texto)
        const incomodo = responses['e_4'];
        if (incomodo && typeof incomodo === 'string') {
            const text = incomodo.toLowerCase();
            if (text.includes('olho') || text.includes('palpebra') || text.includes('pé de galinha')) {
                opportunities.push({ procedure: 'Blefaroplastia / Botox', reason: 'Queixa em região periorbital.', probability: 'HIGH' });
            }
            if (text.includes('bigode') || text.includes('boca') || text.includes('labio')) {
                opportunities.push({ procedure: 'Preenchimento Labial / Bigode Chinês', reason: 'Queixa em terço inferior.', probability: 'MEDIUM' });
            }
            if (text.includes('testa') || text.includes('ruga')) {
                opportunities.push({ procedure: 'Toxina Botulínica (Botox)', reason: 'Queixa de rugas/testa.', probability: 'HIGH' });
            }
        }

        return { alerts, opportunities };
    }
}
