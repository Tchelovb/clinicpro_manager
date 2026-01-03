import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../src/lib/supabase";
import { Plus, Edit, Trash2, Loader, Save, X } from "lucide-react";
import { getPriceTables, PriceTable } from "../../src/services/pricing";

interface Convention {
  id: string;
  name: string;
  code?: string;
  price_table_id: string;
  status: string;
  price_table?: PriceTable;
}

const InsurancePlansSettings: React.FC = () => {
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [priceTables, setPriceTables] = useState<PriceTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConvention, setEditingConvention] = useState<Convention | null>(
    null
  );
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

      // Load conventions with price table names
      const { data: conventionsData, error: conventionsError } = await supabase
        .from("conventions")
        .select(
          `
          *,
          price_tables(name)
        `
        )
        .eq("clinic_id", clinicId)
        .order("name");

      if (conventionsError) throw conventionsError;

      const conventionsWithNames =
        conventionsData?.map((conv) => ({
          ...conv,
          price_table: conv.price_tables,
        })) || [];

      // Load price tables for select
      const priceTablesData = await getPriceTables(clinicId);

      setConventions(conventionsWithNames);
      setPriceTables(priceTablesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (conventionData: Partial<Convention>) => {
    if (!conventionData.name || !conventionData.price_table_id) return;

    setSaving(true);
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) throw new Error("Clínica não encontrada");

      if (editingConvention) {
        // Update
        const { error } = await supabase
          .from("conventions")
          .update({
            name: conventionData.name,
            code: conventionData.code,
            price_table_id: conventionData.price_table_id,
            status: conventionData.status,
          })
          .eq("id", editingConvention.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from("conventions").insert({
          clinic_id: clinicId,
          name: conventionData.name,
          code: conventionData.code,
          price_table_id: conventionData.price_table_id,
          status: conventionData.status ?? "Ativo",
        });

        if (error) throw error;
      }

      setModalOpen(false);
      setEditingConvention(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (conventionId: string) => {
    if (!confirm("Tem certeza que deseja excluir este convênio?")) return;

    try {
      const { error } = await supabase
        .from("conventions")
        .delete()
        .eq("id", conventionId);

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
            setEditingConvention(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Novo Convênio
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Sistema Integrado:</strong> Associe convênios às tabelas de
          preços criadas. Cada convênio herda os cálculos dinâmicos da tabela
          selecionada para orçamentos automáticos.
        </p>
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
              {conventions.map((convention) => (
                <tr
                  key={convention.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {convention.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {convention.code || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {convention.price_table?.name || "Tabela não encontrada"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        convention.status === "Ativo"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                      }`}
                    >
                      {convention.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingConvention(convention);
                          setModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(convention.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {conventions.length === 0 && (
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
          convention={editingConvention}
          priceTables={priceTables}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingConvention(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
};

interface ModalProps {
  convention: Convention | null;
  priceTables: PriceTable[];
  onSave: (data: Partial<Convention>) => void;
  onClose: () => void;
  saving: boolean;
}

const Modal: React.FC<ModalProps> = ({
  convention,
  priceTables,
  onSave,
  onClose,
  saving,
}) => {
  const [formData, setFormData] = useState({
    name: convention?.name || "",
    code: convention?.code || "",
    price_table_id: convention?.price_table_id || "",
    status: convention?.status || "Ativo",
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
            {convention ? "Editar Convênio" : "Novo Convênio"}
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
              placeholder="Ex: 001, UNIMED001"
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
                  {table.name} (
                  {table.global_adjustment_percent >= 0 ? "+" : ""}
                  {table.global_adjustment_percent}%)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              O convênio herdará os cálculos de preços da tabela selecionada
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
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
