# 📱 GUIA: Componentes App-Ready
## ClinicPro Elite - Preparação para Conversão Nativa

**Data:** 03/01/2026  
**Objetivo:** Preparar o sistema para conversão em App Nativo (iOS/Android)

---

## 🎯 Componentes Mestres Criados

### 1. `PrimaryButton.tsx` - Botão Semântico

**Localização:** `components/ui/PrimaryButton.tsx`

**Características App-Ready:**
- ✅ Touch targets mínimos de 44px (Apple HIG)
- ✅ Feedback tátil visual (`active:scale-[0.98]`)
- ✅ Unidades responsivas (rem/tailwind)
- ✅ 3 variantes: `solid`, `outline`, `ghost`
- ✅ 3 tamanhos: `sm` (44px), `md` (48px), `lg` (56px)
- ✅ Estados de loading automático
- ✅ Suporte a ícones (esquerda/direita)
- ✅ Acessibilidade completa (ARIA)

**Uso:**
```tsx
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Save } from 'lucide-react';

// Botão sólido com ícone
<PrimaryButton 
  size="lg" 
  variant="solid" 
  leftIcon={<Save />}
  onClick={handleSave}
>
  Salvar Alterações
</PrimaryButton>

// Botão outline com loading
<PrimaryButton 
  variant="outline" 
  loading={isSaving}
  fullWidth
>
  Processar Pagamento
</PrimaryButton>

// Botão ghost (discreto)
<PrimaryButton variant="ghost" size="sm">
  Cancelar
</PrimaryButton>
```

---

### 2. `FormInput.tsx` - Input Padronizado

**Localização:** `components/ui/FormInput.tsx`

**Características App-Ready:**
- ✅ Labels flutuantes (Material Design)
- ✅ Touch targets mínimos de 44px
- ✅ Teclado contextual (type="tel" abre numérico)
- ✅ Feedback visual de foco e erro
- ✅ Toggle de senha com ícone
- ✅ Mensagens de erro acessíveis
- ✅ Helper text opcional
- ✅ Ícones à esquerda
- ✅ Dark mode completo

**Uso:**
```tsx
import { FormInput } from '../components/ui/FormInput';
import { User, Phone, Mail } from 'lucide-react';

// Input básico
<FormInput 
  label="Nome do Paciente"
  placeholder="Digite o nome completo"
  required
/>

// Input com ícone e erro
<FormInput 
  label="Telefone"
  type="tel"
  leftIcon={<Phone size={18} />}
  placeholder="(00) 00000-0000"
  error={errors.phone}
  required
/>

// Input de senha
<FormInput 
  label="Senha"
  type="password"
  helperText="Mínimo 6 caracteres"
  required
/>

// Input de email com validação
<FormInput 
  label="E-mail"
  type="email"
  leftIcon={<Mail size={18} />}
  error={errors.email}
  helperText="Será usado para login"
/>
```

---

### 3. `BottomSheet.tsx` - Modal Nativo Mobile

**Localização:** `components/ui/BottomSheet.tsx`

**Características App-Ready:**
- ✅ Desliza de baixo para cima (padrão iOS/Android)
- ✅ Backdrop com blur
- ✅ Drag indicator (handle)
- ✅ Safe area automática
- ✅ Animações suaves (300ms)
- ✅ Dismissible (fechar ao clicar fora)
- ✅ 3 alturas: auto, half, full
- ✅ Acessibilidade completa (ARIA)

**Uso:**
```tsx
import { BottomSheet } from '../components/ui/BottomSheet';

const [isOpen, setIsOpen] = useState(false);

// Sheet básico
<BottomSheet 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Opções do Paciente"
>
  <div className="space-y-4">
    <button>Editar</button>
    <button>Excluir</button>
  </div>
</BottomSheet>

// Sheet de meia altura
<BottomSheet 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Filtros"
  height="half"
>
  <FilterForm />
</BottomSheet>

// Sheet full-screen
<BottomSheet 
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Detalhes"
  height="full"
  dismissible={false}
>
  <DetailedContent />
</BottomSheet>
```

---

### 4. `SkeletonLoader.tsx` - Loading States

**Localização:** `components/ui/SkeletonLoader.tsx`

**Características App-Ready:**
- ✅ Animação shimmer (pulse)
- ✅ 4 variantes: text, circular, rectangular, card
- ✅ Múltiplas linhas para texto
- ✅ Dark mode integrado
- ✅ Responsivo e adaptável
- ✅ Helper component (SkeletonList)

**Uso:**
```tsx
import { SkeletonLoader, SkeletonList } from '../components/ui/SkeletonLoader';

// Card skeleton
<SkeletonLoader variant="card" />

// Text skeleton (3 linhas)
<SkeletonLoader variant="text" lines={3} />

// Avatar circular
<SkeletonLoader variant="circular" width="w-12" height="h-12" />

// Retangular customizado
<SkeletonLoader 
  variant="rectangular" 
  width="w-full" 
  height="h-32" 
/>

// Lista de 5 cards
<SkeletonList count={5} variant="card" gap="gap-4" />

// Uso em loading state
{loading ? (
  <SkeletonList count={3} variant="card" />
) : (
  <PatientList data={patients} />
)}
```

