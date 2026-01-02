import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search } from 'lucide-react';

interface DentalCatalogItem {
    code: string;
    type: string;
    label: string;
    short_label?: string;
    tooth_number?: number;
    quadrant?: number;
    category: string;
    is_active: boolean;
}

interface ProcedureItemSelectorProps {
    onSelect: (item: DentalCatalogItem) => void;
    selectedCode?: string;
}

export const ProcedureItemSelector: React.FC<ProcedureItemSelectorProps> = ({
    onSelect,
    selectedCode
}) => {
    const [items, setItems] = useState<DentalCatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadDentalCatalog();
    }, []);

    const loadDentalCatalog = async () => {
        try {
            const { data, error } = await supabase
                .from('dental_catalog')
                .select('*')
                .eq('is_active', true)
                .order('category', { ascending: true })
                .order('code', { ascending: true });

            if (error) throw error;

            console.log('✅ Loaded dental catalog:', data?.length, 'items');
            setItems(data || []);
        } catch (error) {
            console.error('❌ Error loading dental catalog:', error);
        } finally {
            setLoading(false);
        }
    };

    // Group items by category
    const groupedItems = items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, DentalCatalogItem[]>);

    // Filter by search
    const filteredGroups = Object.entries(groupedItems).reduce((acc, [category, categoryItems]) => {
        const filtered = categoryItems.filter(item =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (filtered.length > 0) {
            acc[category] = filtered;
        }
        return acc;
    }, {} as Record<string, DentalCatalogItem[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar dente ou região..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
            </div>

            {/* Grouped List */}
            <div className="max-h-96 overflow-y-auto space-y-4">
                {Object.entries(filteredGroups).map(([category, categoryItems]) => (
                    <div key={category}>
                        <h3 className="text-sm font-bold text-slate-600 mb-2 sticky top-0 bg-white py-1">
                            {category === 'ODONTOLOGIA' && '🦷 Odontologia'}
                            {category === 'HOF' && '💉 Harmonização / Cirurgia'}
                            {category === 'ORTODONTIA' && '🔧 Ortodontia'}
                        </h3>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                            {categoryItems.map((item) => (
                                <button
                                    key={item.code}
                                    onClick={() => onSelect(item)}
                                    className={`p-3 rounded-lg border-2 transition-all text-center ${selectedCode === item.code
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="text-sm font-bold text-slate-900">{item.code}</div>
                                    <div className="text-xs text-slate-500 truncate">{item.short_label || item.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {Object.keys(filteredGroups).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    Nenhum item encontrado
                </div>
            )}
        </div>
    );
};
