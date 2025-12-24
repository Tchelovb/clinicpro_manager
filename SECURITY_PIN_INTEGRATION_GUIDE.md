# 🔐 SECURITY PIN MODAL - GUIA DE INTEGRAÇÃO

## 📋 Como Usar o Security PIN em Seus Componentes

### 1. Importar o Hook e o Modal

```typescript
import SecurityPinModal from '../components/SecurityPinModal';
import { useSecurityPin } from '../hooks/useSecurityPin';
```

### 2. Configurar o Hook no Componente

```typescript
const MyComponent = () => {
  const securityPin = useSecurityPin({
    title: '🔐 Confirmar Estorno',
    description: 'Esta ação é irreversível e requer PIN de segurança',
    actionType: 'REFUND',
    entityType: 'INSTALLMENT',
    onSuccess: () => {
      // Executar ação crítica aqui
      performRefund();
    }
  });

  // ...resto do componente
};
```

### 3. Adicionar o Modal ao JSX

```typescript
return (
  <div>
    {/* Seu componente */}
    
    {/* Security PIN Modal */}
    <SecurityPinModal
      isOpen={securityPin.isOpen}
      onClose={securityPin.handleCancel}
      onSuccess={securityPin.handleSuccess}
      title={securityPin.config.title}
      description={securityPin.config.description}
      actionType={securityPin.config.actionType}
      entityType={securityPin.config.entityType}
      entityId={securityPin.config.entityId}
      entityName={securityPin.config.entityName}
    />
  </div>
);
```

### 4. Solicitar PIN Antes de Ação Crítica

```typescript
const handleRefund = () => {
  // Ao invés de executar direto, solicitar PIN
  securityPin.requestPin({
    entityId: installmentId,
    entityName: `Parcela ${installmentNumber} - ${patientName}`
  });
};
```

---

## 🎯 EXEMPLOS DE USO POR CASO

### Exemplo 1: Estorno de Pagamento

```typescript
import React from 'react';
import SecurityPinModal from '../components/SecurityPinModal';
import { useSecurityPin } from '../hooks/useSecurityPin';

const RefundButton = ({ installmentId, amount, patientName }) => {
  const securityPin = useSecurityPin({
    title: '🔐 Confirmar Estorno',
    description: `Estornar pagamento de R$ ${amount.toFixed(2)}`,
    actionType: 'REFUND',
    entityType: 'INSTALLMENT',
    onSuccess: async () => {
      // Executar estorno
      await supabase
        .from('installments')
        .update({ 
          status: 'PENDING',
          paid_date: null,
          paid_amount: null
        })
        .eq('id', installmentId);
      
      alert('Estorno realizado com sucesso!');
    }
  });

  const handleRefund = () => {
    securityPin.requestPin({
      entityId: installmentId,
      entityName: `Estorno - ${patientName}`
    });
  };

  return (
    <>
      <button onClick={handleRefund} className="btn-danger">
        Estornar Pagamento
      </button>

      <SecurityPinModal
        isOpen={securityPin.isOpen}
        onClose={securityPin.handleCancel}
        onSuccess={securityPin.handleSuccess}
        {...securityPin.config}
      />
    </>
  );
};
```

---

### Exemplo 2: Desconto Maior que 5%

```typescript
const ApplyDiscount = ({ budgetId, originalPrice }) => {
  const [discount, setDiscount] = useState(0);
  
  const securityPin = useSecurityPin({
    title: '🔐 Autorizar Desconto',
    description: 'Descontos acima de 5% requerem PIN de segurança',
    actionType: 'DISCOUNT',
    entityType: 'BUDGET',
    onSuccess: async () => {
      // Aplicar desconto
      await supabase
        .from('budgets')
        .update({ 
          discount_percent: discount,
          discount_amount: (originalPrice * discount) / 100
        })
        .eq('id', budgetId);
      
      alert('Desconto aplicado!');
    }
  });

  const handleApplyDiscount = () => {
    const discountPercent = (discount / originalPrice) * 100;
    
    if (discountPercent > 5) {
      // Solicitar PIN
      securityPin.requestPin({
        entityId: budgetId,
        entityName: `Desconto de ${discountPercent.toFixed(1)}%`
      });
    } else {
      // Aplicar direto
      applyDiscountDirectly();
    }
  };

  return (
    <>
      <input 
        type="number" 
        value={discount} 
        onChange={(e) => setDiscount(Number(e.target.value))}
        placeholder="Valor do desconto"
      />
      <button onClick={handleApplyDiscount}>
        Aplicar Desconto
      </button>

      <SecurityPinModal
        isOpen={securityPin.isOpen}
        onClose={securityPin.handleCancel}
        onSuccess={securityPin.handleSuccess}
        {...securityPin.config}
      />
    </>
  );
};
```

---

### Exemplo 3: Exclusão de Paciente

