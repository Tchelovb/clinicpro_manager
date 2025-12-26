import { supabase } from '../lib/supabase';

// =====================================================
// RISK MATRIX CONFIGURATION
// =====================================================

export type RiskTier = 'A' | 'B' | 'C' | 'D';

export interface RiskProfile {
    tier: RiskTier;
    label: string;
    color: string;
    maxInstallments: number;
    minDownPayment: number; // Percentage
    requiresGuarantor: boolean;
    markupPercent: number; // Markup for boleto/carnê
    allowBoleto: boolean;
}

export const RISK_MATRIX: Record<RiskTier, RiskProfile> = {
    A: {
        tier: 'A',
        label: 'Excelente',
        color: 'green',
        maxInstallments: 24,
        minDownPayment: 0,
        requiresGuarantor: false,
        markupPercent: 10,
        allowBoleto: true
    },
    B: {
        tier: 'B',
        label: 'Bom',
        color: 'blue',
        maxInstallments: 12,
        minDownPayment: 20,
        requiresGuarantor: false,
        markupPercent: 20,
        allowBoleto: true
    },
    C: {
        tier: 'C',
        label: 'Regular',
        color: 'orange',
        maxInstallments: 6,
        minDownPayment: 40,
        requiresGuarantor: true,
        markupPercent: 35,
        allowBoleto: true
    },
    D: {
        tier: 'D',
        label: 'Restrito',
        color: 'red',
        maxInstallments: 1,
        minDownPayment: 100,
        requiresGuarantor: false,
        markupPercent: 0,
        allowBoleto: false // Apenas Cartão/Pix
    }
};

// =====================================================
// TYPES
// =====================================================

export interface CreditAnalysisResult {
    cpf: string;
    score: number;
    tier: RiskTier;
    profile: RiskProfile;
    analysisDate: string;
    restrictions?: string[];
    recommendation: string;
}

export interface CreditProfile {
    id: string;
    patient_id?: string;
    lead_id?: string;
    cpf: string;
    score: number;
    tier: RiskTier;
    analysis_data: any;
    created_at: string;
    updated_at: string;
}

// =====================================================
// SERVICE
// =====================================================

