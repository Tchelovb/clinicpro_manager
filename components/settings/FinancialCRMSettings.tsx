import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../lib/supabase";
import { Plus, Edit, Trash2, Loader, Save, X } from "lucide-react";

interface SettingItem {
  id: string;
  name: string;
  active: boolean;
  status_order?: number;
}

type SettingType =
  | "expense_category"
  | "revenue_category"
  | "payment_method"
  | "lead_source"
  | "custom_lead_status";

const FinancialCRMSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingType>("expense_category");
  const [items, setItems] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    {
      key: "expense_category" as SettingType,
      label: "Categorias de Despesa",
      table: "expense_category",
    },
    {
      key: "revenue_category" as SettingType,
      label: "Categorias de Receita",
      table: "revenue_category",
    },
    {
      key: "payment_method" as SettingType,
      label: "Formas de Pagamento",
      table: "payment_method",
    },
    {
      key: "lead_source" as SettingType,
      label: "Fontes de Lead",
      table: "lead_source",
    },
    {
      key: "custom_lead_status" as SettingType,
      label: "Status de Funil",
      table: "custom_lead_status",
    },
  ];

  useEffect(() => {
    loadItems(activeTab);
  }, [activeTab]);

  const loadItems = async (type: SettingType) => {
    setLoading(true);
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) {
        setError("Clínica não encontrada");
        return;
      }

      const table = tabs.find((t) => t.key === type)?.table;
      if (!table) return;

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("clinic_id", clinicId)
        .order(table === "custom_lead_status" ? "status_order" : "name");

      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemData: Partial<SettingItem>) => {
    if (!itemData.name) return;

    setSaving(true);
    try {
      const clinicId = await getCurrentClinicId();
      if (!clinicId) throw new Error("Clínica não encontrada");

      const table = tabs.find((t) => t.key === activeTab)?.table;
      if (!table) return;

      if (editingItem) {
        // Update
        const updateData: any = {
          name: itemData.name,
          active: itemData.active,
        };
        if (
          activeTab === "custom_lead_status" &&
          itemData.status_order !== undefined
        ) {
          updateData.status_order = itemData.status_order;
        }

        const { error } = await supabase
          .from(table)
          .update(updateData)
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        // Create
        const insertData: any = {
          clinic_id: clinicId,
          name: itemData.name,
          active: itemData.active ?? true,
        };
        if (activeTab === "custom_lead_status") {
          insertData.status_order = items.length + 1;
        }

        const { error } = await supabase.from(table).insert(insertData);

        if (error) throw error;
      }

      setModalOpen(false);
      setEditingItem(null);
      loadItems(activeTab);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      const table = tabs.find((t) => t.key === activeTab)?.table;
      if (!table) return;

      const { error } = await supabase.from(table).delete().eq("id", itemId);

      if (error) throw error;
      loadItems(activeTab);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const currentTab = tabs.find((t) => t.key === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Configurações Financeiras e CRM
        </h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {currentTab?.label}
          </h3>
          <button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Novo Item
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Erro: {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader className="animate-spin" size={24} />
            <span className="ml-2">Carregando...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    {activeTab === "custom_lead_status" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Ordem
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </span>
                      </td>
                      {activeTab === "custom_lead_status" && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.status_order}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                          }`}
                        >
                          {item.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={activeTab === "custom_lead_status" ? 4 : 3}
                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        Nenhum item cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <Modal
          item={editingItem}
          type={activeTab}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          saving={saving}
        />
      )}
    </div>
  );
};

interface ModalProps {
  item: SettingItem | null;
  type: SettingType;
  onSave: (data: Partial<SettingItem>) => void;
  onClose: () => void;
  saving: boolean;
}

const Modal: React.FC<ModalProps> = ({
  item,
  type,
  onSave,
  onClose,
  saving,
}) => {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    active: item?.active ?? true,
    status_order: item?.status_order || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const getTitle = () => {
    const titles = {
      expense_category: "Categoria de Despesa",
      revenue_category: "Categoria de Receita",
      payment_method: "Forma de Pagamento",
      lead_source: "Fonte de Lead",
      custom_lead_status: "Status de Funil",
    };
    return titles[type];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {item ? `Editar ${getTitle()}` : `Novo ${getTitle()}`}
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
              Nome *
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

          {type === "custom_lead_status" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordem *
              </label>
              <input
                type="number"
                min="1"
                value={formData.status_order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status_order: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          )}

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

export default FinancialCRMSettings;
