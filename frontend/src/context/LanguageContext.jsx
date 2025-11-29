import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { t as translate, translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        // Get language from localStorage or default to English
        const saved = localStorage.getItem('pgrkam_language');
        // Convert old format (en-US) to new format (en)
        if (saved === 'en-US') return 'en';
        if (saved === 'hi-IN') return 'hi';
        if (saved === 'pa-IN') return 'pa';
        return saved || 'en';
    });

    useEffect(() => {
        // Save language preference to localStorage
        localStorage.setItem('pgrkam_language', language);
    }, [language]);

    // Use useMemo to recreate the t function when language changes
    const t = useMemo(() => (key) => translate(key, language), [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