export const creditRiskService = {
    /**
     * Analyze credit risk based on score
     * In production, this would call an external API (Serasa, SPC, etc.)
     */
    async analyzeCreditRisk(cpf: string, patientId?: string, leadId?: string): Promise<CreditAnalysisResult> {
        try {
            // 1. Check if we have a recent analysis (< 30 days)
            const existingAnalysis = await this.getRecentAnalysis(cpf);
            if (existingAnalysis) {
                console.log('Using cached credit analysis');
                return this.mapProfileToResult(existingAnalysis);
            }

            // 2. Perform new analysis
            // TODO: Integrate with real credit bureau API (Serasa, SPC, etc.)
            const score = await this.fetchCreditScore(cpf);

            // 3. Determine risk tier
            const tier = this.calculateRiskTier(score);
            const profile = RISK_MATRIX[tier];

            // 4. Generate recommendation
            const recommendation = this.generateRecommendation(tier, profile);

            // 5. Save to database
            const analysisData = {
                cpf,
                score,
                tier,
                profile,
                analysisDate: new Date().toISOString(),
                recommendation
            };

            await this.saveCreditProfile({
                patient_id: patientId,
                lead_id: leadId,
                cpf,
                score,
                tier,
                analysis_data: analysisData
            });

            return analysisData;

        } catch (error) {
            console.error('Error analyzing credit risk:', error);
            throw new Error('Falha ao analisar crédito. Tente novamente.');
        }
    },

    /**
     * Fetch credit score from external API
     * MOCK: In production, replace with real API call
     */
    async fetchCreditScore(cpf: string): Promise<number> {
        // MOCK: Simulate API call
        // In production: const response = await fetch('https://api.serasa.com.br/...')

        // For demo purposes, generate a score based on CPF
        const cpfDigits = cpf.replace(/\D/g, '');
        const lastDigit = parseInt(cpfDigits.slice(-1));

        // Simulate score distribution
        if (lastDigit >= 8) return 850; // Tier A
        if (lastDigit >= 5) return 700; // Tier B
        if (lastDigit >= 2) return 500; // Tier C
        return 300; // Tier D

        // TODO: Replace with real API
        // const response = await fetch(`${process.env.CREDIT_API_URL}/score`, {
        //     method: 'POST',
        //     headers: { 'Authorization': `Bearer ${process.env.CREDIT_API_KEY}` },
        //     body: JSON.stringify({ cpf })
        // });
        // const data = await response.json();
        // return data.score;
    },

    /**
     * Calculate risk tier based on score
     */
    calculateRiskTier(score: number): RiskTier {
        if (score > 800) return 'A';
        if (score >= 600) return 'B';
        if (score >= 400) return 'C';
        return 'D';
    },

    /**
     * Generate recommendation text
     */
    generateRecommendation(tier: RiskTier, profile: RiskProfile): string {
        const recommendations: Record<RiskTier, string> = {
            A: `Cliente excelente! Liberado para até ${profile.maxInstallments}x sem entrada. Ofereça condições especiais.`,
            B: `Cliente bom. Máximo ${profile.maxInstallments}x com ${profile.minDownPayment}% de entrada.`,
            C: `Cliente regular. Exige ${profile.minDownPayment}% de entrada e avalista. Máximo ${profile.maxInstallments}x.`,
            D: `ATENÇÃO: Cliente restrito. Aceitar apenas Cartão/Pix à vista. NÃO oferecer boleto/carnê.`
        };
        return recommendations[tier];
    },

    /**
     * Get recent analysis (< 30 days)
     */
    async getRecentAnalysis(cpf: string): Promise<CreditProfile | null> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
            .from('credit_profiles')
            .select('*')
            .eq('cpf', cpf)
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching credit profile:', error);
            return null;
        }

        return data;
    },

    /**
     * Save credit profile to database
     */
    async saveCreditProfile(profile: Partial<CreditProfile>): Promise<void> {
        const { error } = await supabase
            .from('credit_profiles')
            .insert([profile]);

        if (error) {
            console.error('Error saving credit profile:', error);
            throw error;
        }
    },

    /**
     * Map database profile to result
     */
    mapProfileToResult(profile: CreditProfile): CreditAnalysisResult {
        const tier = profile.tier;
        const riskProfile = RISK_MATRIX[tier];

        return {
            cpf: profile.cpf,
            score: profile.score,
            tier,
            profile: riskProfile,
            analysisDate: profile.created_at,
            recommendation: this.generateRecommendation(tier, riskProfile)
        };
    },

    /**
     * Calculate markup for boleto based on risk tier
     */
    calculateBoletoMarkup(baseValue: number, tier: RiskTier): number {
        const profile = RISK_MATRIX[tier];
        if (!profile.allowBoleto) return 0;

        return baseValue * (profile.markupPercent / 100);
    },

    /**
     * Calculate final price with markup
     */
    calculateBoletoPrice(baseValue: number, tier: RiskTier): number {
        const markup = this.calculateBoletoMarkup(baseValue, tier);
        return baseValue + markup;
    },

    /**
     * Get payment options based on risk tier
     */
    getPaymentOptions(tier: RiskTier, totalValue: number) {
        const profile = RISK_MATRIX[tier];

        const smartPrice = totalValue; // Cartão/Pix (sem markup)
        const boletoPrice = profile.allowBoleto
            ? this.calculateBoletoPrice(totalValue, tier)
            : null;

        return {
            smart: {
                label: 'Valor Smart (Cartão/Pix)',
                price: smartPrice,
                maxInstallments: 12, // Cartão sempre permite mais parcelas
                minDownPayment: 0,
                description: 'Pagamento à vista ou parcelado no cartão'
            },
            boleto: boletoPrice ? {
                label: 'Valor Crediário (Boleto/Carnê)',
                price: boletoPrice,
                maxInstallments: profile.maxInstallments,
                minDownPayment: profile.minDownPayment,
                requiresGuarantor: profile.requiresGuarantor,
                description: `Parcelado em até ${profile.maxInstallments}x${profile.minDownPayment > 0 ? ` com ${profile.minDownPayment}% de entrada` : ''}`
            } : null
        };
    }
};
