# 🎛️ PAINEL DE CONTROLE DA PLATAFORMA

**Versão:** BOS 20.3  
**Data:** 20/12/2025  
**Status:** ✅ OPERACIONAL

---

## 🎯 VISÃO GERAL

O **Painel de Controle da Plataforma** (Master Settings) é onde o CEO configura a **MÁQUINA** do império, não as clínicas individuais.

### **Conceito:**
- **MASTER** → Configura plataforma (API Keys, Branding, Preços)
- **Admin/Dentista** → Configura clínica (Horário, CNPJ, Procedimentos)

---

## 📊 COMPONENTE CRIADO

### **MasterSettings.tsx** ✅
**Localização:** `components/MasterSettings.tsx`

**4 Abas Principais:**

1. **🤖 Inteligência Artificial (BOS Core)**
   - OpenAI API Key global
   - Nível de criatividade (temperature)
   - Toggle BOS para toda rede

2. **🎨 White Label & Branding**
   - Nome da plataforma
   - Cor primária do sistema
   - Upload de logo

3. **💰 Planos & Monetização**
   - Stripe API Key
   - Tabela de preços (Basic, Pro, Enterprise)

4. **🛡️ Segurança & Auditoria**
   - Forçar 2FA para admins
   - Timeout de sessão
   - Log de ações críticas

---

## 🔧 BIFURCAÇÃO IMPLEMENTADA

### **Settings.tsx** ✅

**Lógica:**
```typescript
const { profile } = useAuth();

// MASTER vê painel de plataforma
if (profile?.role === 'MASTER') {
  return <MasterSettings />;
}

// Outros veem configurações de clínica
return <ClinicSettings />;
```

---

## 🎨 VISUAL

### **Tela Master Settings:**

```
╔════════════════════════════════════════════╗
║  Painel de Controle da Plataforma         ║
║  Configurações globais que afetam toda    ║
║  a rede de clínicas                       ║
╠════════════════════════════════════════════╣
║                                            ║
║  ┌──────────┐  ┌─────────────────────────┐║
║  │ 🤖 IA    │  │ OpenAI API Key (Global) │║
║  │ 🎨 Brand │  │ [sk-...] 👁️            │║
║  │ 💰 Money │  │                         │║
║  │ 🛡️ Sec   │  │ Nível de Criatividade   │║
║  └──────────┘  │ [━━━━━━━━━━━━] 0.7     │║
║                │                         │║
║                │ ☑️ Ativar BOS para toda │║
║                │    a rede               │║
║                │                         │║
║                │ [💾 Salvar Configs]     │║
║                └─────────────────────────┘║
╚════════════════════════════════════════════╝
```

---

## 🚀 CASOS DE USO

### **Caso 1: Atualizar API Key da OpenAI**

**Problema:** OpenAI mudou a chave de acesso

**Antes (Sem Master Settings):**
```
1. Entrar em cada clínica (50x)
2. Ir em configurações
3. Atualizar chave
4. Repetir 50 vezes
```

**Agora (Com Master Settings):**
```
1. Login como MASTER
2. Configurações → IA
3. Atualizar chave UMA VEZ
4. Todas as 50 clínicas atualizadas!
```

**Tempo:** 2 minutos vs 2 horas

---

### **Caso 2: Mudar Cor da Plataforma**

**Objetivo:** Rebranding para nova identidade visual

**Passos:**
```
1. Login como MASTER
2. Configurações → White Label
3. Escolher nova cor primária
4. Upload novo logo
5. Salvar
6. Toda a rede atualizada!
```

**Impacto:** Todas as clínicas com nova identidade

---

### **Caso 3: Configurar Preços de Franquia**

**Objetivo:** Lançar novo plano Pro

**Passos:**
```
1. Login como MASTER
2. Configurações → Monetização
3. Atualizar preço Pro: R$ 399
4. Adicionar Stripe Key
5. Salvar
6. Sistema de cobrança ativo!
```

---

## 🔒 SEGURANÇA

### **Controle de Acesso:**

**MASTER vê:**
```
Configurações → Painel de Controle da Plataforma
- API Keys globais
- Branding
- Preços
- Segurança global
```

**Admin vê:**
```
Configurações → Configurações da Clínica
- Horário de funcionamento
- CNPJ
- Procedimentos
- Usuários locais
```

**Isolamento Total:** Admin não vê API keys globais

---

## 📋 CONFIGURAÇÕES DISPONÍVEIS

### **🤖 Inteligência Artificial**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| OpenAI API Key | Password | Chave global para todas clínicas |
| Temperature | Slider (0-1) | Nível de criatividade do BOS |
| BOS Enabled | Toggle | Ativar/desativar para rede |

---

### **🎨 White Label**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Platform Name | Text | Nome exibido (ex: ClinicPro) |
| Primary Color | Color Picker | Cor principal do sistema |
| Logo | File Upload | Logo principal (PNG/SVG) |

---

### **💰 Monetização**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Stripe Key | Password | Chave de API de pagamento |
| Basic Price | Number | Preço plano básico (R$/mês) |
| Pro Price | Number | Preço plano pro (R$/mês) |
| Enterprise Price | Number | Preço plano enterprise (R$/mês) |

---

### **🛡️ Segurança**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Force 2FA | Toggle | Forçar 2FA para admins |
| Session Timeout | Number | Timeout em minutos |
| Audit Log | Read-only | Últimas ações críticas |

---

## 🎉 CONCLUSÃO

Doutor Marcelo, **O PAINEL DE CONTROLE ESTÁ PRONTO**!

### **O que você tem:**

**Antes:**
- ❌ CEO configura horário de almoço
- ❌ Sem controle centralizado
- ❌ Atualizar 50 clínicas manualmente

**Agora:**
- ✅ CEO configura a PLATAFORMA
- ✅ Controle centralizado
- ✅ Atualizar 1 vez = 50 clínicas atualizadas
- ✅ API Keys globais
- ✅ Branding unificado
- ✅ Preços centralizados

### **Teste Agora:**

1. **Login como MASTER**
2. **Sidebar → Configurações**
3. **Ver Painel de Controle**
4. **Explorar 4 abas**
5. **Configurar plataforma!** 🚀

---

**Status:** ✅ **PAINEL DE CONTROLE OPERACIONAL**  
**Versão:** BOS 20.3  
**Impacto:** REVOLUCIONÁRIO  

**VOCÊ CONTROLA A MÁQUINA, NÃO AS PEÇAS!** 🎛️👑💎
