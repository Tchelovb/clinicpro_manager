# 🎯 INTEGRAÇÃO DO PROCEDURE SHEET

## Como integrar o ProcedureSheet no ProceduresSettings.tsx

### 1. Importar o componente

```typescript
import { ProcedureSheet } from './procedures/ProcedureSheet';
```

### 2. Adicionar estados

```typescript
const [sheetOpen, setSheetOpen] = useState(false);
const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
```

### 3. Função para abrir o Sheet

```typescript
const handleEdit = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setSheetOpen(true);
};

const handleNew = () => {
    setSelectedProcedure(null);
    setSheetOpen(true);
};
```

### 4. Função de salvar

```typescript
const handleSave = async (data: Procedure) => {
    if (data.id) {
        // Atualizar procedimento existente
        const { error } = await supabase
            .from('procedures')
            .update({
                name: data.name,
                category: data.category,
                base_price: data.base_price,
                estimated_duration: data.estimated_duration,
                estimated_lab_cost: data.estimated_lab_cost,
                commission_type: data.commission_type,
                commission_base_value: data.commission_base_value
            })
            .eq('id', data.id);

        if (error) throw error;
    } else {
        // Criar novo procedimento
        const { error } = await supabase
            .from('procedures')
            .insert([{
                clinic_id: clinicId,
                name: data.name,
                category: data.category,
                base_price: data.base_price,
                estimated_duration: data.estimated_duration,
                estimated_lab_cost: data.estimated_lab_cost,
                commission_type: data.commission_type,
                commission_base_value: data.commission_base_value
            }]);

        if (error) throw error;
    }

    // Recarregar lista
    await loadProcedures();
};
```

### 5. Renderizar o Sheet

```tsx
return (
    <div>
        {/* Botão Novo */}
        <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Procedimento
        </Button>

        {/* Lista de Procedimentos */}
        <div className="space-y-2 mt-4">
            {procedures.map(proc => (
                <div key={proc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h3 className="font-bold">{proc.name}</h3>
                        <p className="text-sm text-muted-foreground">{proc.category}</p>
                    </div>
                    <Button variant="outline" onClick={() => handleEdit(proc)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                    </Button>
                </div>
            ))}
        </div>

        {/* Sheet de Edição */}
        <ProcedureSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            procedure={selectedProcedure}
            clinicId={clinicId}
            onSave={handleSave}
        />
    </div>
);
```

---

## Exemplo Completo Mínimo

```typescript
import React, { useState, useEffect } from 'react';
import { ProcedureSheet } from './procedures/ProcedureSheet';
import { Button } from './ui/button';
import { Plus, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Procedure {
    id?: string;
    name: string;
    category: string;
    base_price: number;
    estimated_duration: number;
    estimated_lab_cost: number;
    commission_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    commission_base_value: number;
}

export const ProceduresSettings: React.FC = () => {
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
    const clinicId = 'your-clinic-id'; // Pegar do contexto

    useEffect(() => {
        loadProcedures();
    }, []);

    const loadProcedures = async () => {
        const { data, error } = await supabase
            .from('procedures')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('name');

        if (!error && data) {
            setProcedures(data);
        }
    };

    const handleEdit = (procedure: Procedure) => {
        setSelectedProcedure(procedure);
        setSheetOpen(true);
    };

    const handleNew = () => {
        setSelectedProcedure(null);
        setSheetOpen(true);
    };

    const handleSave = async (data: Procedure) => {
        if (data.id) {
            await supabase
                .from('procedures')
                .update(data)
                .eq('id', data.id);
        } else {
            await supabase
                .from('procedures')
                .insert([{ ...data, clinic_id: clinicId }]);
        }

        await loadProcedures();
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Procedimentos</h2>
                <Button onClick={handleNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Procedimento
                </Button>
            </div>

            <div className="space-y-2">
                {procedures.map(proc => (
                    <div key={proc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <h3 className="font-bold">{proc.name}</h3>
                            <p className="text-sm text-muted-foreground">{proc.category}</p>
                        </div>
                        <Button variant="outline" onClick={() => handleEdit(proc)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </Button>
                    </div>
                ))}
            </div>

            <ProcedureSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                procedure={selectedProcedure}
                clinicId={clinicId}
                onSave={handleSave}
            />
        </div>
    );
};
```

---

## Responsividade

O Sheet já está configurado para ser responsivo:

- **Mobile:** Ocupa tela inteira
- **Desktop:** Largura máxima de `2xl` (672px)
- **Scroll:** Automático quando conteúdo excede altura

---

## Próximos Passos

1. ✅ ProcedureSheet criado
2. 🔄 Integrar no ProceduresSettings existente
3. 🔄 Testar fluxo completo
4. 🔄 Ajustar estilos se necessário