```typescript
const DeletePatientButton = ({ patientId, patientName }) => {
  const securityPin = useSecurityPin({
    title: '🔐 Confirmar Exclusão',
    description: `Tem certeza que deseja excluir ${patientName}? Esta ação é irreversível.`,
    actionType: 'DELETE',
    entityType: 'PATIENT',
    onSuccess: async () => {
      // Excluir paciente
      await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);
      
      navigate('/patients');
    }
  });

  const handleDelete = () => {
    securityPin.requestPin({
      entityId: patientId,
      entityName: patientName
    });
  };

  return (
    <>
      <button onClick={handleDelete} className="btn-danger">
        Excluir Paciente
      </button>

      <SecurityPinModal
        isOpen={securityPin.isOpen}
        onClose={securityPin.handleCancel}
        onSuccess={securityPin.handleSuccess}
        {...securityPin.config}
      />
    </>
  );
};
```

---

### Exemplo 4: Aprovar Orçamento com Margem Baixa

```typescript
const ApproveBudget = ({ budgetId, margin }) => {
  const securityPin = useSecurityPin({
    title: '🔐 Aprovar Orçamento',
    description: `Margem de ${margin}% está abaixo do mínimo de 20%`,
    actionType: 'BUDGET_OVERRIDE',
    entityType: 'BUDGET',
    onSuccess: async () => {
      // Aprovar orçamento
      await supabase
        .from('budgets')
        .update({ 
          status: 'APPROVED',
          override_reason: 'Aprovado via PIN Master'
        })
        .eq('id', budgetId);
      
      alert('Orçamento aprovado!');
    }
  });

  const handleApprove = () => {
    if (margin < 20) {
      // Solicitar PIN
      securityPin.requestPin({
        entityId: budgetId,
        entityName: `Orçamento com margem de ${margin}%`
      });
    } else {
      // Aprovar direto
      approveDirectly();
    }
  };

  return (
    <>
      <button onClick={handleApprove}>
        Aprovar Orçamento
      </button>

      <SecurityPinModal
        isOpen={securityPin.isOpen}
        onClose={securityPin.handleCancel}
        onSuccess={securityPin.handleSuccess}
        {...securityPin.config}
      />
    </>
  );
};
```

---

## 🔧 API DO SECURITY SERVICE

### Métodos Disponíveis

```typescript
import { securityService } from '../services/securityService';

// Verificar se PIN está configurado
const hasPin = await securityService.hasPinConfigured(userId);

// Verificar se PIN está bloqueado
const lockStatus = await securityService.isPinLocked(userId);
// Retorna: { isLocked: boolean, lockedUntil?: Date }

// Definir/Alterar PIN
const result = await securityService.setPin(userId, '1234');
// Retorna: { success: boolean, message: string }

// Validar PIN
const validation = await securityService.validatePin(userId, '1234');
// Retorna: { 
//   success: boolean, 
//   isLocked: boolean, 
//   attemptsRemaining?: number,
//   lockedUntil?: Date,
//   message: string 
// }

// Desbloquear PIN (apenas ADMIN)
const unlock = await securityService.unlockPin(userId, adminUserId);
// Retorna: { success: boolean, message: string }

// Registrar ação no audit log
await securityService.logAction({
  action_type: 'REFUND',
  entity_type: 'INSTALLMENT',
  entity_id: 'uuid',
  entity_name: 'Parcela 1',
  changes_summary: 'Estorno autorizado via PIN'
});
```

---

## 🎨 PROPS DO SECURITY PIN MODAL

```typescript
interface SecurityPinModalProps {
  isOpen: boolean;              // Controla visibilidade
  onClose: () => void;          // Callback ao fechar
  onSuccess: () => void;        // Callback após PIN válido
  title?: string;               // Título do modal
  description?: string;         // Descrição da ação
  actionType?: 'REFUND' | 'DISCOUNT' | 'DELETE' | 'BUDGET_OVERRIDE' | 'CUSTOM';
  entityType?: string;          // Tipo da entidade (para audit log)
  entityId?: string;            // ID da entidade
  entityName?: string;          // Nome da entidade
}
```

---

## 🔒 REGRAS DE SEGURANÇA

1. **Bloqueio Automático:** 3 tentativas falhas = bloqueio de 15 minutos
2. **Hash SHA-256:** PIN nunca é armazenado em texto plano
3. **Audit Log:** Todas as tentativas são registradas
4. **Desbloqueio Automático:** Após 15 minutos, o PIN é desbloqueado
5. **Apenas ADMIN pode desbloquear manualmente**

---

## 📊 AUDIT LOG

Todas as ações são registradas em `system_audit_logs`:

- `PIN_SUCCESS`: PIN validado com sucesso
- `PIN_FAILED`: Tentativa falha de PIN
- `PIN_BLOCKED`: Tentativa de uso de PIN bloqueado
- `REFUND`: Estorno autorizado
- `DISCOUNT`: Desconto autorizado
- `DELETE`: Exclusão autorizada
- `BUDGET_OVERRIDE`: Orçamento aprovado com margem baixa

---

## 🚀 PRÓXIMOS PASSOS

1. Integrar com página de Recebimentos (estornos)
2. Integrar com BudgetForm (descontos >5%)
3. Integrar com PatientDetail (exclusão)
4. Integrar com Orçamento Profit (margem <20%)
5. Adicionar na página de Configurações (SetupSecurityPin)

---

**Desenvolvido por:** BOS Fortress Team  
**Versão:** 1.0.0  
**Data:** 23/12/2025
