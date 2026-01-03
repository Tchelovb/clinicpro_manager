import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProfessionalLedger } from '../components/professional/ProfessionalLedger';
import { Button } from '../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users } from 'lucide-react';
import { supabase } from '../src/lib/supabase';

const ProfessionalFinancial: React.FC = () => {
    const { profile } = useAuth();
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
    const [professionals, setProfessionals] = useState<any[]>([]);

    React.useEffect(() => {
        loadProfessionals();
    }, [profile?.clinic_id]);

    const loadProfessionals = async () => {
        if (!profile?.clinic_id) {
            console.warn('⚠️ Professionals Load: No clinic_id found in profile', profile);
            return;
        }

        console.log('🔄 Loading professionals table for clinic:', profile.clinic_id);

        try {
            const { data, error } = await supabase
                .from('professionals')
                .select('id, name, active, is_active')
                .eq('clinic_id', profile.clinic_id)
                .order('name');

            if (error) {
                console.error('❌ Error fetching from professionals table:', error);
                throw error;
            }

            console.log('✅ Professionals fetched:', data);

            // Filter active ones manually to handle mixed 'active'/'is_active' columns
            const activeProfessionals = data?.filter(p => p.active === true || p.is_active === true) || [];

            console.log('🎯 Active Professionals:', activeProfessionals);

            setProfessionals(activeProfessionals);

            if (activeProfessionals.length > 0 && !selectedProfessionalId) {
                setSelectedProfessionalId(activeProfessionals[0].id);
            }
        } catch (error) {
            console.error('❌ Critical error loading professionals:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Extrato do Profissional</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Acompanhe comissões, débitos e saldo disponível
                        </p>
                    </div>

                    {/* Professional Selector */}
                    <div className="flex items-center gap-3">
                        <Users className="text-slate-400 dark:text-slate-500" size={20} />
                        <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
                            <SelectTrigger className="w-64 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                                <SelectValue placeholder="Selecione o profissional" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                {professionals.map(prof => (
                                    <SelectItem
                                        key={prof.id}
                                        value={prof.id}
                                        className="dark:text-slate-100 dark:focus:bg-slate-800"
                                    >
                                        {prof.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Ledger */}
                {selectedProfessionalId ? (
                    <ProfessionalLedger professionalId={selectedProfessionalId} />
                ) : (
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="text-slate-300 dark:text-slate-700 mb-4" size={64} />
                            <p className="text-slate-500 dark:text-slate-400 text-center">
                                Selecione um profissional para visualizar o extrato
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ProfessionalFinancial;