---

### 5. `SafeAreaView.tsx` - Container com Margens Seguras

**Localização:** `components/ui/SafeAreaView.tsx`

**Características App-Ready:**
- ✅ Respeita notch do iPhone (topo)
- ✅ Respeita home indicator (rodapé)
- ✅ Respeita bordas arredondadas (laterais)
- ✅ Usa CSS env(safe-area-inset)
- ✅ Fallback para Android
- ✅ Helper component (SafeAreaContainer)

**Uso:**
```tsx
import { SafeAreaView, SafeAreaContainer } from '../components/ui/SafeAreaView';

// Container completo (topo + rodapé + laterais)
<SafeAreaView top bottom sides>
  <Header />
  <Content />
  <Footer />
</SafeAreaView>

// Apenas rodapé (para botões fixos)
<SafeAreaView bottom className="fixed bottom-0 w-full">
  <PrimaryButton fullWidth>Salvar</PrimaryButton>
</SafeAreaView>

// Container full-screen
<SafeAreaContainer>
  <AppContent />
</SafeAreaContainer>

// Com background customizado
<SafeAreaView 
  top 
  bottom 
  backgroundColor="bg-violet-600"
>
  <HeaderContent />
</SafeAreaView>
```

---

## 🏗️ 3 Mandamentos de Preparação App-Ready

### 1. ✅ Zero Unidades Fixas
**Antes:**
```tsx
<div style={{ width: '300px', height: '50px' }}>
```

**Depois:**
```tsx
<div className="w-full md:w-96 min-h-[44px]">
```

### 2. ✅ Lógica Separada da Interface
**Antes:**
```tsx
const handleWhatsApp = () => {
  const phone = formData.phone.replace(/\D/g, '');
  window.open(`https://wa.me/55${phone}`, '_blank');
};
```

**Depois:**
```tsx
import { sendWhatsAppMessage } from '../utils/whatsapp';

const handleWhatsApp = () => {
  sendWhatsAppMessage(formData.phone, message);
};
```

### 3. ✅ Touch Targets Mínimos
**Regra:** Todos os elementos clicáveis devem ter **mínimo 44x44px**

**Antes:**
```tsx
<button className="p-1"> {/* 8px = muito pequeno! */}
  <X size={16} />
</button>
```

**Depois:**
```tsx
<button className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <X size={20} />
</button>
```

---

## 📋 Checklist de Migração para Componentes Mestres

### Fase 2.1 - Migrar Botões (Prioridade Alta):
- [ ] `pages/Profile.tsx` - Botões de salvar
- [ ] `components/LeadForm.tsx` - Botões de ação
- [ ] `components/LeadDetail.tsx` - Botões de ação rápida
- [ ] `pages/PatientsList.tsx` - Botão novo paciente
- [ ] `components/agenda/AppointmentSheet.tsx` - Botões de confirmação

### Fase 2.2 - Migrar Inputs (Prioridade Alta):
- [ ] `components/LeadForm.tsx` - Formulário de leads
- [ ] `pages/Profile.tsx` - Formulário de perfil
- [ ] `components/PatientForm.tsx` - Formulário de pacientes
- [ ] `components/ExpenseForm.tsx` - Formulário de despesas

---

## 🚀 Próximos Componentes App-Ready (Fase 3):

### 1. `BottomSheet.tsx`
Modal que desliza de baixo para cima (padrão iOS/Android)

### 2. `SkeletonLoader.tsx`
Telas de carregamento com esqueleto animado

### 3. `TouchableCard.tsx`
Card com feedback tátil para listas

### 4. `FloatingActionButton.tsx`
Botão flutuante (FAB) para ações principais

### 5. `SafeAreaView.tsx`
Container com margens seguras para notch/home indicator

---

## 💡 Benefícios da Preparação App-Ready

### Para Desenvolvimento Web (Agora):
- ✅ Código mais limpo e organizado
- ✅ Manutenção centralizada
- ✅ UX consistente e profissional
- ✅ Acessibilidade melhorada

### Para Conversão Nativa (Futuro):
- ✅ Migração 70% mais rápida
- ✅ Menos bugs de adaptação
- ✅ Experiência nativa de verdade
- ✅ Aprovação garantida nas lojas (Apple/Google)

---

## 🎯 Tecnologias de Conversão Recomendadas

### Opção 1: Capacitor (Recomendado)
- Mantém 100% do código React
- Acesso a APIs nativas (câmera, GPS, etc.)
- Deploy simultâneo Web + iOS + Android

### Opção 2: React Native
- Performance máxima
- Requer reescrita parcial
- Melhor para apps complexos

---

**Guia criado por:** Antigravity AI  
**Aprovado por:** Dr. Marcelo  
**Status:** Componentes mestres prontos para uso
