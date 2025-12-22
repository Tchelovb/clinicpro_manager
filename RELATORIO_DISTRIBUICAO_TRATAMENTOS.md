# 📊 RELATÓRIO DE ANÁLISE: DISTRIBUIÇÃO DE TRATAMENTOS POR CATEGORIA

## 🎯 OBJETIVO
Analisar como os procedimentos são categorizados e distribuídos nas abas do perfil do paciente quando um orçamento é aprovado.

---

## 📋 CATEGORIAS DE PROCEDIMENTOS DISPONÍVEIS

Conforme identificado em `ProceduresSettings.tsx` (linhas 317-328), as categorias disponíveis são:

1. **Dentística**
2. **Cirurgia**
3. **Ortodontia**
4. **Periodontia**
5. **Endodontia**
6. **Implante**
7. **Prótese**
8. **Radiologia**
9. **Harmonização** (HOF - Harmonização Orofacial)
10. **Outro**

---

## 🗂️ ABAS DO PERFIL DO PACIENTE

Conforme `PatientDetail.tsx` (linhas 276-282), as abas disponíveis são:

1. **Visão Geral** (`overview`)
2. **Propostas** (`budgets`) - Orçamentos
3. **Clínica Geral** (`clinical`) - Treatment Items
4. **Ortodontia** (`ortho`) - Contratos de Ortodontia
5. **HOF** (`hof`) - Harmonização Orofacial
6. **Financeiro** (`financial`) - Parcelas e Pagamentos
7. **Galeria** (`gallery`) - Imagens Clínicas

---

## ⚠️ PROBLEMA IDENTIFICADO

### **SITUAÇÃO ATUAL:**
Quando um orçamento é aprovado, o sistema:

1. ✅ **Cria `treatment_items`** na tabela `treatment_items`
2. ✅ **Cria `installments`** na tabela `installments`

**MAS:**
- ❌ **TODOS os `treatment_items` vão para a aba "Clínica Geral"**
- ❌ **NÃO há filtro por categoria**
- ❌ **Procedimentos de Ortodontia e HOF aparecem misturados**

### **CÓDIGO ATUAL (PatientDetail.tsx, linha 88-94):**
```typescript
// 3. FETCH TREATMENTS (treatment_items)
const { data: treatmentsData } = await supabase
  .from('treatment_items')
  .select('*')
  .eq('patient_id', id)
  .order('created_at', { ascending: false });

setTreatments(treatmentsData || []);
```

**Problema:** Busca TODOS os `treatment_items` sem filtrar por categoria.

### **EXIBIÇÃO (PatientDetail.tsx, linha 469-479):**
```typescript
{activeTab === 'clinical' && (
  <div className="space-y-4">
    <h2>Tratamentos Clínicos</h2>
    {treatments.length === 0 ? (
      <p>Nenhum tratamento registrado</p>
    ) : (
      <div className="grid gap-4">
        {treatments.map(treatment => (
          // Exibe TODOS os tratamentos
        ))}
      </div>
    )}
  </div>
)}
```

**Problema:** Exibe TODOS os tratamentos, independente da categoria.

---

## ✅ SOLUÇÃO NECESSÁRIA

### **1. Adicionar campo `category` na tabela `treatment_items`**

A tabela `treatment_items` **NÃO tem** campo `category`. Precisamos:

```sql
ALTER TABLE treatment_items 
ADD COLUMN category TEXT;
```

### **2. Atualizar o trigger `auto_create_treatment_and_installments()`**

Modificar para buscar a categoria do procedimento e salvar no `treatment_item`:

```sql
-- Buscar categoria do procedimento
SELECT category INTO v_category
FROM procedure
WHERE name = v_item.procedure_name
LIMIT 1;

-- Inserir com categoria
INSERT INTO treatment_items (
    patient_id,
    budget_id,
    procedure_name,
    region,
    category,  -- NOVO CAMPO
    status,
    ...
) VALUES (
    NEW.patient_id,
    NEW.id,
    v_item.procedure_name,
    v_item.region,
    v_category,  -- CATEGORIA DO PROCEDIMENTO
    'NOT_STARTED',
    ...
);
```

