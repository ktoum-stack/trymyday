import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n';
import '../styles/rtl.css';

import { translateText } from '../utils/translator';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const { i18n, t } = useTranslation();
    const [language, setLanguageState] = useState(localStorage.getItem('language') || 'FR');

    const translate = async (text) => {
        return await translateText(text, language.toLowerCase());
    };

    useEffect(() => {
        const lang = language.toLowerCase();
        i18n.changeLanguage(lang);
        document.documentElement.lang = lang;
        
        const isRTL = lang === 'ar';
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        
        if (isRTL) {
            document.body.classList.add('rtl-mode');
        } else {
            document.body.classList.remove('rtl-mode');
        }
        
        localStorage.setItem('language', language);
    }, [language, i18n]);

    const setLanguage = (lang) => {
        setLanguageState(lang);
    };

    // Helper to protect text from being translated
    const NoTranslate = ({ children, className = "" }) => (
        <span className={`notranslate ${className}`} translate="no">
            {children}
        </span>
    );

    return (
        <LanguageContext.Provider value={{ language, setLanguage, NoTranslate, t, translate }}>
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
