import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Package,
    DollarSign,
    Clock,
    Percent,
    AlertCircle,
    Calculator
} from 'lucide-react';
import { procedureRecipeService, InventoryItem, ProcedureRecipeItem } from '../../services/procedureRecipeService';

interface ProcedureKitBuilderProps {
    procedureId: string;
    clinicId: string;
    estimatedDuration: number; // minutos
    estimatedLabCost: number;
    costPerMinute: number;
    onKitCostChange: (cost: number) => void;
}

interface RecipeItemForm {
    inventory_item_id: string;
    quantity: number;
    unit: string;
}

export const ProcedureKitBuilder: React.FC<ProcedureKitBuilderProps> = ({
    procedureId,
    clinicId,
    estimatedDuration,
    estimatedLabCost,
    costPerMinute,
    onKitCostChange
}) => {
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [recipeItems, setRecipeItems] = useState<RecipeItemForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [procedureId, clinicId]);

    useEffect(() => {
        // Calcular custo do kit e notificar pai
        const kitCost = calculateKitCost();
        onKitCostChange(kitCost);
    }, [recipeItems, inventoryItems]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Buscar itens de estoque
            const items = await procedureRecipeService.getInventoryItems(clinicId);
            setInventoryItems(items);

            // Buscar receita existente
            if (procedureId) {
                const recipe = await procedureRecipeService.getRecipe(procedureId, clinicId);
                if (recipe) {
                    const existingItems = await procedureRecipeService.getRecipeItems(recipe.id);
                    setRecipeItems(existingItems.map(item => ({
                        inventory_item_id: item.inventory_item_id,
                        quantity: item.quantity,
                        unit: item.unit
                    })));
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setRecipeItems([...recipeItems, {
            inventory_item_id: '',
            quantity: 1,
            unit: ''
        }]);
    };

    const handleRemoveItem = (index: number) => {
        setRecipeItems(recipeItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof RecipeItemForm, value: any) => {
        const updated = [...recipeItems];
        updated[index] = { ...updated[index], [field]: value };

        // Se mudou o item, atualizar a unidade automaticamente
        if (field === 'inventory_item_id') {
            const selectedItem = inventoryItems.find(item => item.id === value);
            if (selectedItem) {
                updated[index].unit = selectedItem.unit;
            }
        }

        setRecipeItems(updated);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Filtrar itens válidos
            const validItems = recipeItems.filter(item =>
                item.inventory_item_id && item.quantity > 0
            );

            const success = await procedureRecipeService.saveRecipe(
                procedureId,
                clinicId,
                validItems
            );

            if (success) {
                alert('Kit de materiais salvo com sucesso!');
            } else {
                alert('Erro ao salvar kit de materiais');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar kit de materiais');
        } finally {
            setSaving(false);
        }
    };

    const calculateKitCost = (): number => {
        return recipeItems.reduce((total, item) => {
            const inventoryItem = inventoryItems.find(inv => inv.id === item.inventory_item_id);
            if (inventoryItem) {
                return total + (inventoryItem.average_cost * item.quantity);
            }
            return total;
        }, 0);
    };

    const calculateBaseCost = (): number => {
        const timeCost = estimatedDuration * costPerMinute;
        const kitCost = calculateKitCost();
        return timeCost + kitCost + estimatedLabCost;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getItemCost = (itemId: string, quantity: number): number => {
        const item = inventoryItems.find(inv => inv.id === itemId);
        return item ? item.average_cost * quantity : 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Kit de Materiais (Receita)
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Configure os materiais necessários para este procedimento
                    </p>
                </div>
                <button
                    onClick={handleAddItem}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Material
                </button>
            </div>

            {/* Lista de Materiais */}
            <div className="space-y-3">
                {recipeItems.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600">Nenhum material adicionado</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Clique em "Adicionar Material" para começar
                        </p>
                    </div>
                ) : (
                    recipeItems.map((item, index) => {
                        const selectedItem = inventoryItems.find(inv => inv.id === item.inventory_item_id);
                        const itemCost = getItemCost(item.inventory_item_id, item.quantity);

                        return (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg"
                            >
                                {/* Material */}
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Material
                                    </label>
                                    <select
                                        value={item.inventory_item_id}
                                        onChange={(e) => handleItemChange(index, 'inventory_item_id', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione...</option>
                                        {inventoryItems.map(invItem => (
                                            <option key={invItem.id} value={invItem.id}>
                                                {invItem.name} ({formatCurrency(invItem.average_cost)}/{invItem.unit})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantidade */}
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Quantidade
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Unidade */}
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Unidade
                                    </label>
                                    <input
                                        type="text"
                                        value={item.unit}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                    />
                                </div>

                                {/* Custo */}
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Custo
                                    </label>
                                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                        <span className="text-sm font-bold text-blue-700">
                                            {formatCurrency(itemCost)}
                                        </span>
                                    </div>
                                </div>

                                {/* Remover */}
                                <button
                                    onClick={() => handleRemoveItem(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg mt-6"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Resumo de Custos */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    Cálculo de Custo Base do Procedimento
                </h4>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">
                                Custo Operacional ({estimatedDuration} min × {formatCurrency(costPerMinute)}/min)
                            </span>
                        </div>
                        <span className="font-bold text-gray-900">
                            {formatCurrency(estimatedDuration * costPerMinute)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Custo do Kit de Materiais</span>
                        </div>
                        <span className="font-bold text-blue-700">
                            {formatCurrency(calculateKitCost())}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">Custo de Laboratório</span>
                        </div>
                        <span className="font-bold text-gray-900">
                            {formatCurrency(estimatedLabCost)}
                        </span>
                    </div>

                    <div className="pt-3 border-t border-blue-300">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">Custo Base Total:</span>
                            <span className="text-2xl font-bold text-indigo-700">
                                {formatCurrency(calculateBaseCost())}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            💡 Este é o custo mínimo antes de comissões, impostos e taxas
                        </p>
                    </div>
                </div>
            </div>

            {/* Botão Salvar */}
            {recipeItems.length > 0 && (
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Salvar Kit de Materiais'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProcedureKitBuilder;
