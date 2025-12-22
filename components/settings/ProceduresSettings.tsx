import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../lib/supabase";
import { Plus, Edit, Trash2, Loader, Save, X, FileText, PieChart } from "lucide-react";

interface Procedure {
  id: string;
  name: string;
  category: string;
  specialty?: string;
  duration: number;
  total_sessions: number;
  base_price: number;
  // Cost fields (joined) - Supabase retorna como objeto único
  procedure_costs?: {
    material_cost: number;
    professional_cost: number;
    operational_overhead: number;
  };
}

const ProceduresSettings: React.FC = () => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProcedures();
  }, []);

  const loadProcedures = async () => {
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) {
        setError("Clínica não encontrada");
        return;
      }

      const { data, error } = await supabase
        .from("procedure")
        .select(`
            *,
            procedure_costs (
                material_cost,
                professional_cost,
                operational_overhead
            )
        `)
        .eq("clinic_id", clinicId)
        .order("name");

      if (error) throw error;
      setProcedures(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (procedureData: Partial<Procedure> & { custom_costs?: any }) => {
    console.log('handleSave chamado com:', procedureData);

    if (!procedureData.name || !procedureData.base_price) return;

    setSaving(true);
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) throw new Error("Clínica não encontrada");

      let procedureId = editingProcedure?.id;

      if (editingProcedure) {
        // Update
        const { error } = await supabase
          .from("procedure")
          .update({
            name: procedureData.name,
            category: procedureData.category,
            specialty: procedureData.specialty,
            duration: procedureData.duration,
            total_sessions: procedureData.total_sessions,
            base_price: procedureData.base_price,
          })
          .eq("id", editingProcedure.id);

        if (error) throw error;
      } else {
        // Create
        const { data: newProc, error } = await supabase.from("procedure").insert({
          clinic_id: clinicId,
          name: procedureData.name,
          category: procedureData.category,
          specialty: procedureData.specialty,
          duration: procedureData.duration || 30,
          total_sessions: procedureData.total_sessions || 1,
          base_price: procedureData.base_price,
        }).select().single();

        if (error) throw error;
        procedureId = newProc.id;
      }

      // Save Costs (Upsert)
      if (procedureId && procedureData.custom_costs) {
        const { error: costError } = await supabase
          .from("procedure_costs")
          .upsert({
            clinic_id: clinicId,
            procedure_id: procedureId,
            material_cost: procedureData.custom_costs.material_cost || 0,
            professional_cost: procedureData.custom_costs.professional_cost || 0,
            operational_overhead: procedureData.custom_costs.operational_overhead || 0
          }, { onConflict: 'procedure_id' });

        if (costError) throw costError;
      }

      setModalOpen(false);
      setEditingProcedure(null);
      loadProcedures();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (procedureId: string) => {
    if (!confirm("Tem certeza que deseja excluir este procedimento?")) return;

    try {
      const { error } = await supabase
        .from("procedure")
        .delete()
        .eq("id", procedureId);

      if (error) throw error;
      loadProcedures();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" size={24} />
        <span className="ml-2">Carregando procedimentos...</span>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Procedimentos & Preços Base
        </h2>
        <button
          onClick={() => {
            setEditingProcedure(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Novo Procedimento
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Erro: {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duração
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sessões
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Preço Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {procedures.map((procedure) => (
                <tr
                  key={procedure.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {procedure.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {procedure.category || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {procedure.duration} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {procedure.total_sessions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(procedure.base_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProcedure(procedure);
                          setModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(procedure.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {procedures.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nenhum procedimento cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          procedure={editingProcedure}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingProcedure(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
};

interface ModalProps {
  procedure: Procedure | null;
  onSave: (data: Partial<Procedure> & { custom_costs?: any }) => void;
  onClose: () => void;
  saving: boolean;
}

const Modal: React.FC<ModalProps> = ({
  procedure,
  onSave,
  onClose,
  saving,
}) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'costs'>('basic');
  const [formData, setFormData] = useState({
    name: procedure?.name || "",
    category: procedure?.category || "CLINICA_GERAL",
    specialty: procedure?.specialty || "",
    duration: procedure?.duration || 30,
    total_sessions: procedure?.total_sessions || 1,
    base_price: procedure?.base_price || 0,
  });

  const [costs, setCosts] = useState({
    material_cost: procedure?.procedure_costs?.material_cost || 0,
    professional_cost: procedure?.procedure_costs?.professional_cost || 0,
    operational_overhead: procedure?.procedure_costs?.operational_overhead || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, custom_costs: costs });
  };

  const categories = [
    { value: 'CLINICA_GERAL', label: 'Clínica Geral' },
    { value: 'ORTODONTIA', label: 'Ortodontia' },
    { value: 'HOF', label: 'HOF (Harmonização Orofacial)' }
  ];

  const specialties = [
    "Dentística",
    "Cirurgia",
    "Ortodontia",
    "Periodontia",
    "Endodontia",
    "Implante",
    "Prótese",
    "Radiologia",
    "Harmonização",
    "Outro",
  ];

  const totalCost = costs.material_cost + costs.professional_cost + costs.operational_overhead;
  const margin = formData.base_price - totalCost;
  const marginPercent = formData.base_price > 0 ? (margin / formData.base_price) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {procedure ? "Editar Procedimento" : "Novo Procedimento"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'basic'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            <FileText size={18} />
            Dados Básicos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('costs')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'costs'
              ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
          >
            <PieChart size={18} />
            Custos & Margem (BOS)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">

          {activeTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Procedimento *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                  placeholder="Ex: Restauração Resina 1 Face"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Especialidade
                  </label>
                  <select
                    value={formData.specialty}
                    onChange={(e) => setFormData((prev) => ({ ...prev, specialty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecione uma especialidade</option>
                    {specialties.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preço Base (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duração Estimada (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sessões Necessárias
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_sessions}
                    onChange={(e) => setFormData((prev) => ({ ...prev, total_sessions: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'costs' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>💡 Pilar BOS:</strong> Preencha os custos abaixo para que a IA possa calcular sua Margem Real e sugerir estratégias de precificação.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Custo Materiais
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-xs">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={costs.material_cost}
                      onChange={(e) => setCosts(prev => ({ ...prev, material_cost: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Custo Profissional
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-xs">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={costs.professional_cost}
                      onChange={(e) => setCosts(prev => ({ ...prev, professional_cost: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Custo Operacional
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-xs">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={costs.operational_overhead}
                      onChange={(e) => setCosts(prev => ({ ...prev, operational_overhead: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Margin Calculator Visualization */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Simulação de Resultado</h4>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Preço Base:</span>
                    <span className="font-semibold">R$ {formData.base_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400">(-) Custos Totais:</span>
                    <span className="text-red-500 font-semibold">- R$ {totalCost.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-300 dark:bg-gray-600 my-2"></div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-800 dark:text-white">Lucro Estimado:</span>
                    <span className={margin > 0 ? 'text-green-600' : 'text-red-600'}>
                      R$ {margin.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Margin Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Margem: {marginPercent.toFixed(1)}%</span>
                    <span>Meta BOS: {'>'}30%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${marginPercent < 20 ? 'bg-red-500' : marginPercent < 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(Math.max(marginPercent, 0), 100)}%` }}
                    ></div>
                  </div>
                  {marginPercent < 20 && (
                    <p className="text-xs text-red-500 mt-1 font-medium">⚠️ Margem perigosamente baixa. Considere aumentar o preço ou reduzir custos.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 mt-4 border-t border-gray-100 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {saving ? "Salvando..." : "Salvar Procedimento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProceduresSettings;
