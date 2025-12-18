import React, { useState, useEffect } from "react";
import { supabase, getCurrentClinicId } from "../../lib/supabase";
import { Plus, Edit, Trash2, Loader, Save, X, Settings } from "lucide-react";

interface PriceTable {
  id: string;
  name: string;
  active: boolean;
  type: "PARTICULAR" | "CONVENIO" | "PARCERIA" | "OUTROS";
  external_code?: string;
  notes?: string;
}

interface PriceTableItem {
  id: string;
  price_table_id: string;
  procedure_id: string;
  price: number;
  procedure_name: string;
}

interface Procedure {
  id: string;
  name: string;
  base_price: number;
}

const PriceTablesSettings: React.FC = () => {
  const [tables, setTables] = useState<PriceTable[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<PriceTable | null>(null);
  const [pricesModalOpen, setPricesModalOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState<PriceTable | null>(null);
  const [tableItems, setTableItems] = useState<PriceTableItem[]>([]);
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

      // Load tables
      const { data: tablesData, error: tablesError } = await supabase
        .from("price_tables")
        .select("*")
        .eq("clinic_id", clinicId)
        .order("name");

      if (tablesError) throw tablesError;

      // Load procedures
      const { data: proceduresData, error: proceduresError } = await supabase
        .from("procedure")
        .select("id, name, base_price")
        .eq("clinic_id", clinicId)
        .order("name");

      if (proceduresError) throw proceduresError;

      setTables(tablesData || []);
      setProcedures(proceduresData || []);
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
      const clinicId = await getCurrentClinicId();
      if (!clinicId) throw new Error("Clínica não encontrada");

      if (editingTable) {
        // Update
        const { error } = await supabase
          .from("price_tables")
          .update({
            name: tableData.name,
            type: tableData.type,
            external_code: tableData.external_code,
            notes: tableData.notes,
            active: tableData.active,
          })
          .eq("id", editingTable.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from("price_tables").insert({
          clinic_id: clinicId,
          name: tableData.name,
          type: tableData.type || "PARTICULAR",
          external_code: tableData.external_code,
          notes: tableData.notes,
          active: tableData.active ?? true,
        });

        if (error) throw error;
      }

      setModalOpen(false);
      setEditingTable(null);
      loadData();
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
        .delete()
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

    try {
      // Load existing price table items
      const { data, error } = await supabase
        .from("price_table_items")
        .select("*, procedure(name)")
        .eq("price_table_id", table.id);

      if (error) throw error;

      const items: PriceTableItem[] =
        data?.map((item) => ({
          ...item,
          procedure_name: item.procedure?.name || "",
        })) || [];

      // Initialize with all procedures, using base price if no specific price
      const initializedItems = procedures.map((proc) => {
        const existing = items.find((item) => item.procedure_id === proc.id);
        return (
          existing || {
            id: "",
            price_table_id: table.id,
            procedure_id: proc.id,
            price: proc.base_price,
            procedure_name: proc.name,
          }
        );
      });

      setTableItems(initializedItems);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const savePrices = async () => {
    if (!currentTable) return;

    setSaving(true);
    try {
      // Delete existing items
      await supabase
        .from("price_table_items")
        .delete()
        .eq("price_table_id", currentTable.id);

      // Insert new items (only where price differs from base)
      const itemsToInsert = tableItems.filter((item) => {
        const proc = procedures.find((p) => p.id === item.procedure_id);
        return proc && item.price !== proc.base_price;
      });

      if (itemsToInsert.length > 0) {
        const { error } = await supabase.from("price_table_items").insert(
          itemsToInsert.map((item) => ({
            price_table_id: item.price_table_id,
            procedure_id: item.procedure_id,
            price: item.price,
          }))
        );

        if (error) throw error;
      }

      setPricesModalOpen(false);
      setCurrentTable(null);
      alert("Preços salvos com sucesso!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" size={24} />
        <span className="ml-2">Carregando tabelas de preço...</span>
      </div>
    );
  }

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
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
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
                    {table.external_code && <span className="ml-2 text-xs text-gray-500">({table.external_code})</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${table.type === "CONVENIO"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
                        : table.type === "PARTICULAR"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300"
                        }`}
                    >
                      {table.type || 'PARTICULAR'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${table.active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                        }`}
                    >
                      {table.active ? "Ativa" : "Inativa"}
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
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tables.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
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
          items={tableItems}
          procedures={procedures}
          onUpdateItems={setTableItems}
          onSave={savePrices}
          onClose={() => {
            setPricesModalOpen(false);
            setCurrentTable(null);
          }}
          saving={saving}
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
    active: table?.active ?? true,
    type: table?.type || "PARTICULAR",
    external_code: table?.external_code || "",
    notes: table?.notes || ""
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value as any }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="PARTICULAR">Particular</option>
                <option value="CONVENIO">Convênio</option>
                <option value="PARCERIA">Parceria</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código Externo
              </label>
              <input
                type="text"
                value={formData.external_code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, external_code: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
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
              Ativa
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
  items: PriceTableItem[];
  procedures: Procedure[];
  onUpdateItems: (items: PriceTableItem[]) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

const PricesModal: React.FC<PricesModalProps> = ({
  table,
  items,
  procedures,
  onUpdateItems,
  onSave,
  onClose,
  saving,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const updatePrice = (procedureId: string, price: number) => {
    const updatedItems = items.map((item) =>
      item.procedure_id === procedureId ? { ...item, price } : item
    );
    onUpdateItems(updatedItems);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configurar Preços - {table.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {items.map((item) => {
              const procedure = procedures.find(
                (p) => p.id === item.procedure_id
              );
              return (
                <div
                  key={item.procedure_id}
                  className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.procedure_name}
                    </span>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Preço base:{" "}
                      {procedure ? formatCurrency(procedure.base_price) : "-"}
                    </div>
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        updatePrice(
                          item.procedure_id,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              );
            })}
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
            onClick={onSave}
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
