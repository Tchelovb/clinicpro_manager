import React, { useState, useEffect } from 'react';
import { Plus, Search, Pill, FileText, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import toast from 'react-hot-toast';
import { cn } from '../../src/lib/utils';

// Interfaces
interface Medication {
    id: string;
    name: string;
    active_ingredient?: string; // Usaremos como "Categoria" se o user quiser, ou genericamente.
    dosage?: string;
    form?: string;
    common_dosage_instructions?: string;
    is_active: boolean;
}

export const MedicationManager: React.FC = () => {
    const { profile } = useAuth();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Medication>>({
        name: '',
        active_ingredient: '', // Categoria/Princípio Ativo
        dosage: '', // Concentração
        form: 'TABLET', // Apresentação
        common_dosage_instructions: '' // Posologia Padrão
    });

    // Fetch Medications
    const fetchMedications = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('medication_library')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;
            setMedications(data || []);
        } catch (error) {
            console.error('Erro ao buscar medicamentos:', error);
            toast.error('Erro ao carregar lista de medicamentos.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.clinic_id) {
            fetchMedications();
        }
    }, [profile]);

    // Save Medication
    const handleSave = async () => {
        if (!formData.name) {
            toast.error('O nome do medicamento é obrigatório.');
            return;
        }

        try {
            const payload = {
                clinic_id: profile?.clinic_id,
                name: formData.name,
                active_ingredient: formData.active_ingredient,
                dosage: formData.dosage,
                form: formData.form,
                common_dosage_instructions: formData.common_dosage_instructions,
                is_active: true
            };

            const { error } = await supabase
                .from('medication_library')
                .insert([payload]);

            if (error) throw error;

            toast.success('Medicamento cadastrado com sucesso!');
            setIsSheetOpen(false);
            setFormData({ name: '', active_ingredient: '', dosage: '', form: 'TABLET', common_dosage_instructions: '' });
            fetchMedications();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar medicamento.');
        }
    };

    // Filter Logic
    const filteredMedications = medications.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.active_ingredient?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header da Seção */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Pill className="text-blue-600" size={24} />
                        Farmacologia Inteligente
                    </h2>
                    <p className="text-sm text-slate-500">Gerencie o cérebro farmacológico da sua clínica.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800 text-white gap-2">
                                <Plus size={16} />
                                Novo Medicamento
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full md:max-w-md overflow-y-auto">
                            <SheetHeader className="mb-6">
                                <SheetTitle className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Activity className="text-blue-600" size={20} />
                                    </div>
                                    Novo Medicamento
                                </SheetTitle>
                            </SheetHeader>

                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Nome Comercial</label>
                                    <Input
                                        placeholder="Ex: Amoxicilina + Clavutanato"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Categoria</label>
                                        <select
                                            className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.active_ingredient}
                                            onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Antibiótico">Antibiótico</option>
                                            <option value="Analgésico">Analgésico</option>
                                            <option value="Anti-inflamatório">Anti-inflamatório</option>
                                            <option value="Corticoide">Corticoide</option>
                                            <option value="Ansiolítico">Ansiolítico</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Concentração</label>
                                        <Input
                                            placeholder="Ex: 500mg"
                                            value={formData.dosage}
                                            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Apresentação</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.form}
                                        onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                                    >
                                        <option value="TABLET">Comprimido</option>
                                        <option value="CAPSULE">Cápsula</option>
                                        <option value="SYRUP">Xarope / Suspensão</option>
                                        <option value="INJECTION">Injetável</option>
                                        <option value="OINTMENT">Pomada</option>
                                        <option value="DROPS">Gotas</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Posologia Padrão (Texto da Receita)</label>
                                    <textarea
                                        className="w-full p-3 border border-slate-200 rounded-md text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                        placeholder="Ex: Tomar 1 comprimido a cada 8 horas por 7 dias..."
                                        value={formData.common_dosage_instructions}
                                        onChange={(e) => setFormData({ ...formData, common_dosage_instructions: e.target.value })}
                                    />
                                    <p className="text-xs text-slate-400">Este texto será inserido automaticamente nas receitas.</p>
                                </div>

                                <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base shadow-lg shadow-blue-600/20">
                                    Salvar Medicamento
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Barra de Busca */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    className="pl-10 bg-white border-slate-200"
                    placeholder="Buscar por nome ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabela de Medicamentos */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Medicamento</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Categoria</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Conc.</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Posologia Padrão</th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-700">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Carregando estoque farmacológico...
                                    </td>
                                </tr>
                            ) : filteredMedications.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                <Pill size={24} />
                                            </div>
                                            <p className="text-slate-500 font-medium">Nenhum medicamento encontrado.</p>
                                            <p className="text-xs text-slate-400">Cadastre o primeiro para iniciar seu banco de dados.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredMedications.map((med) => (
                                    <tr key={med.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{med.name}</div>
                                            <div className="text-xs text-slate-500">{med.form === 'TABLET' ? 'Comprimido' : med.form}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {med.active_ingredient ? (
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
                                                    med.active_ingredient === 'Antibiótico' ? "bg-red-100 text-red-700" :
                                                        med.active_ingredient === 'Analgésico' ? "bg-green-100 text-green-700" :
                                                            "bg-slate-100 text-slate-600"
                                                )}>
                                                    {med.active_ingredient}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono">
                                            {med.dosage || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-[300px] truncate text-slate-500 italic">
                                                {med.common_dosage_instructions || 'Sem posologia definida'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Editar
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
