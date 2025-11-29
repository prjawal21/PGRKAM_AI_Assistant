import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { languageOptions } from '../i18n/translations';
import './LanguageSelector.css';

/**
 * Language Selector Component
 * Allows users to switch between English, Hindi, and Punjabi
 */
const LanguageSelector = ({ compact = false }) => {
    const { language, setLanguage, t } = useLanguage();

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
    };

    if (compact) {
        return (
            <select
                value={language}
                onChange={handleLanguageChange}
                className="language-selector-compact"
            >
                {languageOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.nativeLabel}
                    </option>
                ))}
            </select>
        );
    }

    return (
        <div className="language-selector">
            <label className="language-label">{t('selectLanguage')}</label>
            <div className="language-options">
                {languageOptions.map(option => (
                    <button
                        key={option.value}
                        className={`language-option ${language === option.value ? 'active' : ''}`}
                        onClick={() => setLanguage(option.value)}
                    >
                        <span className="language-native">{option.nativeLabel}</span>
                        <span className="language-english">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSelector;
