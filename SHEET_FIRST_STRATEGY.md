# 🎨 SHEET FIRST STRATEGY - DESIGN SYSTEM

## 📋 Decisão de Arquitetura

A partir de agora, o ClinicPro adota o padrão **SHEET FIRST** para todos os formulários de cadastro e edição.

---

## 🎯 REGRAS DE IMPLEMENTAÇÃO

### ✅ USE SHEET (Gaveta Lateral) PARA:

1. **Cadastros e Edições**
   - Novo Paciente
   - Editar Paciente
   - Novo Procedimento
   - Editar Procedimento
   - Nova Despesa
   - Editar Despesa
   - Novo Orçamento
   - Editar Orçamento
   - Qualquer formulário de CRUD

2. **Visualizações Detalhadas**
   - Detalhes do Paciente
   - Histórico de Atendimentos
   - Detalhes do Orçamento

### ❌ USE DIALOG (Modal) APENAS PARA:

1. **Confirmações Destrutivas**
   ```tsx
   <AlertDialog>
     <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
     <AlertDialogDescription>
       Esta ação não pode ser desfeita.
     </AlertDialogDescription>
   </AlertDialog>
   ```

2. **Security PIN**
   - Modal de senha centralizado
   - Foco total na autenticação

3. **Alertas Rápidos**
   - Mensagens de erro/sucesso
   - Notificações simples

---

## 📐 PADRÕES DE LARGURA

### Sheet Sizes (Responsivo)

```tsx
// Pequeno - Formulários simples (1-3 campos)
className="sm:max-w-md"  // 448px

// Médio - Formulários padrão (4-8 campos)
className="sm:max-w-lg"  // 512px

// Grande - Formulários complexos (9-15 campos)
className="sm:max-w-xl"  // 576px

// Extra Grande - Formulários com tabelas/listas
className="sm:max-w-2xl" // 672px

// Full - Orçamentos, formulários muito complexos
className="sm:max-w-4xl" // 896px
```

### Quando usar cada tamanho:

| Tamanho | Uso | Exemplo |
|---------|-----|---------|
| `sm:max-w-md` | Formulários simples | Login, Trocar Senha |
| `sm:max-w-lg` | Cadastros básicos | Categoria, Fornecedor |
| `sm:max-w-xl` | Cadastros padrão | Paciente, Despesa |
| `sm:max-w-2xl` | Formulários com listas | Procedimento (com Kit) |
| `sm:max-w-4xl` | Formulários complexos | Orçamento, Prontuário |

---

## 🏗️ ESTRUTURA PADRÃO

### Anatomia de um Sheet

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="sm:max-w-xl overflow-y-auto">
    {/* Header */}
    <SheetHeader>
      <SheetTitle>Título</SheetTitle>
      <SheetDescription>Descrição</SheetDescription>
    </SheetHeader>

    {/* Content */}
    <div className="mt-6 space-y-6">
      {/* Formulário aqui */}
    </div>

    {/* Footer (Opcional) */}
    <div className="flex justify-end gap-3 pt-6 border-t">
      <Button variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button onClick={onSave}>
        Salvar
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

---

## 🎨 BOAS PRÁTICAS

### 1. Scroll Interno
```tsx
// ✅ CORRETO - Scroll no conteúdo
<SheetContent className="overflow-y-auto">
  <div className="space-y-6">
    {/* Muito conteúdo */}
  </div>
</SheetContent>

// ❌ ERRADO - Sem scroll
<SheetContent>
  <div className="h-full overflow-y-auto">
    {/* Conteúdo */}
  </div>
</SheetContent>
```

### 2. Espaçamento Consistente
```tsx
// Header
<SheetHeader className="mb-6">

// Seções
<div className="space-y-6">
  <div className="space-y-4">
    {/* Campos */}
  </div>
</div>

// Footer
<div className="pt-6 border-t">
```

### 3. Loading States
```tsx
<Button disabled={saving}>
  {saving ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Salvando...
    </>
  ) : (
    <>
      <Save className="w-4 h-4 mr-2" />
      Salvar
    </>
  )}
</Button>
```

### 4. Validação Visual
```tsx
<Input
  error={errors.name}
  className={errors.name ? 'border-red-500' : ''}
/>
{errors.name && (
  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
)}
```

