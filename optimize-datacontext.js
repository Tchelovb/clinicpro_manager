const fs = require('fs');

// Lê o arquivo
const filePath = 'c:/Users/marce/OneDrive/Documentos/ClinicPro/contexts/DataContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Substitui o return com memoização
const oldReturn = `    };

    return (
        <DataContext.Provider
            value={{`;

const newReturn = `    };

    // Memoização do contexto para prevenir re-renders desnecessários
    const contextValue = useMemo(() => ({`;

content = content.replace(oldReturn, newReturn);

// Substitui o fechamento do Provider
const oldClose = `                financialSettings,
            }}
        >
            {children}
        </DataContext.Provider>
    );`;

const newClose = `                financialSettings,
    }), [
        theme,
        patients,
        appointments,
        leads,
        expenses,
        cashRegisters,
        currentRegister,
        globalFinancials,
        treatments,
        procedures,
        professionals,
        priceTables,
        insurancePlans,
        clinicConfig,
        agendaConfig,
        documents,
        templates,
        financialSettings,
    ]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );`;

content = content.replace(oldClose, newClose);

// Salva o arquivo
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ DataContext otimizado com useMemo!');
