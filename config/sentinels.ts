export interface Sentinel {
    id: string;
    pillarId: number;
    pillarName: string;
    name: string;
    description: string;
    target: string;
    correctionAction: string;
}

export const sentinels: Sentinel[] = [
    // 1. ATRAÇÃO
    { id: 'S1', pillarId: 1, pillarName: 'Atração', name: 'Volume de Leads', description: 'Total de novos contatos únicos cadastrados.', target: '> 300/mês', correctionAction: 'Aumentar tráfego pago; Revisar criativos.' },
    { id: 'S2', pillarId: 1, pillarName: 'Atração', name: 'Custo por Lead (CPL)', description: 'Investimento total / Volume de Leads.', target: '< R$ 50,00', correctionAction: 'Cortar campanhas de baixo desempenho.' },
    { id: 'S3', pillarId: 1, pillarName: 'Atração', name: 'Taxa de Agendamento', description: 'Leads que viraram consultas / Total de Leads.', target: '> 30%', correctionAction: 'Treinar SDR; Refinar script de atendimento.' },
    { id: 'S4', pillarId: 1, pillarName: 'Atração', name: 'Origem High Ticket', description: '% de Leads para Cervicoplastia/Lifting.', target: '> 40%', correctionAction: 'Direcionar copy para dores de envelhecimento.' },
    { id: 'S5', pillarId: 1, pillarName: 'Atração', name: 'Velocidade de Resposta', description: 'Tempo médio p/ 1º contato.', target: '< 15 min', correctionAction: 'Automação WhatsApp; Escala de plantão.' },

    // 2. CONVERSÃO
    { id: 'S6', pillarId: 2, pillarName: 'Conversão', name: 'Taxa de Show-up', description: 'Comparecimentos / Agendamentos.', target: '> 80%', correctionAction: 'Confirmação em 3 etapas (48h/24h/Manhã).' },
    { id: 'S7', pillarId: 2, pillarName: 'Conversão', name: 'Taxa de Fechamento', description: 'Vendas / Comparecimentos.', target: '> 35%', correctionAction: 'Treino de quebra de objeções; Script de venda.' },
    { id: 'S8', pillarId: 2, pillarName: 'Conversão', name: 'Ticket Médio', description: 'Faturamento Total / Nº Vendas.', target: '> R$ 15k', correctionAction: 'Ofertar procedimentos combinados (Upsell).' },
    { id: 'S9', pillarId: 2, pillarName: 'Conversão', name: 'Follow-up (S12)', description: 'Orçamentos sem resposta > 48h.', target: '0', correctionAction: 'Régua de cobrança automática; Missão Resgate.' },
    { id: 'S10', pillarId: 2, pillarName: 'Conversão', name: 'LTV (Lifetime Value)', description: 'Valor total gasto por paciente.', target: '> R$ 45k', correctionAction: 'Programas de fidelidade; Ciclo de manutenção.' },

    // 3. INOVAÇÃO (MIX)
    { id: 'S11', pillarId: 3, pillarName: 'Inovação', name: '% Cirurgias de Face', description: 'Share de Cervicoplastia/Lifting no faturamento.', target: '> 60%', correctionAction: 'Marketing visual em face; Casos clínicos.' },
    { id: 'S12', pillarId: 3, pillarName: 'Inovação', name: 'Novas Tecnologias', description: 'Adoção de novos protocolos.', target: '1/Semestre', correctionAction: 'Participar de congressos; Workshop fornecedores.' },
    { id: 'S13', pillarId: 3, pillarName: 'Inovação', name: 'Diferenciação', description: 'Score de percepção valor vs concorrência.', target: 'Top 10%', correctionAction: 'Branding de luxo; Experiência única.' },
    { id: 'S14', pillarId: 3, pillarName: 'Inovação', name: 'Capacitação Técnica', description: 'Horas de estudo da equipe.', target: '> 40h/ano', correctionAction: 'Cursos hands-on; Mentorias.' },
    { id: 'S15', pillarId: 3, pillarName: 'Inovação', name: 'Portfólio de Resultados', description: 'Casos documentados padronizados.', target: '100%', correctionAction: 'Protocolo de fotografia; Estúdio na clínica.' },

    // 4. LUCRO
    { id: 'S16', pillarId: 4, pillarName: 'Lucro', name: 'Margem Blindada', description: 'Bloqueio de orçamentos com margem < 20%.', target: '100%', correctionAction: 'Renegociar custos; Aumentar tabela.' },
    { id: 'S17', pillarId: 4, pillarName: 'Lucro', name: 'Custos Fixos/Var.', description: 'Proporção de custos sobre receita.', target: '< 60%', correctionAction: 'Auditoria de gastos; Troca de fornecedores.' },
    { id: 'S18', pillarId: 4, pillarName: 'Lucro', name: 'Ponto de Equilíbrio', description: 'Dia do mês para pagar contas.', target: 'Dia 15', correctionAction: 'Antecipar vendas início do mês; Reduzir fixos.' },
    { id: 'S19', pillarId: 4, pillarName: 'Lucro', name: 'EBITDA', description: 'Lucro operacional real.', target: '> 25%', correctionAction: 'Otimização fiscal; Gestão de recursos.' },
    { id: 'S20', pillarId: 4, pillarName: 'Lucro', name: 'Fluxo de Caixa', description: 'Sustentabilidade financeira (Runway).', target: '+3 Meses', correctionAction: 'Antecipação inteligente; Controle inadimplência.' },

    // 5. GENTE
    { id: 'S21', pillarId: 5, pillarName: 'Gente', name: 'XP do Staff', description: 'Produtividade da equipe.', target: '> 90', correctionAction: 'Gamificação; Feedback semanal.' },
    { id: 'S22', pillarId: 5, pillarName: 'Gente', name: 'eNPS', description: 'Satisfação dos colaboradores.', target: '> 70', correctionAction: 'Pesquisa de clima; Benefícios.' },
    { id: 'S23', pillarId: 5, pillarName: 'Gente', name: 'Treino Comercial', description: 'Frequência de roleplay.', target: 'Semanal', correctionAction: 'Reunião matinal (Daily); Simulação.' },
    { id: 'S24', pillarId: 5, pillarName: 'Gente', name: 'Turnover', description: 'Rotatividade de equipe.', target: '< 10%/ano', correctionAction: 'Plano de carreira; Contratação fit cultural.' },
    { id: 'S25', pillarId: 5, pillarName: 'Gente', name: 'Bônus por Meta', description: '% do lucro compartilhado.', target: 'Variável', correctionAction: 'Definir gatilhos para meritocracia.' },

    // 6. OPERAÇÃO
    { id: 'S26', pillarId: 6, pillarName: 'Operação', name: 'Ocupação de Sala', description: 'Tempo de sala vendido vs disponível.', target: '> 70%', correctionAction: 'Otimizar agenda; Blocos cirúrgicos.' },
    { id: 'S27', pillarId: 6, pillarName: 'Operação', name: 'Tempo de Cirurgia', description: 'Duração real vs prevista.', target: '< 10% var', correctionAction: 'Revisar técnica; Preparo de sala.' },
    { id: 'S28', pillarId: 6, pillarName: 'Operação', name: 'Taxa de Retrabalho', description: 'Retoques não cobrados.', target: '< 3%', correctionAction: 'Alinhamento expectativa; Técnica.' },
    { id: 'S29', pillarId: 6, pillarName: 'Operação', name: 'Giro de Estoque', description: 'Consumo de insumos high-ticket.', target: '< 30 dias', correctionAction: 'Compras Just-in-Time.' },
    { id: 'S30', pillarId: 6, pillarName: 'Operação', name: 'Manutenção Prev.', description: 'Status equipamentos.', target: '100% Dia', correctionAction: 'Checklist diário; Calendário manutenção.' },

    // 7. COMPLIANCE
    { id: 'S31', pillarId: 7, pillarName: 'Compliance', name: 'TCLE Assinado', description: 'Termos de consentimento assinados.', target: '100%', correctionAction: 'Bloqueio prontuário s/ TCLE; Tablet recepção.' },
    { id: 'S32', pillarId: 7, pillarName: 'Compliance', name: 'Alvarás & Licenças', description: 'Validade documentos regulatórios.', target: 'Válidos', correctionAction: 'Cronograma renovação; Responsável técnico.' },
    { id: 'S33', pillarId: 7, pillarName: 'Compliance', name: 'Auditoria Pront.', description: 'Completude registros clínicos.', target: 'Score 100', correctionAction: 'Auditoria mensal; Treinamento.' },
    { id: 'S34', pillarId: 7, pillarName: 'Compliance', name: 'Normas VISA', description: 'Protocolos biossegurança.', target: '100%', correctionAction: 'Checklist expurgo/esterilização.' },
    { id: 'S35', pillarId: 7, pillarName: 'Compliance', name: 'LGPD', description: 'Conformidade dados sensíveis.', target: 'Total', correctionAction: 'Treinamento sigilo; Sistemas seguros.' },

    // 8. EXPERIÊNCIA (CX)
    { id: 'S36', pillarId: 8, pillarName: 'Experiência', name: 'NPS (Clientes)', description: 'Net Promoter Score.', target: '> 75', correctionAction: 'Pesquisa pós-atendimento; Resolução ativa.' },
    { id: 'S37', pillarId: 8, pillarName: 'Experiência', name: 'Tempo Espera', description: 'Tempo aguardando na recepção.', target: '< 10 min', correctionAction: 'Ajuste agenda; Conforto sala.' },
    { id: 'S38', pillarId: 8, pillarName: 'Experiência', name: 'Avaliações Google', description: 'Quantidade/Nota GMB.', target: '5.0 (50+)', correctionAction: 'Solicitação ativa via QR Code.' },
    { id: 'S39', pillarId: 8, pillarName: 'Experiência', name: 'Taxa Reclamação', description: 'Ocorrências SAC.', target: '< 1%', correctionAction: 'Plano ação imediato; Recovery Paradox.' },
    { id: 'S40', pillarId: 8, pillarName: 'Experiência', name: 'Fator UAU', description: 'Entrega de experiência extra.', target: '100% Pcts', correctionAction: 'Padronizar kit pós-op; Concierge.' },

    // 9. TECNOLOGIA
    { id: 'S41', pillarId: 9, pillarName: 'Tecnologia', name: 'Uptime Sistema', description: 'Disponibilidade ferramentas.', target: '99.9%', correctionAction: 'Internet redundante; Servidores.' },
    { id: 'S42', pillarId: 9, pillarName: 'Tecnologia', name: 'Automação Msg', description: '% Contatos via bot.', target: '> 50%', correctionAction: 'Implementar CRM/ChatBOS.' },
    { id: 'S43', pillarId: 9, pillarName: 'Tecnologia', name: 'Integridade Dados', description: 'Unificação Financeiro/Agenda.', target: '100%', correctionAction: 'Conciliação diária.' },
    { id: 'S44', pillarId: 9, pillarName: 'Tecnologia', name: 'App Paciente', description: 'Adesão ao portal/app.', target: '> 40%', correctionAction: 'Campanha incentivo; Facilidade uso.' },
    { id: 'S45', pillarId: 9, pillarName: 'Tecnologia', name: 'Segurança Info', description: 'Backups realizados.', target: 'Diário', correctionAction: 'Backup nuvem; Teste restore.' },

    // 10. VISÃO
    { id: 'S46', pillarId: 10, pillarName: 'Visão', name: 'Novos Produtos', description: '% Faturamento via lançamentos.', target: '> 15%', correctionAction: 'P&D interno; Benchmarking.' },
    { id: 'S47', pillarId: 10, pillarName: 'Visão', name: 'Caixa (Opex)', description: 'Meses de runway.', target: '> 6 Meses', correctionAction: 'Aporte reserva; Reduzir retiradas.' },
    { id: 'S48', pillarId: 10, pillarName: 'Visão', name: 'Investimento', description: '% Reinvestimento na clínica.', target: '10-20%', correctionAction: 'Planejamento Capex.' },
    { id: 'S49', pillarId: 10, pillarName: 'Visão', name: 'Valuation', description: 'Crescimento valor empresa.', target: '> 20% a.a.', correctionAction: 'Governança; Auditoria externa.' },
    { id: 'S50', pillarId: 10, pillarName: 'Visão', name: 'Sucessão', description: 'Preparação lideranças.', target: 'Em andam.', correctionAction: 'Manual cultura; Plano sucessão.' },
];
