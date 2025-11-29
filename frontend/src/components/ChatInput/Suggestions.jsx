import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Suggestions - Shows suggestion chips under the chat input
 * Now with language support
 */
const Suggestions = ({ onSuggestionClick, visible = true }) => {
    const { t } = useLanguage();

    const suggestions = [
        t('suggestion1'),
        t('suggestion2'),
        t('suggestion3')
    ];

    if (!visible) return null;

    return (
        <div style={styles.container}>
            {suggestions.map((suggestion, index) => (
                <button
                    key={index}
                    style={styles.chip}
                    onClick={() => onSuggestionClick(suggestion)}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                        e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.target.style.transform = 'translateY(0)';
                    }}
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
        marginTop: '16px',
        padding: '0 20px'
    },
    chip: {
        padding: '10px 20px',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }
};

export default Suggestions;
