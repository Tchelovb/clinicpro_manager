# 🧪 GUIA DE TESTES - SISTEMA HIGH-TICKET

## **PASSO 1: Executar Migration 007 (Recompensas)**

1. Abra o **Supabase SQL Editor**
2. Copie e cole o conteúdo de: `sql/migrations/007_referral_rewards.sql`
3. Execute
4. ✅ Deve retornar: "Query executed successfully"

---

## **PASSO 2: Executar Testes Automáticos**

1. No **Supabase SQL Editor**
2. Copie e cole o conteúdo de: `sql/migrations/TESTS_VALIDATION.sql`
3. Execute
4. ✅ Deve exibir mensagens de sucesso no console:
   - "Alerta crítico criado com sucesso!"
   - "✅ SUCESSO! Recompensa automática gerada para Maria Silva!"

---

## **PASSO 3: Testar no Frontend**

### **Teste A: Popup de Alerta Médico**
1. Acesse: `http://localhost:5173/#/patients`
2. Clique em qualquer paciente que tenha alerta crítico
3. ✅ **Popup vermelho bloqueante** deve aparecer automaticamente
4. Marque o checkbox "Li e estou ciente"
5. Clique em "Confirmar Ciência e Acessar"

### **Teste B: Dossiê High-Ticket**
1. Acesse qualquer paciente: `http://localhost:5173/#/patients/[id]`
2. Vá na aba **"Cadastro"**
3. Role até o final da página
4. ✅ Deve ver o **Dossiê High-Ticket** com:
   - Gradiente roxo/rosa
   - Avatar do paciente
   - Badge de Score (DIAMOND, GOLD, etc.)
   - Instagram, Profissão, Notas VIP
   - Galeria de fotos (4 slots)

### **Teste C: Dashboard de Indicações**
1. Acesse: `http://localhost:5173/#/dashboard/indicacoes`
2. ✅ Deve ver:
   - Cards de estatísticas (Total, Receita, Ticket Médio)
   - Leaderboard com "Maria Silva (Indicadora)" no topo
   - Badge 🥇 1º Lugar

### **Teste D: Dashboard de Recalls**
1. Acesse: `http://localhost:5173/#/dashboard/recalls`
2. ✅ Deve ver:
   - Cards de estatísticas
   - Abas: Todos, Pendentes, Para Hoje, Atrasados
   - Lista de recalls (vazia se não houver dados)

---

## **PASSO 4: Criar Dados de Teste Manualmente**

### **Criar Paciente com Dados High-Ticket:**
```sql
UPDATE patients 
SET 
    nickname = 'Janjão',
    occupation = 'Empresário',
    instagram_handle = '@joaosilva',
    marital_status = 'MARRIED',
    wedding_anniversary = '2015-03-15',
    vip_notes = 'Gosta de café sem açúcar. Prefere ar condicionado fraco. Sempre chega 10min adiantado.',
    patient_score = 'DIAMOND'
WHERE id = 'seu-patient-id-aqui';
```

### **Criar Alerta Médico para Paciente Existente:**
```sql
-- Primeiro, busque um patient_id real:
SELECT id, name FROM patients LIMIT 5;

-- Depois, use o ID real:
INSERT INTO medical_alerts (
    patient_id,
    alert_type,
    description,
    severity,
    is_critical,
    is_active
) VALUES (
    'cole-o-id-real-aqui',
    'ALLERGY',
    'Alergia severa a Penicilina - RISCO DE CHOQUE ANAFILÁTICO',
    'CRITICAL',
    true,
    true
);
```

---

## **VERIFICAÇÕES FINAIS**

### **✅ Checklist de Funcionalidades:**
- [ ] Migration 007 executada sem erros
- [ ] Teste automático criou Maria e João
- [ ] Recompensa de R$ 50 foi gerada automaticamente
- [ ] Popup de alerta aparece ao abrir paciente
- [ ] Dossiê High-Ticket exibe corretamente
- [ ] Dashboard de Indicações mostra leaderboard
- [ ] Dashboard de Recalls carrega sem erros

---

## **TROUBLESHOOTING**

### **Erro: "relation 'medical_alerts' does not exist"**
**Solução:** Execute a migration `004_ALL_P1_P2_MODULES.sql` primeiro.

### **Erro: "relation 'referral_rewards' does not exist"**
**Solução:** Execute a migration `007_referral_rewards.sql`.

### **Popup não aparece:**
**Solução:** 
1. Verifique se o paciente tem alertas críticos: `SELECT * FROM medical_alerts WHERE patient_id = 'id' AND is_critical = true;`
2. Limpe o cache do navegador (Ctrl+Shift+R)

### **Dossiê não aparece:**
**Solução:**
1. Verifique se os componentes foram importados corretamente em `PatientDetail.tsx`
2. Verifique o console do navegador para erros

---

## **PRÓXIMOS PASSOS**

Após validar tudo:
1. Popule o banco com pacientes reais
2. Configure o programa de indicações com sua equipe
3. Treine a recepção para usar os alertas médicos
4. Implemente notificações automáticas de recompensas

**Boa sorte! 🚀**
