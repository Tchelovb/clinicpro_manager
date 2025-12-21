// =====================================================
// TYPES: PROGRAMA DE INDICAÇÕES (REFERRAL PROGRAM)
// =====================================================

export interface ReferralStats {
    referrer_patient_id: string;
    referrer_name: string;
    total_referrals: number;
    total_revenue_from_referrals: number;
    referred_patients: string[];
}

export interface ReferralLeaderboard {
    rank: number;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    patient_email?: string;
    total_referrals: number;
    total_revenue: number;
    patient_score?: 'DIAMOND' | 'GOLD' | 'STANDARD' | 'RISK' | 'BLACKLIST';
    last_referral_date?: string;
}

export interface ReferralDetail {
    referred_patient_id: string;
    referred_patient_name: string;
    referred_patient_phone: string;
    referral_date: string;
    total_approved: number;
    status: string;
}

export interface ReferralReward {
    id: string;
    patient_id: string;
    reward_type: 'DISCOUNT' | 'CREDIT' | 'GIFT' | 'FREE_SERVICE';
    reward_value: number;
    reward_description: string;
    earned_date: string;
    redeemed_date?: string;
    status: 'PENDING' | 'REDEEMED' | 'EXPIRED';
}
