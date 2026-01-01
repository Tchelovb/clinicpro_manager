const fs = require('fs');

const filePath = 'c:/Users/marce/OneDrive/Documentos/ClinicPro/contexts/DataContext.tsx';

// Lê o arquivo
let lines = fs.readFileSync(filePath, 'utf8').split('\r\n');

// Encontra a linha com "return ("
let returnLineIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'return (' && i > 1400) {
        returnLineIndex = i;
        break;
    }
}

if (returnLineIndex === -1) {
    console.error('❌ Não encontrou "return (" no arquivo');
    process.exit(1);
}

// Insere o contextValue antes do return
const memoizationCode = [
    '',
    '    // Memoização do contexto para prevenir re-renders desnecessários',
    '    const contextValue = useMemo(() => ({',
    '        theme,',
    '        toggleTheme,',
    '        patients,',
    '        appointments,',
    '        leads,',
    '        expenses,',
    '        cashRegisters,',
    '        currentRegister,',
    '        globalFinancials,',
    '        treatments,',
    '        procedures,',
    '        professionals,',
    '        priceTables,',
    '        insurancePlans,',
    '        clinicConfig,',
    '        agendaConfig,',
    '        documents,',
    '        templates,',
    '        addPatient,',
    '        updatePatient,',
    '        addLead,',
    '        updateLead,',
    '        addAppointment,',
    '        updateAppointment,',
    '        deleteAppointment,',
    '        updateAgendaConfig,',
    '        addProcedure,',
    '        updateProcedure,',
    '        deleteProcedure,',
    '        addProfessional,',
    '        updateProfessional,',
    '        updateClinicConfig,',
    '        addPriceTable,',
    '        updatePriceTable,',
    '        addInsurancePlan,',
    '        updateInsurancePlan,',
    '        addTemplate,',
    '        updateTemplate,',
    '        deleteTemplate,',
    '        createDocument,',
    '        signDocument,',
    '        deleteDocument,',
    '        createBudget,',
    '        updateBudget,',
    '        deleteBudget,',
    '        approveBudget,',
    '        cancelBudget,',
    '        sendToNegotiation,',
    '        refreshPatientData,',
    '        startTreatment,',
    '        concludeTreatment,',
    '        receivePayment,',
    '        addClinicalNote,',
    '        openRegister,',
    '        closeRegister,',
    '        addExpense,',
    '        payExpense,',
    '        financialSettings,',
    '    }), [',
    '        theme,',
    '        patients,',
    '        appointments,',
    '        leads,',
    '        expenses,',
    '        cashRegisters,',
    '        currentRegister,',
    '        globalFinancials,',
    '        treatments,',
    '        procedures,',
    '        professionals,',
    '        priceTables,',
    '        insurancePlans,',
    '        clinicConfig,',
    '        agendaConfig,',
    '        documents,',
    '        templates,',
    '        financialSettings,',
    '    ]);',
];

// Insere antes do return
lines.splice(returnLineIndex, 0, ...memoizationCode);

// Agora precisa mudar o <DataContext.Provider value={{ para value={contextValue}
// Procura a linha com "value={{"
let providerLineIndex = -1;
for (let i = returnLineIndex + memoizationCode.length; i < Math.min(returnLineIndex + memoizationCode.length + 10, lines.length); i++) {
    if (lines[i].includes('value={{')) {
        providerLineIndex = i;
        break;
    }
}

if (providerLineIndex !== -1) {
    lines[providerLineIndex] = lines[providerLineIndex].replace('value={{', 'value={contextValue}');

    // Remove todas as linhas até encontrar "}}"
    let endIndex = providerLineIndex + 1;
    while (endIndex < lines.length && !lines[endIndex].includes('}}')) {
        endIndex++;
    }

    if (endIndex < lines.length) {
        // Remove as linhas entre value={contextValue} e }}
        lines.splice(providerLineIndex + 1, endIndex - providerLineIndex);
    }
}

// Salva o arquivo
fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
console.log('✅ DataContext otimizado com useMemo!');
console.log(`📍 Memoização inserida na linha ${returnLineIndex}`);
console.log(`📍 Provider atualizado na linha ${providerLineIndex}`);
