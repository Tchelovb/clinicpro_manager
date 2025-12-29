import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    User,
    UserPlus,
    Calendar,
    DollarSign,
    Stethoscope,
    FileText,
    Loader2,
} from 'lucide-react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from './command';
import { Button } from './button';
import { useSheetStore } from '../../stores/useSheetStore';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { debounce } from 'lodash';
import { cn } from '../../lib/utils';

interface Patient {
    id: string;
    name: string;
    phone: string;
    email?: string;
}

interface Lead {
    id: string;
    name: string;
    phone: string;
    email?: string;
    source?: string;
}

interface SearchContentProps {
    onSelectResult?: () => void;
    className?: string;
}

export function SearchContent({ onSelectResult, className }: SearchContentProps) {
    const { openSheet } = useSheetStore();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounced search function
    const searchData = useCallback(
        debounce(async (searchQuery: string) => {
            if (!searchQuery || searchQuery.length < 2) {
                setPatients([]);
                setLeads([]);
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                // Search patients - FIXED: removed photo_url
                const { data: patientsData, error: patientsError } = await supabase
                    .from('patients')
                    .select('id, name, phone, email')
                    .eq('clinic_id', profile?.clinic_id)
                    .ilike('name', `%${searchQuery}%`)
                    .limit(10);

                // If no results by name, try phone
                let finalPatientsData = patientsData;
                if (!patientsData || patientsData.length === 0) {
                    const { data: phoneData } = await supabase
                        .from('patients')
                        .select('id, name, phone, email')
                        .eq('clinic_id', profile?.clinic_id)
                        .ilike('phone', `%${searchQuery}%`)
                        .limit(10);
                    finalPatientsData = phoneData;
                }

                if (patientsError) {
                    console.error('Patients search error:', patientsError);
                }

                // Search leads
                const { data: leadsData, error: leadsError } = await supabase
                    .from('leads')
                    .select('id, name, phone, email, source')
                    .eq('clinic_id', profile?.clinic_id)
                    .ilike('name', `%${searchQuery}%`)
                    .limit(10);

                if (leadsError) {
                    console.error('Leads search error:', leadsError);
                }

                setPatients(finalPatientsData || []);
                setLeads(leadsData || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        }, 300),
        [profile?.clinic_id]
    );

    // Trigger search on query change
    useEffect(() => {
        searchData(query);
    }, [query, searchData]);

    const handlePatientClick = (patientId: string, tab: 'overview' | 'financial' | 'budgets' | 'clinical' = 'overview') => {
        openSheet(patientId, tab);
        onSelectResult?.();
    };

    const handleLeadClick = (leadId: string) => {
        navigate(`/leads`);
        onSelectResult?.();
    };

    const handleQuickAction = (action: string) => {
        onSelectResult?.();
        switch (action) {
            case 'new-patient':
                navigate('/patients');
                break;
            case 'new-appointment':
                navigate('/agenda');
                break;
            case 'financial':
                navigate('/financial');
                break;
            default:
                break;
        }
    };

    return (
        <Command className={cn("rounded-lg border shadow-md bg-white dark:bg-slate-900", className)}>
            <CommandInput
                placeholder="Buscar paciente, lead ou navegar..."
                value={query}
                onValueChange={setQuery}
                className="border-0"
            />
            <CommandList>
                {/* Only show content when user has typed something */}
                {query.length > 0 ? (
                    <>
                        <CommandEmpty>
                            {loading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                </div>
                            ) : (
                                'Nenhum resultado encontrado.'
                            )}
                        </CommandEmpty>

                        {/* Quick Actions - only when searching */}
                        <CommandGroup heading="Ações Rápidas">
                            <CommandItem onSelect={() => handleQuickAction('new-patient')}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                <span>Novo Paciente</span>
                            </CommandItem>
                            <CommandItem onSelect={() => handleQuickAction('new-appointment')}>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Novo Agendamento</span>
                            </CommandItem>
                            <CommandItem onSelect={() => handleQuickAction('financial')}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                <span>Financeiro</span>
                            </CommandItem>
                        </CommandGroup>

                        {/* Patients */}
                        {patients.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Pacientes">
                                    {patients.map((patient) => (
                                        <CommandItem
                                            key={patient.id}
                                            value={patient.name}
                                            onSelect={() => handlePatientClick(patient.id)}
                                            className="flex justify-between items-center group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                <div>
                                                    <p className="font-medium">{patient.name}</p>
                                                    <p className="text-xs text-slate-500">{patient.phone}</p>
                                                </div>
                                            </div>

                                            {/* Deep Linking Icons */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePatientClick(patient.id, 'financial');
                                                    }}
                                                    title="Abrir Financeiro"
                                                >
                                                    <DollarSign className="h-3 w-3 text-emerald-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePatientClick(patient.id, 'budgets');
                                                    }}
                                                    title="Abrir Orçamentos"
                                                >
                                                    <FileText className="h-3 w-3 text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePatientClick(patient.id, 'clinical');
                                                    }}
                                                    title="Abrir Clínica"
                                                >
                                                    <Stethoscope className="h-3 w-3 text-purple-600" />
                                                </Button>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}

                        {/* Leads */}
                        {leads.length > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="Leads">
                                    {leads.map((lead) => (
                                        <CommandItem
                                            key={lead.id}
                                            value={lead.name}
                                            onSelect={() => handleLeadClick(lead.id)}
                                        >
                                            <User className="mr-2 h-4 w-4 text-slate-400" />
                                            <div>
                                                <p className="font-medium">{lead.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {lead.phone} • {lead.source}
                                                </p>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </>
                ) : (
                    // Empty state - show nothing to keep UI clean
                    <div className="py-6 text-center text-sm text-slate-400">
                        Digite para buscar pacientes, leads ou ações...
                    </div>
                )}
            </CommandList>
        </Command>
    );
}
