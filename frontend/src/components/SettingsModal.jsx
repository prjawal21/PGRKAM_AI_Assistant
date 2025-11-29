import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import '../styles/dock.css';

/**
 * SettingsModal - Language preference settings
 */
const SettingsModal = ({ isOpen, onClose }) => {
    const { language, setLanguage, t } = useLanguage();

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'हिन्दी' },
        { code: 'pa', label: 'ਪੰਜਾਬੀ' }
    ];

    const handleLanguageChange = (langCode) => {
        setLanguage(langCode);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="settings-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="settings-modal"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>{t('settings')}</h2>

                        <div className="settings-option">
                            <label>{t('language')}</label>
                            <div className="language-buttons">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        className={`language-button ${language === lang.code ? 'active' : ''}`}
                                        onClick={() => handleLanguageChange(lang.code)}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="settings-close" onClick={onClose}>
                            {t('cancel')}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SettingsModal;