---

## 📦 COMPONENTES CRIADOS

### 1. ProcedureSheet ✅
- **Arquivo:** `components/procedures/ProcedureSheet.tsx`
- **Largura:** `sm:max-w-2xl`
- **Abas:** Dados & Lucro | Kit de Materiais
- **Status:** ✅ Implementado

### 2. PatientSheet 🔄
- **Arquivo:** `components/patients/PatientSheet.tsx`
- **Largura:** `sm:max-w-xl`
- **Seções:** Dados Pessoais | Endereço | Contato
- **Status:** 🔜 Próximo

### 3. ExpenseSheet 🔄
- **Arquivo:** `components/financial/ExpenseSheet.tsx`
- **Largura:** `sm:max-w-lg`
- **Campos:** Categoria, Valor, Data, Fornecedor
- **Status:** 🔜 Próximo

### 4. BudgetSheet 🔄
- **Arquivo:** `components/budgets/BudgetSheet.tsx`
- **Largura:** `sm:max-w-4xl`
- **Complexidade:** Alta (lista de procedimentos)
- **Status:** 🔜 Futuro

---

## 🔄 PLANO DE MIGRAÇÃO

### Fase 1: Configurações (Atual) ✅
- [x] ProcedureSheet
- [ ] CategorySheet (Categorias Financeiras)
- [ ] SupplierSheet (Fornecedores)
- [ ] BankAccountSheet (Contas Bancárias)

### Fase 2: Financeiro 🔄
- [ ] ExpenseSheet (Despesas)
- [ ] RevenueSheet (Receitas)
- [ ] TransactionSheet (Movimentações)

### Fase 3: Clínico 🔜
- [ ] PatientSheet (Pacientes)
- [ ] AppointmentSheet (Agendamentos)
- [ ] BudgetSheet (Orçamentos)
- [ ] TreatmentSheet (Tratamentos)

### Fase 4: Estoque 🔜
- [ ] InventoryItemSheet (Itens)
- [ ] StockMovementSheet (Movimentações)

---

## 💡 BENEFÍCIOS

### UX (Experiência do Usuário)
- ✅ Mantém contexto da lista de fundo
- ✅ Navegação mais fluida
- ✅ Melhor para mobile (tela inteira)
- ✅ Menos "modal fatigue"

### DX (Experiência do Desenvolvedor)
- ✅ Padrão consistente
- ✅ Código reutilizável
- ✅ Fácil manutenção
- ✅ Dark mode automático

### Performance
- ✅ Menos re-renders
- ✅ Animações nativas do shadcn
- ✅ Lazy loading de conteúdo

---

## 🚫 ANTI-PATTERNS (Evite)

### ❌ Modal para Formulários
```tsx
// ERRADO
<Dialog>
  <DialogContent>
    <form>...</form>
  </DialogContent>
</Dialog>
```

### ❌ Sheet sem Scroll
```tsx
// ERRADO - Conteúdo pode ser cortado
<SheetContent>
  <div className="h-full">
    {/* Muito conteúdo */}
  </div>
</SheetContent>
```

### ❌ Sheet muito estreito
```tsx
// ERRADO - Formulário complexo em sheet pequeno
<SheetContent className="sm:max-w-sm">
  <form>
    {/* 20 campos */}
  </form>
</SheetContent>
```

---

## 📚 REFERÊNCIAS

- [shadcn/ui Sheet](https://ui.shadcn.com/docs/components/sheet)
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)
- [Mobile-First Design](https://www.nngroup.com/articles/mobile-first/)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

Ao criar um novo Sheet, verifique:

- [ ] Largura apropriada (`sm:max-w-*`)
- [ ] `overflow-y-auto` no SheetContent
- [ ] SheetHeader com Title e Description
- [ ] Espaçamento consistente (space-y-6)
- [ ] Loading states nos botões
- [ ] Validação de campos
- [ ] Toast notifications
- [ ] Dark mode testado
- [ ] Mobile testado
- [ ] Acessibilidade (labels, aria-*)

---

**Última Atualização:** 23/12/2025  
**Status:** 🟢 Ativo - Padrão oficial do ClinicPro
