import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, AlertTriangle, TrendingDown, TrendingUp, Search, Filter, Loader2, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    min_quantity: number;
    unit: string;
    cost_per_unit: number;
    supplier: string;
    last_updated: string;
}

const Inventory: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'IMPLANTS' | 'MATERIALS' | 'PROSTHESIS' | 'CONSUMABLES'>('ALL');

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .order('name');

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Erro ao carregar estoque:', error);
            toast.error('Erro ao carregar estoque');
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const lowStockItems = items.filter(item => item.quantity <= item.min_quantity);
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.cost_per_unit), 0);
    const criticalItems = items.filter(item => item.quantity === 0);

    const categories = [
        { value: 'ALL', label: 'Todos' },
        { value: 'IMPLANTS', label: 'Implantes' },
        { value: 'MATERIALS', label: 'Materiais' },
        { value: 'PROSTHESIS', label: 'Próteses' },
        { value: 'CONSUMABLES', label: 'Consumíveis' }
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando estoque...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <Package className="text-amber-600" size={32} />
                        Controle de Estoque
                    </h1>
                    <p className="text-slate-500 mt-2">Gestão de materiais e insumos de alto custo</p>
                </div>
                <button
                    onClick={() => navigate('/inventory/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} />
                    Novo Item
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-50 rounded-lg">
                            <Package className="text-violet-600" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Total Itens</p>
                    </div>
                    <p className="text-2xl font-bold text-violet-600">{items.length}</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <AlertTriangle className="text-amber-600" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Estoque Baixo</p>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{lowStockItems.length}</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 rounded-lg">
                            <TrendingDown className="text-rose-600" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Críticos</p>
                    </div>
                    <p className="text-2xl font-bold text-rose-600">{criticalItems.length}</p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <TrendingUp className="text-green-600" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Valor Total</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou fornecedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                    />
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setFilterCategory(cat.value as any)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterCategory === cat.value
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Alerts */}
            {lowStockItems.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Atenção: {lowStockItems.length} itens com estoque baixo</p>
                        <p className="text-xs text-amber-600 mt-1">Verifique os itens destacados e programe reposição.</p>
                    </div>
                </div>
            )}

            {/* Inventory Table */}
            {filteredItems.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                    <Package size={48} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum item encontrado</h3>
                    <p className="text-slate-500 mb-6">
                        {searchTerm || filterCategory !== 'ALL'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Adicione itens ao estoque para começar o controle'
                        }
                    </p>
                    {!searchTerm && filterCategory === 'ALL' && (
                        <button
                            onClick={() => navigate('/inventory/new')}
                            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                        >
                            Adicionar Primeiro Item
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Categoria</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Quantidade</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Estoque Mín.</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Custo Unit.</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Valor Total</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Fornecedor</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.map(item => {
                                const isLowStock = item.quantity <= item.min_quantity;
                                const isCritical = item.quantity === 0;
                                const totalValue = item.quantity * item.cost_per_unit;

                                return (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-slate-50 transition-colors ${isCritical ? 'bg-rose-50' : isLowStock ? 'bg-amber-50' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {isCritical && <AlertTriangle size={16} className="text-rose-600" />}
                                                {!isCritical && isLowStock && <AlertTriangle size={16} className="text-amber-600" />}
                                                <span className="font-medium text-slate-800">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${isCritical ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'
                                                }`}>
                                                {item.quantity} {item.unit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.min_quantity} {item.unit}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.cost_per_unit)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.supplier}</td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                                <Edit2 size={16} className="text-slate-400" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Inventory;
