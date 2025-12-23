import React, { useState } from 'react';
import { Save, Camera, Construction, Siren, Info } from 'lucide-react';
import { OrthoContract } from '../../services/orthoService';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "../ui/sheet";

interface OrthoEvolutionFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contract: OrthoContract;
    onSave: (data: any) => Promise<void>;
}

export const OrthoEvolutionForm: React.FC<OrthoEvolutionFormProps> = ({
    open,
    onOpenChange,
    contract,
    onSave
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        appointment_type: 'MAINTENANCE',
        archwire_upper: '',
        archwire_lower: '',
        elastics_upper: '',
        elastics_lower: '',
        chain_upper: '',
        chain_lower: '',
        current_aligner_upper: 0,
        current_aligner_lower: 0,
        aligners_delivered_from: 0,
        aligners_delivered_to: 0,
        hygiene_score: 5,
        compliance_score: 5,
        notes: '',
        next_visit_interval_days: 30
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error('Error in form:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle>Nova Evolução</SheetTitle>
                    <SheetDescription>
                        Registre os detalhes da consulta de hoje.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. Tipo de Visita */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium leading-none">Tipo de Visita</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'MAINTENANCE', label: 'Manutenção', icon: Construction },
                                { id: 'EMERGENCY', label: 'Emergência', icon: Siren },
                                { id: 'INSTALLATION', label: 'Instalação', icon: Info }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, appointment_type: type.id })}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-md border text-xs font-medium transition-all ${formData.appointment_type === type.id
                                            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                                            : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                                        }`}
                                >
                                    <type.icon className="h-4 w-4" />
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Dados Clínicos (Condicional) */}
                    {contract.contract_type === 'ALIGNERS' ? (
                        <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                🦷 Dados dos Alinhadores
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-muted-foreground">Placa Atual (Sup)</label>
                                    <input
                                        type="number"
                                        value={formData.current_aligner_upper}
                                        onChange={e => setFormData({ ...formData, current_aligner_upper: parseInt(e.target.value) })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-muted-foreground">Entregue Até (Sup)</label>
                                    <input
                                        type="number"
                                        value={formData.aligners_delivered_to}
                                        onChange={e => setFormData({ ...formData, aligners_delivered_to: parseInt(e.target.value) })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border bg-card p-4 space-y-4 shadow-sm">
                            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                🦷 Troca de Fios
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-muted-foreground">Fio Superior</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 0.14 NiTi"
                                        value={formData.archwire_upper}
                                        onChange={e => setFormData({ ...formData, archwire_upper: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-muted-foreground">Fio Inferior</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 0.14 NiTi"
                                        value={formData.archwire_lower}
                                        onChange={e => setFormData({ ...formData, archwire_lower: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs uppercase font-bold text-muted-foreground">Elásticos / Corrente</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Classe II Médio / Corrente Canino a Canino"
                                        value={formData.elastics_upper}
                                        onChange={e => setFormData({ ...formData, elastics_upper: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Avaliação (Gamification) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-muted-foreground text-center block">Higiene</label>
                            <div className="flex justify-between items-center rounded-md border border-input p-1 bg-muted/20">
                                {[1, 2, 3, 4, 5].map(score => (
                                    <button
                                        key={score}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, hygiene_score: score })}
                                        className={`w-8 h-8 rounded-sm text-sm font-bold transition-all ${formData.hygiene_score === score
                                                ? score >= 4 ? 'bg-emerald-500 text-white shadow-sm' : score >= 3 ? 'bg-amber-500 text-white shadow-sm' : 'bg-destructive text-destructive-foreground shadow-sm'
                                                : 'text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-muted-foreground text-center block">Colaboração</label>
                            <div className="flex justify-between items-center rounded-md border border-input p-1 bg-muted/20">
                                {[1, 2, 3, 4, 5].map(score => (
                                    <button
                                        key={score}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, compliance_score: score })}
                                        className={`w-8 h-8 rounded-sm text-sm font-bold transition-all ${formData.compliance_score === score
                                                ? score >= 4 ? 'bg-emerald-500 text-white shadow-sm' : score >= 3 ? 'bg-amber-500 text-white shadow-sm' : 'bg-destructive text-destructive-foreground shadow-sm'
                                                : 'text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. Notas */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Anotações Clínicas</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Descreva o que foi feito..."
                        />
                    </div>

                    {/* 5. Próxima Visita */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Retorno em (dias)</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            {[15, 21, 30, 45, 60].map(days => (
                                <button
                                    key={days}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, next_visit_interval_days: days })}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${formData.next_visit_interval_days === days
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background text-muted-foreground border-input hover:bg-muted'
                                        }`}
                                >
                                    {days} dias
                                </button>
                            ))}
                        </div>
                    </div>

                    <SheetFooter className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 w-full sm:w-auto"
                        >
                            {loading ? 'Salvando...' : (
                                <div className="flex items-center gap-2">
                                    <Save size={16} />
                                    Salvar Evolução
                                </div>
                            )}
                        </button>
                    </SheetFooter>

                </form>
            </SheetContent>
        </Sheet>
    );
};
