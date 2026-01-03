import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../src/lib/supabase";
import { Plus, Edit, Trash2, Loader, Save, X } from "lucide-react";

interface InsurancePlan {
  id: string;
  name: string;
  code: string;
  price_table_id: string;
  active: boolean;
  price_table_name?: string;
}

interface PriceTable {
  id: string;
  name: string;
}

const InsurancePlansSettings: React.FC = () => {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) {
        setError("Clínica não encontrada");
        return;
      }

      // Load plans with price table names
      const { data: plansData, error: plansError } = await supabase
        .from("insurance_plans")
        .select(
          `
          *,
          price_tables(name)
        `
        )
        .eq("clinic_id", clinicId)
        .order("name");

      if (plansError) throw plansError;

      const plansWithNames =
        plansData?.map((plan) => ({
          ...plan,
          price_table_name: plan.price_table?.name || "",
        })) || [];

      // Load price tables for select
      const { data: tablesData, error: tablesError } = await supabase
        .from("price_tables")
        .select("id, name")
        .eq("clinic_id", clinicId)
        .eq("active", true)
        .order("name");

      if (tablesError) throw tablesError;

      setPlans(plansWithNames);
      setPriceTables(tablesData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (planData: Partial<InsurancePlan>) => {
    if (!planData.name || !planData.price_table_id) return;

    setSaving(true);
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) throw new Error("Clínica não encontrada");

      if (editingPlan) {
        // Update
        const { error } = await supabase
          .from("insurance_plans")
          .update({
            name: planData.name,
            code: planData.code,
            price_table_id: planData.price_table_id,
            active: planData.active,
          })
          .eq("id", editingPlan.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from("insurance_plans").insert({
          clinic_id: clinicId,
          name: planData.name,
          code: planData.code,
          price_table_id: planData.price_table_id,
          active: planData.active ?? true,
        });

        if (error) throw error;
      }

      setModalOpen(false);
      setEditingPlan(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir este convênio?")) return;

    try {
      const { error } = await supabase
        .from("insurance_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" size={24} />
        <span className="ml-2">Carregando convênios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Convênios
        </h2>
        <button
          onClick={() => {
            setEditingPlan(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Novo Convênio
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
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tabela de Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {plan.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {plan.code || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {plan.price_table_name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        plan.active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                      }`}
                    >
                      {plan.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nenhum convênio cadastrado
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
          plan={editingPlan}
          priceTables={priceTables}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingPlan(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
};

interface ModalProps {
  plan: InsurancePlan | null;
  priceTables: PriceTable[];
  onSave: (data: Partial<InsurancePlan>) => void;
  onClose: () => void;
  saving: boolean;
}

const Modal: React.FC<ModalProps> = ({
  plan,
  priceTables,
  onSave,
  onClose,
  saving,
}) => {
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    code: plan?.code || "",
    price_table_id: plan?.price_table_id || "",
    active: plan?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {plan ? "Editar Convênio" : "Novo Convênio"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Convênio *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tabela de Preço *
            </label>
            <select
              value={formData.price_table_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  price_table_id: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Selecione uma tabela de preço</option>
              {priceTables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, active: e.target.checked }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="active"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Ativo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InsurancePlansSettings;
