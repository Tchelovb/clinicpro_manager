import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../lib/supabase";
import {
  Plus,
  Edit,
  Trash2,
  Loader,
  Save,
  X,
  Settings,
  Percent,
  DollarSign,
} from "lucide-react";
import {
  getPriceTables,
  getProceduresWithPricing,
  savePriceTable,
  savePriceTableItem,
  calculateFinalPrice,
  PriceTable,
  PriceTableItem,
  Procedure,
} from "../../src/services/pricing";

interface PriceTableWithItems extends PriceTable {
  items?: PriceTableItem[];
}

const PriceTablesSettings: React.FC = () => {
  const [tables, setTables] = useState<PriceTableWithItems[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pricesModalOpen, setPricesModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<PriceTable | null>(null);
  const [currentTable, setCurrentTable] = useState<PriceTable | null>(null);
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

      const [tablesData, proceduresData] = await Promise.all([
        getPriceTables(clinicId),
        supabase
          .from("procedure")
          .select("*")
          .eq("clinic_id", clinicId)
          .eq("is_active", true)
          .order("name"),
      ]);

      setTables(tablesData);
      setProcedures(proceduresData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTable = async (tableData: Partial<PriceTable>) => {
    if (!tableData.name) return;

    setSaving(true);
    try {
      const savedTable = await savePriceTable(tableData);
      if (savedTable) {
        setModalOpen(false);
        setEditingTable(null);
        loadData();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tabela de preços?"))
      return;

    try {
      const { error } = await supabase
        .from("price_tables")
        .update({ is_active: false })
        .eq("id", tableId);

      if (error) throw error;
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openPricesModal = async (table: PriceTable) => {
    setCurrentTable(table);
    setPricesModalOpen(true);
    // Data will be loaded inside the PricesModal component
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" size={24} />
        <span className="ml-2">Carregando tabelas de preço...</span>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Tabelas de Preço
        </h2>
        <button
          onClick={() => {
            setEditingTable(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Nova Tabela
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Sistema Avançado:</strong> Configure ajustes globais por
          tabela e overrides individuais por procedimento. Suporte a cálculos
          dinâmicos com porcentagens flexíveis para convênios e reajustes em
          massa.
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
                  % Ajuste Global
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Procedimentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {tables.map((table) => (
                <tr
                  key={table.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {table.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        table.global_adjustment_percent >= 0
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                      }`}
                    >
                      {formatPercent(table.global_adjustment_percent)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        table.is_default
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
                      }`}
                    >
                      {table.is_default ? "Padrão" : "Personalizada"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <button
                      onClick={() => openPricesModal(table)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Settings size={14} />
                      Configurar Preços
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingTable(table);
                          setModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit size={16} />
                      </button>
                      {!table.is_default && (
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {tables.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Nenhuma tabela de preços cadastrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Modal */}
      {modalOpen && (
        <TableModal
          table={editingTable}
          onSave={handleSaveTable}
          onClose={() => {
            setModalOpen(false);
            setEditingTable(null);
          }}
          saving={saving}
        />
      )}

      {/* Prices Modal */}
      {pricesModalOpen && currentTable && (
        <PricesModal
          table={currentTable}
          procedures={procedures}
          onClose={() => {
            setPricesModalOpen(false);
            setCurrentTable(null);
          }}
        />
      )}
    </div>
  );
};

interface TableModalProps {
  table: PriceTable | null;
  onSave: (data: Partial<PriceTable>) => void;
  onClose: () => void;
  saving: boolean;
}

const TableModal: React.FC<TableModalProps> = ({
  table,
  onSave,
  onClose,
  saving,
}) => {
  const [formData, setFormData] = useState({
    name: table?.name || "",
    global_adjustment_percent: table?.global_adjustment_percent || 0,
    is_default: table?.is_default || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {table ? "Editar Tabela" : "Nova Tabela"}
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
              Nome da Tabela *
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
              % Ajuste Global
            </label>
            <div className="relative">
              <input
                type="number"
                min="-99"
                max="500"
                step="0.1"
                value={formData.global_adjustment_percent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    global_adjustment_percent: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <Percent className="absolute left-2 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ex: -20 para desconto de 20%, +15 para acréscimo de 15%
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_default: e.target.checked,
                }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="is_default"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Definir como tabela padrão (fallback)
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

interface PricesModalProps {
  table: PriceTable;
  procedures: Procedure[];
  onClose: () => void;
}

const PricesModal: React.FC<PricesModalProps> = ({
  table,
  procedures,
  onClose,
}) => {
  const [items, setItems] = useState<PriceTableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTableItems();
  }, [table.id]);

  const loadTableItems = async () => {
    try {
      setLoading(true);
      // Load existing items for this table
      const { data: existingItems, error } = await supabase
        .from("price_table_items")
        .select("*")
        .eq("price_table_id", table.id)
        .eq("is_active", true);

      if (error) throw error;

      // Create a map of existing items
      const itemsMap = new Map(
        existingItems?.map((item) => [item.procedure_id, item]) || []
      );

      // Initialize with all procedures
      const initializedItems = procedures.map((proc) => {
        const existing = itemsMap.get(proc.id);
        return (
          existing || {
            id: "",
            price_table_id: table.id,
            procedure_id: proc.id,
            custom_price: null,
            individual_adjustment_percent: null,
            is_active: true,
          }
        );
      });

      setItems(initializedItems);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (
    procedureId: string,
    field: keyof PriceTableItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.procedure_id === procedureId ? { ...item, [field]: value } : item
      )
    );
  };

  const saveAllItems = async () => {
    try {
      setSaving(true);

      // Delete existing items
      await supabase
        .from("price_table_items")
        .delete()
        .eq("price_table_id", table.id);

      // Insert new items (only those with overrides)
      const itemsToSave = items.filter(
        (item) =>
          item.custom_price !== null ||
          item.individual_adjustment_percent !== null
      );

      if (itemsToSave.length > 0) {
        const { error } = await supabase
          .from("price_table_items")
          .insert(itemsToSave);

        if (error) throw error;
      }

      alert("Preços salvos com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao salvar preços:", error);
      alert("Erro ao salvar preços. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg">
          <Loader className="animate-spin" size={24} />
          <span className="ml-2">Carregando preços...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configurar Preços - {table.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ajuste global: {table.global_adjustment_percent >= 0 ? "+" : ""}
              {table.global_adjustment_percent}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Como funciona:</strong> Preços são calculados
              automaticamente do base × (1 + % ajuste). Use preço fixo ou %
              individual para overrides específicos.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Procedimento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Preço Base
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    % Individual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Preço Fixo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Preço Final
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {items.map((item) => {
                  const procedure = procedures.find(
                    (p) => p.id === item.procedure_id
                  );
                  if (!procedure) return null;

                  const finalPrice = calculateFinalPrice(
                    procedure.base_price,
                    item,
                    table.global_adjustment_percent
                  );

                  return (
                    <tr
                      key={item.procedure_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {procedure.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {procedure.category}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(procedure.base_price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="-99"
                          max="500"
                          step="0.1"
                          value={item.individual_adjustment_percent || ""}
                          onChange={(e) =>
                            updateItem(
                              item.procedure_id,
                              "individual_adjustment_percent",
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700"
                          placeholder={`${table.global_adjustment_percent}%`}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.custom_price || ""}
                          onChange={(e) =>
                            updateItem(
                              item.procedure_id,
                              "custom_price",
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700"
                          placeholder="Auto"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(finalPrice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={saveAllItems}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Salvando..." : "Salvar Preços"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceTablesSettings;
