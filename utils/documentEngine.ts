interface DocumentData {
    patientName: string;
    patientCpf: string;
    professionalName: string;
    clinicName: string;
    clinicCnpj: string;
    clinicCity: string;
    totalValue: string;
    paymentMethod: string;
    items: Array<{ name: string; quantity: number }>;
    procedureName?: string;
}

export const generateDocumentContent = (templateContent: string, data: DocumentData): string => {
    let content = templateContent;

    // Native date formatting (pt-BR)
    const today = new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    const replacements: Record<string, string> = {
        '{{paciente_nome}}': data.patientName || '__________________',
        '{{paciente_cpf}}': data.patientCpf || '__________________',
        '{{profissional_nome}}': data.professionalName || '__________________',
        '{{clinica_nome}}': data.clinicName || 'Nossa Clínica',
        '{{clinica_cnpj}}': data.clinicCnpj || '__________________',
        '{{cidade_clinica}}': data.clinicCity || '_____________',
        '{{valor_total}}': data.totalValue || 'R$ 0,00',
        '{{forma_pagamento}}': data.paymentMethod || 'A combinar',
        '{{data_atual}}': today,
        '{{procedimento_nome}}': data.procedureName || 'procedimento',
    };

    Object.entries(replacements).forEach(([key, value]) => {
        content = content.replace(new RegExp(key, 'g'), value);
    });

    if (content.includes('{{procedimentos_lista_li}}')) {
        const listHtml = data.items
            .map(item => `<li>${item.quantity}x ${item.name}</li>`)
            .join('');
        content = content.replace(/{{procedimentos_lista_li}}/g, listHtml);
    }

    return content;
};