### **3. Criar estados separados no `PatientDetail.tsx`**

```typescript
const [clinicalTreatments, setClinicalTreatments] = useState<any[]>([]);
const [orthoTreatments, setOrthoTreatments] = useState<any[]>([]);
const [hofTreatments, setHofTreatments] = useState<any[]>([]);
```

### **4. Filtrar por categoria ao carregar**

```typescript
// Clínica Geral: Dentística, Cirurgia, Periodontia, Endodontia, Implante, Prótese, Radiologia
const { data: clinicalData } = await supabase
  .from('treatment_items')
  .select('*')
  .eq('patient_id', id)
  .in('category', ['Dentística', 'Cirurgia', 'Periodontia', 'Endodontia', 'Implante', 'Prótese', 'Radiologia', 'Outro'])
  .order('created_at', { ascending: false });

setClinicalTreatments(clinicalData || []);

// Ortodontia
const { data: orthoData } = await supabase
  .from('treatment_items')
  .select('*')
  .eq('patient_id', id)
  .eq('category', 'Ortodontia')
  .order('created_at', { ascending: false });

setOrthoTreatments(orthoData || []);

// HOF (Harmonização)
const { data: hofData } = await supabase
  .from('treatment_items')
  .select('*')
  .eq('patient_id', id)
  .eq('category', 'Harmonização')
  .order('created_at', { ascending: false });

setHofTreatments(hofData || []);
```

### **5. Atualizar contadores das abas**

```typescript
{ id: 'clinical', label: `Clínica Geral (${clinicalTreatments.length})`, icon: Stethoscope },
{ id: 'ortho', label: `Ortodontia (${orthoTreatments.length})`, icon: Smile },
{ id: 'hof', label: `HOF (${hofTreatments.length})`, icon: Sparkles },
```

---

## 📊 MAPEAMENTO DE CATEGORIAS → ABAS

| Categoria do Procedimento | Aba de Destino |
|---------------------------|----------------|
| Dentística | Clínica Geral |
| Cirurgia | Clínica Geral |
| Periodontia | Clínica Geral |
| Endodontia | Clínica Geral |
| Implante | Clínica Geral |
| Prótese | Clínica Geral |
| Radiologia | Clínica Geral |
| Outro | Clínica Geral |
| **Ortodontia** | **Ortodontia** |
| **Harmonização** | **HOF** |

---

## 🎯 RESUMO EXECUTIVO

### **Situação Atual:**
- ❌ Todos os tratamentos aparecem na aba "Clínica Geral"
- ❌ Não há separação por categoria
- ❌ Abas "Ortodontia" e "HOF" ficam vazias

### **Causa Raiz:**
1. Tabela `treatment_items` não tem campo `category`
2. Trigger não salva a categoria ao criar tratamentos
3. Frontend não filtra por categoria ao exibir

### **Solução:**
1. ✅ Adicionar coluna `category` na tabela
2. ✅ Atualizar trigger para buscar e salvar categoria
3. ✅ Criar estados separados no frontend
4. ✅ Filtrar tratamentos por categoria ao carregar
5. ✅ Exibir cada categoria na aba correta

---

## 🚀 PRÓXIMOS PASSOS

1. **Executar migration SQL** para adicionar campo `category`
2. **Atualizar trigger** `auto_create_treatment_and_installments()`
3. **Refatorar `PatientDetail.tsx`** para separar tratamentos por categoria
4. **Testar aprovação** de orçamento com procedimentos de diferentes categorias

---

**Data do Relatório:** 22/12/2025
**Analista:** Antigravity AI
**Status:** ⚠️ Correção Necessária
