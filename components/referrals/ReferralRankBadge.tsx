// =====================================================
// COMPONENTE: ReferralRankBadge
// =====================================================

import React from 'react';
import { Trophy, Award, Medal } from 'lucide-react';

interface Props {
    rank: number;
}

export const ReferralRankBadge: React.FC<Props> = ({ rank }) => {
    if (rank === 1) {
        return (
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
                <Trophy className="w-4 h-4" />
                <span>🥇 1º Lugar</span>
            </div>
        );
    }

    if (rank === 2) {
        return (
            <div className="flex items-center gap-2 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 px-3 py-1.5 rounded-full font-bold text-sm shadow-md">
                <Award className="w-4 h-4" />
                <span>🥈 2º Lugar</span>
            </div>
        );
    }

    if (rank === 3) {
        return (
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-md">
                <Medal className="w-4 h-4" />
                <span>🥉 3º Lugar</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full font-bold text-sm">
            {rank}º
        </div>
    );
};
