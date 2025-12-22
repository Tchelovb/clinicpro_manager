import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Padrão: LIGHT (se não houver preferência salva)
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('clinicpro-theme');
        return (saved === 'dark' || saved === 'light') ? saved : 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove ambas as classes
        root.classList.remove('light', 'dark');

        // Adiciona a classe do tema atual
        root.classList.add(theme);

        // Persiste no localStorage
        localStorage.setItem('clinicpro-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
