# 🔧 GUIA DE INTEGRAÇÃO - SETTINGS COMPONENTS

## Status Atual
- ✅ ProcedureSheet criado
- ✅ SalesCommissionManager criado  
- ⚠️ ProceduresSettings usa modal antigo
- ⚠️ SalesCommissionManager não está na rota

## Integrações Necessárias

### 1. ProceduresSettings → ProcedureSheet

**Arquivo:** `components/settings/ProceduresSettings.tsx`

**Mudanças:**
```typescript
// Adicionar imports
import { ProcedureSheet } from '../procedures/ProcedureSheet';

// Adicionar estados
const [isSheetOpen, setIsSheetOpen] = useState(false);
const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
const [priceTables, setPriceTables] = useState([]);

// Carregar tabelas de preço
useEffect(() => {
    loadPriceTables();
}, []);

const loadPriceTables = async () => {
    const { data } = await supabase
        .from('price_tables')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true);
    setPriceTables(data || []);
};

// Handlers
const handleNew = () => {
    setSelectedProcedure(null);
    setIsSheetOpen(true);
};

const handleEdit = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setIsSheetOpen(true);
};

const handleSaveSheet = async (data: Procedure) => {
    // Salvar no banco
    if (data.id) {
        await supabase.from('procedures').update(data).eq('id', data.id);
    } else {
        await supabase.from('procedures').insert([{ ...data, clinic_id: clinicId }]);
    }
    
    // Recarregar lista
    await loadProcedures();
};

// Renderizar
<ProcedureSheet
    open={isSheetOpen}
    onOpenChange={setIsSheetOpen}
    procedure={selectedProcedure}
    priceTables={priceTables}
    clinicId={clinicId}
    onSave={handleSaveSheet}
/>
```

### 2. Settings → Aba Comissões

**Arquivo:** `pages/Settings.tsx`

**Linha 22:** Tipo já inclui 'commissions' ✅

**Adicionar botão da aba:**
```typescript
// Procurar onde estão os botões de sub-tab (categories, suppliers, etc)
// Adicionar:
<button
    onClick={() => setFinancialSubTab('commissions')}
    className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
        financialSubTab === 'commissions'
            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
    }`}
>
    Comissões
</button>
```

**Renderizar componente:**
```typescript
// Procurar onde renderiza CategoriesManager, SuppliersManager, etc
// Adicionar:
{financialSubTab === 'commissions' && <SalesCommissionManager />}
```

## Próximos Passos

1. ✅ Documentação criada
2. 🔄 Integrar ProcedureSheet em ProceduresSettings
3. 🔄 Adicionar aba Comissões em Settings
4. 🔄 Testar fluxo completo
