# Validação da Refatoração de Roles (BOS 12.7)

Este documento detalha as mudanças realizadas para migrar o sistema de roles antigas (`DENTIST`, `MANAGER`) para a nova estrutura (`ADMIN`, `PROFESSIONAL`, `RECEPTIONIST`, `CRC`) e como validar cada componente.

## 1. Estrutura de Roles Atualizada

As novas roles do sistema são:

*   **ADMIN**: Acesso total (Sócio/Gestor). Pode ter perfil clínico (opcional).
*   **PROFESSIONAL**: Acesso focado na execução técnica (antigo DENTIST).
    *   Possui obrigatoriamente campos de Especialidade e Conselho (CRO/CRM).
    *   Visualiza agenda própria e produtividade clínica.
*   **CRC**: Central de Relacionamento com Cliente (Vendas).
    *   Foco em Pipeline, CRM e Conversão.
*   **RECEPTIONIST**: Foco operacional, agendamento e recepção.

## 2. Componentes Atualizados

### A. Gestão de Usuários (`UsersSettings.tsx`)
**O que testar:**
1.  Ao criar um novo usuário, verificar se as opções no dropdown são: Admin, Profissional de Saúde, Recepção, CRC.
2.  Selecionar "Profissional de Saúde": Verificar se campos de "Conselho" e "Especialidade" aparecem.
3.  Selecionar "Admin": Verificar se aparece o toggle "Este usuário realiza atendimentos clínicos?".
4.  Selecionar "CRC" ou "Recepção": Verificar se campos clínicos somem.

### B. Gateway de Inteligência (`IntelligenceGateway.tsx`)
**O que testar:**
1.  Logar como **ADMIN**: Deve ver "Intelligence Gateway" com "ClinicHealth" (Macro) e "Executive Mastery".
2.  Logar como **PROFESSIONAL**: Deve ver "Portal do Guardião da Técnica" com métricas de qualidade clínica.
3.  Logar como **CRC**: Deve ver "Portal do Arquiteto de Conversão" com pipeline de vendas.
4.  Logar como **RECEPTIONIST**: Deve ver "Portal da Mestre de Fluxo" com Gestão de Agenda e Triagem de Leads.
    - **Card 1**: Link para `/dashboard/schedule` (Agenda)
    - **Card 2**: Link para `/dashboard/contatos` (Triagem)
    - **Restrição**: NÃO deve ver faturamento, lucro ou margem.

### C. ChatBOS (`useBOSChat.ts`)
**O que testar:**
1.  Perguntar ao BOS "O que devo fazer agora?" com diferentes usuários.
    *   **ADMIN**: Resposta deve focar em GAP financeiro e gestão.
    *   **PROFESSIONAL**: Resposta deve focar em buracos na agenda e pacientes sem retorno.
    *   **CRC**: Resposta deve focar em leads parados e conversão.

## 3. Verificação de Código

A string `DENTIST` foi completamente removida do código fonte (`.ts`, `.tsx`), garantindo que não haverá erros de tipo ou lógica legada.

## 4. Próximos Passos (Sugestão)

1.  Monitorar logs do banco de dados para garantir que a trigger de sincronização `users` <-> `professionals` está funcionando para a nova role `PROFESSIONAL`.
2.  Criar dashboards de KPI específicos para CRC e PROFESSIONAL (atualmente os links redirecionam para dashboards existentes ou filtrados).
